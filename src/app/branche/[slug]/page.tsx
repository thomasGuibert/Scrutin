import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { agregerPositionsSousThemes, taxonomyRepository } from "@/app/_composition";

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

  const { branche } = resultat;
  const comparaison = await agregerPositionsSousThemes(
    branche.sousThemes.map((sousTheme) => sousTheme.slug)
  );

  return (
    <main>
      <h1 className="page-title">{branche.nom}</h1>

      <ComparaisonGroupes
        titre="Position par groupe, sur l'ensemble de la branche"
        comparaison={comparaison}
      />

      <ul>
        {branche.sousThemes.map((sousTheme) => (
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
