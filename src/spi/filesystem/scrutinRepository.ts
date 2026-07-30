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
  vote: { decompteVoix: RawDecompte };
};

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
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

export class FilesystemScrutinRepository implements ScrutinRepository {
  constructor(private readonly zipPath: string = ZIP_PATH) {}

  async getByUid(uid: string): Promise<Scrutin | null> {
    const zip = new AdmZip(this.zipPath);
    const entry = zip.getEntry(`json/${uid}.json`);
    if (!entry) {
      return null;
    }

    const raw = JSON.parse(
      entry.getData().toString("utf-8")
    ) as RawScrutinFile;
    const groupes = toArray(raw.scrutin.ventilationVotes.organe.groupes.groupe);

    return {
      uid: raw.scrutin.uid,
      titre: raw.scrutin.titre,
      decompte: parseDecompte(raw.scrutin.syntheseVote.decompte),
      positionsParGroupe: groupes.map((groupe) => ({
        organeRef: groupe.organeRef,
        decompte: parseDecompte(groupe.vote.decompteVoix),
      })),
    };
  }
}
