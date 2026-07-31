import AdmZip from "adm-zip";
import path from "node:path";
import type { Scrutin, ScrutinRepository } from "@/domain/scrutin";

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

function parseScrutin(raw: RawScrutinFile): Scrutin {
  const groupes = toArray(raw.scrutin.ventilationVotes.organe.groupes.groupe);

  return {
    uid: raw.scrutin.uid,
    titre: raw.scrutin.titre,
    date: raw.scrutin.dateScrutin,
    dossierRef: raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null,
    decompte: parseDecompte(raw.scrutin.syntheseVote.decompte),
    numero: parseCount(raw.scrutin.numero, "numero"),
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
    const scrutins: Scrutin[] = [];

    for (const entry of this.getZip().getEntries()) {
      if (!entry.entryName.startsWith("json/") || entry.isDirectory) {
        continue;
      }

      const raw = JSON.parse(
        entry.getData().toString("utf-8")
      ) as RawScrutinFile;

      if (raw.scrutin.objet.dossierLegislatif?.dossierRef === dossierRef) {
        scrutins.push(parseScrutin(raw));
      }
    }

    return scrutins;
  }
}
