import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
import {
  agregerPositionsDossiers,
  dossierRepository,
  getDossier,
  listerScrutinsDossier,
  taxonomyRepository,
} from "@/app/_composition";
import { tousLesSousThemes } from "@/domain/taxonomie";

export async function generateStaticParams() {
  const sousThemes = taxonomyRepository
    .listerThemes()
    .flatMap((theme) => tousLesSousThemes(theme));

  const dossiersParSousTheme = await Promise.all(
    sousThemes.map((sousTheme) => dossierRepository.getBySousTheme(sousTheme.slug))
  );

  return dossiersParSousTheme
    .flat()
    .map((dossier) => ({ dossierRef: dossier.dossierRef }));
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ dossierRef: string }>;
}) {
  const { dossierRef } = await params;
  const dossier = await getDossier(dossierRef);

  if (!dossier) {
    notFound();
  }

  const [comparaison, scrutins] = await Promise.all([
    agregerPositionsDossiers([dossierRef]),
    listerScrutinsDossier(dossierRef),
  ]);
  const contexte = taxonomyRepository.trouverContexteSousTheme(
    dossier.sousTheme
  );

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
  fil.push({ label: dossier.titre });

  return (
    <main>
      <Breadcrumb items={fil} />
      <div className="node-header">
        <span className="dossier-tag">Dossier</span>
        <h1 className="page-title">{dossier.titre}</h1>
      </div>

      <FicheDossier fiche={dossier.ficheDossier} />

      <ComparaisonGroupes
        titre="Position par groupe, sur l'ensemble des scrutins du dossier"
        comparaison={comparaison}
      />

      <div className="dossier-list">
        {scrutins.map((scrutin) => (
          <div className="dossier-row" key={scrutin.uid}>
            <Link className="dossier-header" href={`/scrutin/${scrutin.uid}`}>
              <span className="dossier-tag">Scrutin</span>
              <span className="dossier-title">{scrutin.titre}</span>
              <span className="dossier-count">Voir →</span>
            </Link>
          </div>
        ))}
      </div>

      <Link
        className="back-link"
        href={contexte ? `/sous-theme/${contexte.sousTheme.slug}` : "/"}
      >
        ← Retour {contexte ? `à ${contexte.sousTheme.nom}` : "à l'accueil"}
      </Link>
    </main>
  );
}
