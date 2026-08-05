import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { DossierViewTracker } from "@/app/_components/DossierViewTracker";
import { FicheDossier } from "@/app/_components/FicheDossier";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import {
  agregerPositionsDossiers,
  dossierRepository,
  getDossier,
  listerScrutinsDossier,
  taxonomyRepository,
} from "@/app/_composition";
import { determinerResultatDossier, formaterTitreScrutin } from "@/domain/scrutin";
import { tousLesSousThemes } from "@/domain/taxonomie";

export async function generateStaticParams() {
  const sousThemes = taxonomyRepository
    .listerThemes()
    .flatMap((theme) => tousLesSousThemes(theme));

  const dossiersParSousTheme = await Promise.all(
    sousThemes.map((sousTheme) => dossierRepository.getBySousTheme(sousTheme.slug))
  );

  const dossiers = dossiersParSousTheme.flat();

  // Un dossier sans scrutin n'apparaît pas sur le site (cf. CONTEXT.md,
  // Dossier législatif) — pas la peine de pré-générer sa page statique.
  const dossiersAvecScrutin = (
    await Promise.all(
      dossiers.map(async (dossier) => ({
        dossier,
        scrutins: await listerScrutinsDossier(dossier.dossierRef),
      }))
    )
  ).filter(({ scrutins }) => scrutins.length > 0);

  return dossiersAvecScrutin.map(({ dossier }) => ({
    dossierRef: dossier.dossierRef,
  }));
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

  // Un dossier sans scrutin n'a encore aucun vote décisif à afficher (cf.
  // CONTEXT.md, Dossier législatif) — en v1, il n'apparaît pas sur le site.
  if (scrutins.length === 0) {
    notFound();
  }

  const contexte = taxonomyRepository.trouverContexteSousTheme(
    dossier.sousTheme
  );
  const resultatDossier = determinerResultatDossier(scrutins);

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
      <DossierViewTracker dossierRef={dossierRef} />
      <Breadcrumb items={fil} />
      <div className="node-header">
        <span className="dossier-tag">Dossier</span>
        <h1 className="page-title">{dossier.titre}</h1>
        {resultatDossier && <ResultatBadge resultat={resultatDossier} />}
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
              <span className="dossier-title">
                {formaterTitreScrutin(scrutin.titre)}
              </span>
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
