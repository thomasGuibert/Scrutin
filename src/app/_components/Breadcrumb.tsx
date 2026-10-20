import { Fragment } from "react";
import { LienPeriode } from "@/app/_components/LienPeriode";

export type BreadcrumbItem = { href: string; label: string } | { label: string };

// Fil d'ariane affiché en haut de chaque page de nœud (thème, branche,
// sous-thème, dossier, scrutin) : toujours ancré sur Accueil, chaque
// ancêtre intermédiaire est un lien, le dernier élément est la page
// courante (non cliquable).
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb">
      <LienPeriode href="/">Accueil</LienPeriode>
      {items.map((item) => (
        <Fragment key={"href" in item ? item.href : item.label}>
          <span className="sep">/</span>
          {"href" in item ? (
            <LienPeriode href={item.href}>{item.label}</LienPeriode>
          ) : (
            <span className="current">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
