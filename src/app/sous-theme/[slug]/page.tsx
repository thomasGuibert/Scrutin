import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { listerDossiersSousTheme, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return [{ slug: "reparation-memorielle" }, { slug: "role-civique" }];
}

export default async function SousThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sousTheme = taxonomyRepository.trouverSousTheme(slug);

  if (!sousTheme) {
    notFound();
  }

  const dossiers = await listerDossiersSousTheme(slug);

  return (
    <main>
      <h1 className="page-title">{sousTheme.nom}</h1>

      <div className="dossier-list">
        {dossiers.map(({ dossier, comparaison }) => (
          <div className="dossier-row" key={dossier.dossierRef}>
            <Link
              className="dossier-header"
              href={`/dossier/${dossier.dossierRef}`}
            >
              <span className="dossier-title">{dossier.titre}</span>
            </Link>
            <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
          </div>
        ))}
      </div>

      <Link className="back-link" href="/">
        ← Retour
      </Link>
    </main>
  );
}
