import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/app/_components/Breadcrumb";
import { SousThemeListeFiltrable } from "@/app/_components/SousThemeListeFiltrable";
import { listerSousThemesAvecPosition, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return taxonomyRepository
    .listerThemes()
    .flatMap((theme) => theme.branches)
    .map((branche) => ({ slug: branche.slug }));
}

export default async function BranchePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resultat = taxonomyRepository.trouverBranche(slug);

  if (!resultat) {
    notFound();
  }

  const { theme, branche } = resultat;
  const sousThemes = await listerSousThemesAvecPosition(branche.sousThemes);

  return (
    <main>
      <Breadcrumb
        items={[
          { href: `/theme/${theme.slug}`, label: theme.nom },
          { label: branche.nom },
        ]}
      />
      <h1 className="page-title">{branche.nom}</h1>

      <SousThemeListeFiltrable
        groupes={[{ titre: null, sousThemes, placeholderSiVide: true }]}
      />

      <Link className="back-link" href={`/theme/${theme.slug}`}>
        ← Retour à {theme.nom}
      </Link>
    </main>
  );
}
