import Link from "next/link";
import { createGetScrutin } from "@/api/getScrutin";
import { calculerVotants } from "@/domain/scrutin";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getScrutin = createGetScrutin(new FilesystemScrutinRepository());

export default async function Home() {
  const scrutin = await getScrutin("VTANR5L17V1");

  return (
    <main>
      <div>{scrutin?.titre ?? "Scrutin introuvable"}</div>
      {scrutin && (
        <dl>
          <dt>Votants</dt>
          <dd>{calculerVotants(scrutin.decompte)}</dd>
          <dt>Pour</dt>
          <dd>{scrutin.decompte.pour}</dd>
          <dt>Contre</dt>
          <dd>{scrutin.decompte.contre}</dd>
          <dt>Abstentions</dt>
          <dd>{scrutin.decompte.abstentions}</dd>
        </dl>
      )}
      <Link href="/dossier/DLR5L17N52767">Voir un dossier</Link>
    </main>
  );
}
