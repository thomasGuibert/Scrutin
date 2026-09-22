// PROTOTYPE — jetable. Trois mises en page structurellement différentes
// pour intégrer une accroche "exemple" (un dossier réel, un résultat de
// vote réel) sur la page d'accueil, en réponse à la contrainte : la
// contrainte "empiler un bloc au-dessus de la grille" repousse soit le
// menu de thèmes trop bas, soit rend l'exemple trop discret. Voir
// `src/app/page.tsx` pour le branchement (?variant=A|B|C) et le skill
// "prototype" (sous-shape A) pour le protocole de bascule/capture.
import Link from "next/link";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import "./prototype-home-accroche.css";
import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { ThemeAvecCompte } from "@/api/listerThemesTries";

export type ExempleAccroche = {
  titre: string;
  href: string;
  resultatLabel: string;
  comparaison: ComparaisonGroupe[];
};

type Props = {
  themes: ThemeAvecCompte[];
  exemple: ExempleAccroche;
};

const PITCH =
  "Consultez les votes réels de l'Assemblée nationale, classés par thème : comparez ce que les groupes parlementaires ont concrètement voté, dossier par dossier, au-delà de leur communication.";

function ThemeTiles({ themes, feature }: { themes: ThemeAvecCompte[]; feature: boolean }) {
  return (
    <>
      {themes.map(({ theme, nombreDossiers }, index) => (
        <Link
          key={theme.slug}
          href={`/theme/${theme.slug}`}
          className={feature && index === 0 ? "a-tile a-tile-feature" : "a-tile"}
        >
          <span className="a-tile-name">{theme.nom}</span>
          <span className="a-tile-gloss">{theme.description}</span>
          <span className="a-tile-arrow">
            {nombreDossiers} dossier{nombreDossiers > 1 ? "s" : ""} →
          </span>
        </Link>
      ))}
    </>
  );
}

// --- Variante A : bandeau compact au-dessus de la grille, hauteur minimale ---
export function VariantA({ themes, exemple }: Props) {
  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">{PITCH}</p>

      <Link href={exemple.href} className="proto-a-strip">
        <span className="proto-a-kicker">Exemple concret</span>
        <span className="proto-a-titre">{exemple.titre}</span>
        <span className="proto-a-fait">
          {exemple.resultatLabel} — les {exemple.comparaison.length} groupes
          parlementaires ont voté Pour →
        </span>
      </Link>

      <div className="a-grid">
        <ThemeTiles themes={themes} feature />
      </div>
    </main>
  );
}

// --- Variante B : l'exemple remplace la tuile vedette dans la grille elle-même
// (aucune hauteur ajoutée — la grille garde exactement sa taille actuelle) ---
export function VariantB({ themes, exemple }: Props) {
  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">{PITCH}</p>

      <div className="a-grid">
        <Link href={exemple.href} className="a-tile a-tile-feature proto-b-exemple-tile">
          <span className="a-tile-name">
            <span className="proto-b-exemple-kicker">Exemple concret — </span>
            {exemple.titre}
          </span>
          <span className="a-tile-gloss">
            {exemple.resultatLabel} — les {exemple.comparaison.length} groupes
            parlementaires, de tous bords, ont voté Pour. Un aperçu de ce que
            montre le site : des votes réels, pas des postures.
          </span>
          <span className="a-tile-arrow">Voir le détail du vote →</span>
        </Link>
        <ThemeTiles themes={themes} feature={false} />
      </div>
    </main>
  );
}

// --- Variante C : deux colonnes, la preuve détaillée (barres par groupe)
// à côté de l'entrée vers les thèmes, pas au-dessus ---
export function VariantC({ themes, exemple }: Props) {
  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">{PITCH}</p>

      <div className="proto-c-layout">
        <div>
          <p className="proto-c-exemple-kicker">Exemple concret</p>
          <ComparaisonGroupes
            titre={`${exemple.titre} — ${exemple.resultatLabel}`}
            comparaison={exemple.comparaison}
          />
          <Link href={exemple.href} className="back-link">
            Voir le dossier complet →
          </Link>
        </div>

        <div>
          <p className="proto-c-themes-label">Parcourir par thème</p>
          <div className="a-grid proto-c-grid">
            <ThemeTiles themes={themes} feature={false} />
          </div>
        </div>
      </div>
    </main>
  );
}
