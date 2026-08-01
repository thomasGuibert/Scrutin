import AdmZip from "adm-zip";
import path from "node:path";
import type { AmendementDetail, AmendementRepository } from "@/domain/amendement";
import { extraireAmendement, type Scrutin } from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Amendements-scrutins-classifies.json.zip"
);

// L'export AN garde la sémantique XML "nil" pour un champ vide : dateSort
// vaut alors un objet `{ "@xsi:nil": "true" }` plutôt que null ou une
// chaîne (vérifié sur des amendements jamais tranchés, ex. déclarés
// irrecevables) — jamais un `string | null` simple.
type ValeurOuNil = string | { "@xsi:nil"?: string };

// Un amendement déclaré irrecevable (ex. article 40 de la Constitution) n'a
// ni dispositif ni exposé des motifs — corps.contenuAuteur est alors lui
// aussi un objet "nil" plutôt que { dispositif, exposeSommaire } (vérifié
// sur des données réelles).
type RawAmendementFile = {
  amendement: {
    corps: {
      contenuAuteur:
        | { dispositif: string; exposeSommaire: string }
        | { "@xsi:nil"?: string };
    };
    cycleDeVie: {
      dateSort: ValeurOuNil;
    };
  };
};

// Le dispositif/exposé des motifs bruts sont du HTML (entités numériques +
// balises <p> uniquement, vérifié sur les données réelles de l'AN) —
// nettoyés en texte brut pour rester affichables par ScrutinBrief sans
// changer ce composant (pas de rendu HTML).
function decoderEntitesHtml(texte: string): string {
  return texte
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function htmlVersTexte(html: string): string {
  // Décodé deux fois : une partie du jeu de données AN a des entités
  // doublement échappées ("&amp;nbsp;" au lieu de "&nbsp;", vérifié sur des
  // données réelles) — un seul passage laisserait un "&nbsp;" littéral
  // après décodage du "&amp;" qui le précédait. Décoder AVANT de retirer
  // les balises (plutôt qu'après) permet aussi de retirer les
  // pseudo-balises révélées par ce décodage (ex. "&lt;sup&gt;" mal formé).
  const decode = (s: string) => decoderEntitesHtml(decoderEntitesHtml(s));

  return decode(html)
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type AmendementAvecContenu = RawAmendementFile & {
  amendement: {
    corps: { contenuAuteur: { dispositif: string; exposeSommaire: string } };
  };
};

function lireAmendement(entry: AdmZip.IZipEntry): RawAmendementFile {
  return JSON.parse(entry.getData().toString("utf-8")) as RawAmendementFile;
}

function aDuContenuReel(raw: RawAmendementFile): raw is AmendementAvecContenu {
  return typeof (raw.amendement.corps.contenuAuteur as { dispositif?: unknown })
    .dispositif === "string";
}

// Un même numéro d'amendement peut apparaître dans plusieurs
// texteLegislatifRef (une lecture différente ne le renumérote pas, mais le
// dossier peut être voté à plusieurs lectures). Parmi les candidats ayant
// un contenu réel (cf. aDuContenuReel — un candidat irrecevable/nil est
// écarté même s'il correspond par ailleurs), on retient celui dont la date
// de décision (partie date de cycleDeVie.dateSort) correspond à la date du
// scrutin ; à défaut, n'importe lequel avec du contenu réel ; s'il n'y en a
// aucun, aucune correspondance (repli sur la Fiche générique).
function choisirCandidat(
  candidats: AdmZip.IZipEntry[],
  dateScrutin: string
): AmendementAvecContenu | null {
  const avecContenu = candidats.map(lireAmendement).filter(aDuContenuReel);

  if (avecContenu.length === 0) {
    return null;
  }

  const correspondant = avecContenu.find((raw) => {
    const dateSort = raw.amendement.cycleDeVie.dateSort;
    return typeof dateSort === "string" && dateSort.slice(0, 10) === dateScrutin;
  });

  return correspondant ?? avecContenu[0];
}

export class FilesystemAmendementRepository implements AmendementRepository {
  private zip: AdmZip | null = null;
  private indexParDossierEtNumero: Map<string, AdmZip.IZipEntry[]> | null =
    null;

  constructor(private readonly zipPath: string = ZIP_PATH) {}

  // Cf. FilesystemScrutinRepository : une seule instance/un seul index
  // réutilisés plutôt que reconstruits à chaque scrutin demandé.
  private getZip(): AdmZip {
    if (!this.zip) {
      this.zip = new AdmZip(this.zipPath);
    }
    return this.zip;
  }

  private getIndex(): Map<string, AdmZip.IZipEntry[]> {
    if (!this.indexParDossierEtNumero) {
      const index = new Map<string, AdmZip.IZipEntry[]>();

      for (const entry of this.getZip().getEntries()) {
        if (entry.isDirectory) {
          continue;
        }

        // json/<dossierRef>/<texteLegislatifRef>/<fichier>.json
        const parts = entry.entryName.split("/");
        if (parts.length !== 4 || parts[0] !== "json") {
          continue;
        }

        const numeroMatch = parts[3].match(/N(\d{6})\.json$/);
        if (!numeroMatch) {
          continue;
        }

        const cle = `${parts[1]}::${numeroMatch[1]}`;
        const liste = index.get(cle) ?? [];
        liste.push(entry);
        index.set(cle, liste);
      }

      this.indexParDossierEtNumero = index;
    }

    return this.indexParDossierEtNumero;
  }

  async getByScrutin(scrutin: Scrutin): Promise<AmendementDetail | null> {
    if (!scrutin.dossierRef) {
      return null;
    }

    const amendement = extraireAmendement(scrutin.titre);
    if (!amendement) {
      return null;
    }

    const cle = `${scrutin.dossierRef}::${amendement.numero.padStart(6, "0")}`;
    const candidats = this.getIndex().get(cle) ?? [];
    if (candidats.length === 0) {
      return null;
    }

    const raw = choisirCandidat(candidats, scrutin.date);
    if (!raw) {
      return null;
    }

    return {
      dispositif: htmlVersTexte(raw.amendement.corps.contenuAuteur.dispositif),
      exposeSommaire: htmlVersTexte(
        raw.amendement.corps.contenuAuteur.exposeSommaire
      ),
    };
  }
}
