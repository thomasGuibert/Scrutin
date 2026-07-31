import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { comparerGroupes, getDossier, getScrutin, taxonomyRepository } from "@/app/_composition";
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
  const dossier = scrutin.dossierRef ? await getDossier(scrutin.dossierRef) : null;
  const contexte = dossier
    ? taxonomyRepository.trouverContexteSousTheme(dossier.sousTheme)
    : null;

  const fil: BreadcrumbItem[] = [];
  if (contexte) {
    fil.push({ href: `/theme/${contexte.theme.slug}`, label: contexte.theme.nom });
    if (contexte.branche) {
      fil.push({
        href: `/branche/${contexte.branche.slug}`,
        label: contexte.branche.nom,
      });
    }
    fil.push({
      href: `/sous-theme/${contexte.sousTheme.slug}`,
      label: contexte.sousTheme.nom,
    });
  }
  if (dossier) {
    fil.push({ href: `/dossier/${dossier.dossierRef}`, label: dossier.titre });
  }
  fil.push({ label: scrutin.titre });

  return (
    <main>
      <Breadcrumb items={fil} />
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

      {dossier && (
        <Link className="back-link" href={`/dossier/${dossier.dossierRef}`}>
          ← Retour à {dossier.titre}
        </Link>
      )}
    </main>
  );
}
