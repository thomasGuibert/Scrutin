import AdmZip from "adm-zip";
import path from "node:path";
import type {
  ResultatScrutin,
  Scrutin,
  ScrutinRepository,
} from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Scrutins.json.zip"
);

type RawDecompte = {
  pour: string;
  contre: string;
  abstentions: string;
};

type RawGroupeVote = {
  organeRef: string;
  nombreMembresGroupe: string;
  vote: { decompteVoix: RawDecompte };
};

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
    dateScrutin: string;
    numero: string;
    sort: { code: string };
    objet: { dossierLegislatif: { dossierRef: string } | null };
    syntheseVote: { decompte: RawDecompte };
    ventilationVotes: {
      organe: { groupes: { groupe: RawGroupeVote | RawGroupeVote[] } };
    };
  };
};

function parseCount(raw: string, field: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Scrutin : décompte "${field}" invalide ("${raw}").`);
  }
  return value;
}

function parseDecompte(raw: RawDecompte) {
  return {
    pour: parseCount(raw.pour, "pour"),
    contre: parseCount(raw.contre, "contre"),
    abstentions: parseCount(raw.abstentions, "abstentions"),
  };
}

function parseResultat(code: string): ResultatScrutin {
  if (code !== "adopté" && code !== "rejeté") {
    throw new Error(`Scrutin : sort "${code}" inconnu (ni adopté, ni rejeté).`);
  }
  return code;
}

// L'export AN sérialise un élément XML répété comme un tableau,
// mais comme un objet unique quand il n'y en a qu'un seul.
function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

// organeRef historiques confirmés dans l'export AN, à faire correspondre à
// l'organeRef actuel du même groupe déclaré dans le référentiel (spi/filesystem/groupes.ts) :
// - "PO0" (14 scrutins/8434) : anomalie, le RN y apparaît sous ce code au lieu
//   de PO845401 — jamais les deux en même temps, effectif cohérent avec le RN.
// - "PO847173" (3041 scrutins, jusqu'au 2025-07-10) : ancien organeRef de l'UDR
//   avant sa nouvelle immatriculation sous PO872880 (utilisé à partir du
//   2025-09-08, sans chevauchement) — effectif stable (~15-17) des deux côtés.
const ORGANE_REF_ALIAS: Record<string, string> = {
  PO0: "PO845401",
  PO847173: "PO872880",
};
function normaliserOrganeRef(organeRef: string): string {
  return ORGANE_REF_ALIAS[organeRef] ?? organeRef;
}

// Certains scrutins portent bien sur un dossier législatif réel, mais
// l'export AN laisse leur "objet.dossierLegislatif" à null (lacune connue de
// la donnée source, pas une absence réelle de lien) — curation manuelle
// (cf. CONTEXT.md, Tag d'impact et rattachement) vérifiée par rapprochement
// de titre/date avec le dossier concerné :
// - VTANR5L17V1304 : "l'ensemble de la proposition de loi organique visant
//   à harmoniser le mode de scrutin aux élections municipales..." — seul
//   autre scrutin lié à DLR5L17N50579 dans l'export
//   est une motion procédurale (prolongation de séance), sans lien vers ce
//   vote de fond pourtant bien réel (numéro 1304, adopté).
// - Lot 1/6 de l'audit #33 (issue #34) : 21 dossiers dont tous les scrutins
//   ont "objet.dossierLegislatif" à null dans l'export AN, retrouvés par
//   rapprochement de titre (méthode de #33) entre le scrutin décisif
//   ("l'ensemble de..."/"l'article unique de...") et Dossiers_Legislatifs.json.zip.
//   Chaque entrée est annotée du fragment de titre du scrutin décisif ayant
//   servi au rapprochement, dans le même esprit de traçabilité que VTANR5L17V1304.
const DOSSIER_REF_OVERRIDE: Record<string, string> = {
  VTANR5L17V1304: "DLR5L17N50579",
  // "l'ensemble de la proposition de loi portant réparation des personnes
  // condamnées pour homosexualité entre 1945 et 1982" (2e lecture, adopté)
  VTANR5L17V4836: "DLR5L16N46127",
  // "l'ensemble de la proposition de loi... relative à l'instauration d'un
  // nombre minimum de soignants par patient hospitalisé" (1re lecture, adopté)
  VTANR5L17V600: "DLR5L16N46650",
  // "l'ensemble de la proposition de loi visant à interdire les dispositifs
  // électroniques de vapotage à usage unique" (texte CMP, adopté)
  VTANR5L17V692: "DLR5L16N46655",
  // "l'article unique de la proposition de loi visant à mettre en place un
  // registre national des cancers" (1re lecture, adopté)
  VTANR5L17V2633: "DLR5L16N47676",
  // "l'article unique de la proposition de loi créant une dérogation à la
  // participation minimale pour la maîtrise d'ouvrage pour les communes
  // rurales" (1re lecture, adopté)
  VTANR5L17V946: "DLR5L16N48701",
  // "l'article unique de la proposition de loi visant à proroger la loi
  // n° 2017-285 du 6 mars 2017 relative à l'assainissement cadastral..."
  // (1re lecture, adopté)
  VTANR5L17V654: "DLR5L16N48725",
  // "l'ensemble de la proposition de loi créant l'homicide routier et
  // visant à lutter contre la violence routière" (2e lecture, adopté)
  VTANR5L17V2217: "DLR5L16N48739",
  // "l'ensemble de la proposition de loi visant à faciliter la
  // transformation des bureaux et autres bâtiments en logements"
  // (texte CMP, adopté)
  VTANR5L17V2215: "DLR5L16N49107",
  // "l'ensemble de la proposition de loi relative au renforcement de la
  // sûreté dans les transports" (texte CMP, adopté)
  VTANR5L17V1041: "DLR5L16N49176",
  // "l'ensemble de la proposition de loi visant à réduire et à encadrer
  // les frais bancaires sur succession" (2e lecture, adopté)
  VTANR5L17V504: "DLR5L16N49258",
  // "l'ensemble de la proposition de loi portant création d'un statut de
  // l'élu local" (2e lecture, adopté)
  VTANR5L17V4691: "DLR5L16N49280",
  // "l'ensemble de la proposition de loi visant à renforcer la sécurité
  // des professionnels de santé" (texte CMP, adopté)
  VTANR5L17V2685: "DLR5L16N49299",
  // "l'ensemble de la proposition de loi visant à protéger la population
  // des risques liés aux substances per- et polyfluoroalkylées"
  // (2e lecture, adopté)
  VTANR5L17V852: "DLR5L16N49455",
  // "l'ensemble de la proposition de loi visant à endiguer la prolifération
  // du frelon asiatique et à préserver la filière apicole" (1re lecture, adopté)
  VTANR5L17V914: "DLR5L16N49472",
  // "l'ensemble du projet de loi d'orientation pour la souveraineté
  // alimentaire et agricole et le renouvellement des générations en
  // agriculture" (texte CMP, adopté)
  VTANR5L17V844: "DLR5L16N49726",
  // "l'ensemble de la proposition de loi... pour améliorer la prise en
  // charge de la sclérose latérale amyotrophique et d'autres maladies
  // évolutives graves" (1re lecture, adopté)
  VTANR5L17V740: "DLR5L16N49796",
  // "l'ensemble de la proposition de loi visant à améliorer la prise en
  // charge des soins et dispositifs spécifiques au traitement du cancer
  // du sein par l'assurance maladie" (2e lecture, adopté)
  VTANR5L17V658: "DLR5L16N49801",
  // "l'ensemble de la proposition de loi visant à permettre l'élection du
  // maire d'une commune nouvelle en cas de conseil municipal incomplet"
  // (1re lecture, adopté)
  VTANR5L17V742: "DLR5L16N49843",
  // "l'ensemble de la proposition de loi visant à assouplir la gestion des
  // compétences 'eau' et 'assainissement'" (1re lecture, adopté)
  VTANR5L17V997: "DLR5L16N49927",
  // "l'ensemble de la proposition de loi visant à sécuriser le mécanisme
  // de purge des nullités" (1re lecture, adopté)
  VTANR5L17V452: "DLR5L16N50082",
  // "l'article unique du projet de loi autorisant la ratification de la
  // convention n° 155 sur la sécurité et la santé des travailleurs, 1981"
  // (1re lecture, adopté)
  VTANR5L17V3057: "DLR5L16N50115",
};

function normaliserDossierRef(
  uid: string,
  dossierRef: string | null
): string | null {
  return dossierRef ?? DOSSIER_REF_OVERRIDE[uid] ?? null;
}

function parseScrutin(raw: RawScrutinFile): Scrutin {
  const groupes = toArray(raw.scrutin.ventilationVotes.organe.groupes.groupe);

  return {
    uid: raw.scrutin.uid,
    titre: raw.scrutin.titre,
    date: raw.scrutin.dateScrutin,
    dossierRef: normaliserDossierRef(
      raw.scrutin.uid,
      raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null
    ),
    decompte: parseDecompte(raw.scrutin.syntheseVote.decompte),
    numero: parseCount(raw.scrutin.numero, "numero"),
    resultat: parseResultat(raw.scrutin.sort.code),
    positionsParGroupe: groupes.map((groupe) => ({
      organeRef: normaliserOrganeRef(groupe.organeRef),
      decompte: parseDecompte(groupe.vote.decompteVoix),
      effectif: parseCount(
        groupe.nombreMembresGroupe,
        "nombreMembresGroupe"
      ),
    })),
  };
}

export class FilesystemScrutinRepository implements ScrutinRepository {
  private zip: AdmZip | null = null;
  private indexParDossier: Map<string, Scrutin[]> | null = null;

  constructor(private readonly zipPath: string = ZIP_PATH) {}

  // L'archive (~40 Mo, 8000+ entrées) est coûteuse à ouvrir et à indexer ;
  // une seule instance est réutilisée par les deux méthodes de ce repository
  // plutôt que d'être reconstruite à chaque appel.
  private getZip(): AdmZip {
    if (!this.zip) {
      this.zip = new AdmZip(this.zipPath);
    }
    return this.zip;
  }

  async getByUid(uid: string): Promise<Scrutin | null> {
    const entry = this.getZip().getEntry(`json/${uid}.json`);
    if (!entry) {
      return null;
    }

    const raw = JSON.parse(
      entry.getData().toString("utf-8")
    ) as RawScrutinFile;

    return parseScrutin(raw);
  }

  async getByDossierRef(dossierRef: string): Promise<Scrutin[]> {
    return this.getIndexParDossier().get(dossierRef) ?? [];
  }

  // Construit l'index dossierRef -> scrutins en un seul passage sur les 8000+
  // entrées de l'archive, plutôt que de la reparcourir en entier à chaque
  // dossier demandé (le nombre de dossiers classés a fini par rendre ce
  // deuxième coût prohibitif : pages theme/sous-theme/dossier appellent
  // getByDossierRef pour chaque dossier de leur périmètre).
  private getIndexParDossier(): Map<string, Scrutin[]> {
    if (!this.indexParDossier) {
      const index = new Map<string, Scrutin[]>();

      for (const entry of this.getZip().getEntries()) {
        if (!entry.entryName.startsWith("json/") || entry.isDirectory) {
          continue;
        }

        const raw = JSON.parse(
          entry.getData().toString("utf-8")
        ) as RawScrutinFile;

        // Le dossierRef (brut ou corrigé par curation manuelle) détermine
        // s'il vaut la peine de parser intégralement ce scrutin — sans quoi
        // les entrées de test volontairement invalides hors de tout dossier
        // (décompte non numérique, sort inconnu) feraient échouer la
        // construction de l'index avant même d'atteindre le dossier demandé.
        const dossierRef = normaliserDossierRef(
          raw.scrutin.uid,
          raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null
        );
        if (!dossierRef) {
          continue;
        }

        const scrutins = index.get(dossierRef) ?? [];
        scrutins.push(parseScrutin(raw));
        index.set(dossierRef, scrutins);
      }

      this.indexParDossier = index;
    }

    return this.indexParDossier;
  }
}
