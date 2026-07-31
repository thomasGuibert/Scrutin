import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { comparerGroupes, getScrutin } from "@/app/_composition";
import { calculerVotants } from "@/domain/scrutin";

export function generateStaticParams() {
  return [{ uid: "VTANR5L17V6993" }, { uid: "VTANR5L17V6994" }];
}

export default async function ScrutinPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const scrutin = await getScrutin(uid);

  if (!scrutin) {
    notFound();
  }

  const comparaison = comparerGroupes(scrutin);

  return (
    <main>
      <h1 className="page-title">{scrutin.titre}</h1>

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

      <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
    </main>
  );
}
