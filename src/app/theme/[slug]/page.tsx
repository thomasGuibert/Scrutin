import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { agregerPositionsSousThemes, taxonomyRepository } from "@/app/_composition";
import { tousLesSousThemes } from "@/domain/taxonomie";

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

  const comparaison = await agregerPositionsSousThemes(
    tousLesSousThemes(theme).map((sousTheme) => sousTheme.slug)
  );

  return (
    <main>
      <h1 className="page-title">{theme.nom}</h1>

      <ComparaisonGroupes
        titre="Position par groupe, sur l'ensemble du thème"
        comparaison={comparaison}
      />

      <ul>
        {theme.branches.map((branche) => (
          <li key={branche.slug}>
            <Link href={`/branche/${branche.slug}`}>{branche.nom}</Link>
          </li>
        ))}
        {theme.sousThemes.map((sousTheme) => (
          <li key={sousTheme.slug}>
            <Link href={`/sous-theme/${sousTheme.slug}`}>
              {sousTheme.nom}
            </Link>
          </li>
        ))}
      </ul>

      <Link className="back-link" href="/">
        ← Retour
      </Link>
    </main>
  );
}
