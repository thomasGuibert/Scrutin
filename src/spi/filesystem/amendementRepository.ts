import AdmZip from "adm-zip";
import path from "node:path";
import type { AmendementDetail, AmendementRepository } from "@/domain/amendement";
import { extraireAmendement, type Scrutin } from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Amendements-scrutins-classifies.json.zip"
);

type RawAmendementFile = {
  amendement: {
    corps: {
      contenuAuteur: {
        dispositif: string;
        exposeSommaire: string;
      };
    };
    cycleDeVie: {
      dateSort: string | null;
      sort: string;
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
  const sansBalises = html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decoderEntitesHtml(sansBalises)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Un même numéro d'amendement peut apparaître dans plusieurs
// texteLegislatifRef (une lecture différente ne le renumérote pas, mais le
// dossier peut être voté à plusieurs lectures). On retient celui dont la
// date de décision (partie date de cycleDeVie.dateSort) correspond à la
// date du scrutin ; à défaut (candidat unique, ou aucune date ne
// correspond), le premier candidat.
function choisirCandidat(
  candidats: AdmZip.IZipEntry[],
  dateScrutin: string
): AdmZip.IZipEntry {
  if (candidats.length === 1) {
    return candidats[0];
  }

  const correspondant = candidats.find((entry) => {
    const raw = JSON.parse(
      entry.getData().toString("utf-8")
    ) as RawAmendementFile;
    return raw.amendement.cycleDeVie.dateSort?.slice(0, 10) === dateScrutin;
  });

  return correspondant ?? candidats[0];
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

    const entry = choisirCandidat(candidats, scrutin.date);
    const raw = JSON.parse(
      entry.getData().toString("utf-8")
    ) as RawAmendementFile;

    return {
      dispositif: htmlVersTexte(raw.amendement.corps.contenuAuteur.dispositif),
      exposeSommaire: htmlVersTexte(
        raw.amendement.corps.contenuAuteur.exposeSommaire
      ),
    };
  }
}
