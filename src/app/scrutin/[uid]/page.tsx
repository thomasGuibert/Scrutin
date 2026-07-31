import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
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
      <div className="node-header">
        <span className="dossier-tag">Scrutin</span>
        <h1 className="page-title">{scrutin.titre}</h1>
      </div>

      {dossier && <FicheDossier fiche={dossier.ficheDossier} />}

      <div className="cmp-block">
        <p className="cmp-title">Décompte du scrutin</p>
        <div className="decompte-row">
          <span className="decompte-item">
            <span className="brief-label">Votants</span>
            <span className="decompte-value">
              {calculerVotants(scrutin.decompte)}
            </span>
          </span>
          <span className="decompte-item">
            <span className="brief-label">Pour</span>
            <span className="decompte-value">{scrutin.decompte.pour}</span>
          </span>
          <span className="decompte-item">
            <span className="brief-label">Contre</span>
            <span className="decompte-value">{scrutin.decompte.contre}</span>
          </span>
          <span className="decompte-item">
            <span className="brief-label">Abstentions</span>
            <span className="decompte-value">
              {scrutin.decompte.abstentions}
            </span>
          </span>
        </div>
      </div>

      <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />

      {dossier && (
        <Link className="back-link" href={`/dossier/${dossier.dossierRef}`}>
          ← Retour à {dossier.titre}
        </Link>
      )}
    </main>
  );
}
