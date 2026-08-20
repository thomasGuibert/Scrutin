import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/app/_components/Breadcrumb";
import { SousThemeListeFiltrable } from "@/app/_components/SousThemeListeFiltrable";
import { listerSousThemesAvecPosition, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return taxonomyRepository.listerThemes().map((theme) => ({ slug: theme.slug }));
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

      <SousThemeListeFiltrable
        groupes={[
          ...theme.branches.map((branche, index) => ({
            titre: branche.nom,
            sousThemes: sousThemesParBranche[index],
            placeholderSiVide: true,
          })),
          { titre: null, sousThemes: sousThemesDirects, placeholderSiVide: false },
        ]}
      />

      <Link className="back-link" href="/">
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
