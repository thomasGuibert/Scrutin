import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import { listerDossiersSousTheme, taxonomyRepository } from "@/app/_composition";
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
        {dossiers.map(
          ({ dossier, comparaison, viaTag, nombreLectures, scrutinDecisifUnique, resultat }) => {
            // Un seul Scrutin décisif : lien direct dessus, la page Dossier
            // n'apporterait aucune information supplémentaire (même Fiche
            // dossier, même Position par groupe, déjà affichées ici) — cf.
            // issue #82. Sinon (plusieurs lectures à départager, ou dossier
            // encore en cours d'examen sans aucun Scrutin décisif), la page
            // Dossier reste nécessaire.
            //
            // Vocabulaire aligné sur l'étiquette "Scrutin" déjà utilisée sur
            // la page Dossier (jamais "lecture" comme libellé d'interface,
            // seulement dans le texte brut des titres de scrutin) — les 3
            // formes commencent par "scrutin(s)" pour rester lisibles en
            // balayant la liste.
            const href = scrutinDecisifUnique
              ? `/scrutin/${scrutinDecisifUnique}`
              : `/dossier/${dossier.dossierRef}`;
            const libelle =
              nombreLectures === 0
                ? "Scrutins en cours"
                : nombreLectures === 1
                  ? "1 scrutin"
                  : `${nombreLectures} scrutins`;

            return (
              <div className="dossier-row" key={dossier.dossierRef}>
                <Link className="dossier-header" href={href}>
                  <span className="dossier-tags">
                    <span className="dossier-tag">{viaTag ?? "Dossier"}</span>
                    {resultat && <ResultatBadge resultat={resultat} />}
                  </span>
                  <span className="dossier-title">{dossier.titre}</span>
                  <span className="dossier-count">{libelle} →</span>
                </Link>
                <FicheDossier fiche={dossier.ficheDossier} />
                <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
              </div>
            );
          }
        )}
      </div>

      <Link className="back-link" href={retourHref}>
        ← Retour à {retourLabel}
      </Link>
    </main>
  );
}
