import { Fragment } from "react";
import Link from "next/link";

export type BreadcrumbItem = { href: string; label: string } | { label: string };

// Fil d'ariane affiché en haut de chaque page de nœud (thème, branche,
// sous-thème, dossier, scrutin) : toujours ancré sur Accueil, chaque
// ancêtre intermédiaire est un lien, le dernier élément est la page
// courante (non cliquable).
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb">
      <Link href="/">Accueil</Link>
      {items.map((item) => (
        <Fragment key={"href" in item ? item.href : item.label}>
          <span className="sep">/</span>
          {"href" in item ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span className="current">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
