import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/app/_components/Breadcrumb";
import { SousThemeRow } from "@/app/_components/SousThemeRow";
import { listerSousThemesAvecPosition, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return [{ slug: "souverainete" }, { slug: "education-culture" }];
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = taxonomyRepository.trouverTheme(slug);

  if (!theme) {
    notFound();
  }

  const [sousThemesDirects, sousThemesParBranche] = await Promise.all([
    listerSousThemesAvecPosition(theme.sousThemes),
    Promise.all(
      theme.branches.map((branche) =>
        listerSousThemesAvecPosition(branche.sousThemes)
      )
    ),
  ]);

  return (
    <main>
      <Breadcrumb items={[{ label: theme.nom }]} />
      <h1 className="page-title">{theme.nom}</h1>
      <p className="page-gloss">{theme.description}</p>

      {theme.branches.map((branche, index) => (
        <div className="branch-group" key={branche.slug}>
          <p className="branch-title">{branche.nom}</p>
          {branche.sousThemes.length ? (
            sousThemesParBranche[index].map((entree) => (
              <SousThemeRow key={entree.sousTheme.slug} {...entree} />
            ))
          ) : (
            <p className="branch-placeholder">
              Détail des sous-thèmes pas encore fait — branche identifiée
              mais non descendue plus bas.
            </p>
          )}
        </div>
      ))}

      {sousThemesDirects.map((entree) => (
        <SousThemeRow key={entree.sousTheme.slug} {...entree} />
      ))}

      <Link className="back-link" href="/">
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
