import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { createAgregerPositionsDossier } from "@/api/agregerPositionsDossier";
import { createListerDossiersSousTheme } from "@/api/listerDossiersSousTheme";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const taxonomyRepository = new DeclaredTaxonomyRepository();
const listerDossiersSousTheme = createListerDossiersSousTheme(
  new FilesystemDossierRepository({ taxonomyRepository }),
  createAgregerPositionsDossier(
    new FilesystemScrutinRepository(),
    new FilesystemGroupeRepository()
  )
);

export function generateStaticParams() {
  return [{ slug: "reparation-memorielle" }];
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
