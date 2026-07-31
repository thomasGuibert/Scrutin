import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import {
  agregerPositionsDossiers,
  listerDossiersSousTheme,
  taxonomyRepository,
} from "@/app/_composition";
import { tousLesSousThemes } from "@/domain/taxonomie";

export function generateStaticParams() {
  return taxonomyRepository
    .listerThemes()
    .flatMap((theme) => tousLesSousThemes(theme))
    .map((sousTheme) => ({ slug: sousTheme.slug }));
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
  // Vue d'ensemble du sous-thème : agrège tous les dossiers affichés sur
  // cette page, y compris ceux affichés ici seulement via un Tag d'impact
  // partagé (cf. viaTag) — un résumé pour ce que montre la page, pas la
  // Position propre du sous-thème (celle-ci, réservée aux seuls dossiers qui
  // lui appartiennent réellement, reste affichée telle quelle depuis les
  // pages thème/branche via SousThemeRow).
  const comparaisonPage = await agregerPositionsDossiers(
    dossiers.map(({ dossier }) => dossier.dossierRef)
  );

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
      <ComparaisonGroupes
        titre="Position par groupe, sur l'ensemble des dossiers affichés ici"
        comparaison={comparaisonPage}
      />

      <div className="dossier-list">
        {dossiers.map(({ dossier, comparaison, viaTag, nombreScrutins, resultat }) => (
          <div className="dossier-row" key={dossier.dossierRef}>
            <Link className="dossier-header" href={`/dossier/${dossier.dossierRef}`}>
              <span className="dossier-tags">
                <span className="dossier-tag">{viaTag ?? "Dossier"}</span>
                {resultat && <ResultatBadge resultat={resultat} />}
              </span>
              <span className="dossier-title">{dossier.titre}</span>
              <span className="dossier-count">
                {nombreScrutins} scrutin{nombreScrutins > 1 ? "s" : ""} →
              </span>
            </Link>
            <FicheDossier fiche={dossier.ficheDossier} />
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
