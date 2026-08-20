import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/app/_components/Breadcrumb";
import { DossierListeFiltrable } from "@/app/_components/DossierListeFiltrable";
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

      <DossierListeFiltrable dossiers={dossiers} />

      <Link className="back-link" href={retourHref}>
        ← Retour à {retourLabel}
      </Link>
    </main>
  );
}
