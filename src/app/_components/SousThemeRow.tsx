import Link from "next/link";
import type { SousThemeAvecPosition } from "@/api/listerSousThemesAvecPosition";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";

// Un sous-thème tel qu'affiché sous son thème racine ou sa branche : son nom,
// son nombre de dossiers, et sa propre Position agrégée — pas celle du nœud
// parent (cf. sousThemeRow du prototype validé). `suffixeLien` propage le
// filtre par période de la liste vers la page sous-thème.
export function SousThemeRow({
  sousTheme,
  nombreDossiers,
  comparaison,
  suffixeLien = "",
}: SousThemeAvecPosition & { suffixeLien?: string }) {
  return (
    <div className="sous-theme-block">
      <Link className="sous-theme-row" href={`/sous-theme/${sousTheme.slug}${suffixeLien}`}>
        <span className="sous-theme-name">{sousTheme.nom}</span>
        <span className="sous-theme-count">
          {nombreDossiers} dossier{nombreDossiers > 1 ? "s" : ""} →
        </span>
      </Link>
      <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
    </div>
  );
}
