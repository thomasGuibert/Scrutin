import AdmZip from "adm-zip";
import path from "node:path";
import type {
  ExplicationVote,
  ExplicationsVoteRepository,
} from "@/domain/compteRendu";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/ExplicationsVote-dossiers-classifies.json.zip"
);

type FichierDossier = {
  dossierRef: string;
  scrutins: Record<string, ExplicationVote[]>;
};

export class FilesystemExplicationsVoteRepository
  implements ExplicationsVoteRepository
{
  private zip: AdmZip | null = null;

  constructor(private readonly zipPath: string = ZIP_PATH) {}

  private getZip(): AdmZip {
    if (!this.zip) {
      this.zip = new AdmZip(this.zipPath);
    }
    return this.zip;
  }

  async getByScrutin(
    dossierRef: string,
    scrutinUid: string
  ): Promise<ExplicationVote[] | null> {
    const entry = this.getZip().getEntry(`json/${dossierRef}.json`);
    if (!entry) {
      return null;
    }

    const fichier = JSON.parse(
      entry.getData().toString("utf-8")
    ) as FichierDossier;

    return fichier.scrutins[scrutinUid] ?? null;
  }
}
