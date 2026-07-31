import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { listerDossiersSousTheme, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return [
    { slug: "reparation-memorielle" },
    { slug: "role-civique" },
    { slug: "doctrine-defense" },
  ];
}

export default async function SousThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contexte = taxonomyRepository.trouverContexteSousTheme(slug);

  if (!contexte) {
    notFound();
  }

  const { theme, branche, sousTheme } = contexte;
  const dossiers = await listerDossiersSousTheme(slug);

  const fil: BreadcrumbItem[] = [{ href: `/theme/${theme.slug}`, label: theme.nom }];
  if (branche) {
    fil.push({ href: `/branche/${branche.slug}`, label: branche.nom });
  }
  fil.push({ label: sousTheme.nom });

  const retourHref = branche ? `/branche/${branche.slug}` : `/theme/${theme.slug}`;
  const retourLabel = branche ? branche.nom : theme.nom;

  return (
    <main>
      <Breadcrumb items={fil} />
      <h1 className="page-title">{sousTheme.nom}</h1>

      <div className="dossier-list">
        {dossiers.map(({ dossier, comparaison, viaTag }) => (
          <div className="dossier-row" key={dossier.dossierRef}>
            <Link className="dossier-header" href={`/dossier/${dossier.dossierRef}`}>
              <span className="dossier-title">{dossier.titre}</span>
              {viaTag && <span className="dossier-tag">{viaTag}</span>}
            </Link>
            <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
          </div>
        ))}
      </div>

      <Link className="back-link" href={retourHref}>
        ← Retour à {retourLabel}
      </Link>
    </main>
  );
}
