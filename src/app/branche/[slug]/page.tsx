import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/app/_components/Breadcrumb";
import { SousThemeRow } from "@/app/_components/SousThemeRow";
import { listerSousThemesAvecPosition, taxonomyRepository } from "@/app/_composition";

export function generateStaticParams() {
  return [{ slug: "ecole" }];
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

      {sousThemes.length ? (
        sousThemes.map((entree) => (
          <SousThemeRow key={entree.sousTheme.slug} {...entree} />
        ))
      ) : (
        <p className="branch-placeholder">
          Détail des sous-thèmes pas encore fait — branche identifiée mais
          non descendue plus bas.
        </p>
      )}

      <Link className="back-link" href={`/theme/${theme.slug}`}>
        ← Retour à {theme.nom}
      </Link>
    </main>
  );
}
