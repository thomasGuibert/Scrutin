import Link from "next/link";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { createComparerGroupes } from "@/api/comparerGroupes";
import { createGetScrutin } from "@/api/getScrutin";
import { calculerVotants } from "@/domain/scrutin";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getScrutin = createGetScrutin(new FilesystemScrutinRepository());
const comparerGroupes = createComparerGroupes(new FilesystemGroupeRepository());

export default async function Home() {
  const scrutin = await getScrutin("VTANR5L17V6993");
  const comparaison = scrutin ? comparerGroupes(scrutin) : [];

  return (
    <main>
      <h1 className="page-title">
        {scrutin?.titre ?? "Scrutin introuvable"}
      </h1>

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

      <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />

      <Link className="back-link" href="/dossier/DLR5L17N52767">
        Voir le dossier →
      </Link>
    </main>
  );
}
