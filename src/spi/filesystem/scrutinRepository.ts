import AdmZip from "adm-zip";
import path from "node:path";
import type { Scrutin, ScrutinRepository } from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Scrutins.json.zip"
);

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
    syntheseVote: {
      decompte: {
        pour: string;
        contre: string;
        abstentions: string;
      };
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
    const decompte = raw.scrutin.syntheseVote.decompte;

    return {
      uid: raw.scrutin.uid,
      titre: raw.scrutin.titre,
      decompte: {
        pour: parseCount(decompte.pour, "pour"),
        contre: parseCount(decompte.contre, "contre"),
        abstentions: parseCount(decompte.abstentions, "abstentions"),
      },
    };
  }
}
