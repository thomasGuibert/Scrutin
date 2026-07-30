import AdmZip from "adm-zip";
import path from "node:path";
import type { Scrutin, ScrutinRepository } from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Scrutins.json.zip"
);

type RawScrutinFile = {
  scrutin: { uid: string; titre: string };
};

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

    return {
      uid: raw.scrutin.uid,
      titre: raw.scrutin.titre,
    };
  }
}
