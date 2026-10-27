import Link from "next/link";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { ResultatScrutin } from "@/domain/scrutin";

export type ExempleAccroche = {
  titre: string;
  href: string;
  description: string;
  comparaison: ComparaisonGroupe[];
  resultat: ResultatScrutin;
  votants: number;
  effectifTotal: number;
};

// "Au-delà des clivages" plutôt qu'un mot qui affirmerait un choix
// éditorial à justifier ("Sélection", "À la une") : se vérifie directement
// dans le bloc lui-même (absence de clivage visible entre les groupes),
// sans rien à expliquer ailleurs sur la page. Ne vaut que si tous les
// groupes qui ont voté ont la même position — sinon la rubrique dit
// simplement ce qu'est le bloc (le dernier dossier voté, cf. page.tsx).
const RUBRIQUE_CONSENSUS = "Au-delà des clivages";
const RUBRIQUE_DERNIER = "Dernier dossier voté";

function estConsensuel(comparaison: ComparaisonGroupe[]): boolean {
  const positions = new Set(
    comparaison
      .map(({ position }) => position)
      .filter((position) => position !== "Non votant")
  );
  return positions.size === 1 && !positions.has("Divisé");
}

// Accroche de la page d'accueil : le dernier dossier réel voté (cf.
// page.tsx), avec la position de chaque groupe sur son scrutin décisif —
// montrer les votes par un fait plutôt qu'affirmer la neutralité du site
// (cf. projet-votes-assemblee-nationale.md, impact map #4 : désamorcer le
// soupçon de biais avant qu'il s'installe, sur le tout premier écran).
export function AccrocheExemple({ exemple }: { exemple: ExempleAccroche }) {
  const rubrique = estConsensuel(exemple.comparaison)
    ? RUBRIQUE_CONSENSUS
    : RUBRIQUE_DERNIER;

  return (
    <div className="accroche-exemple">
      <p className="accroche-kicker">{rubrique}</p>
      <p className="accroche-titre">{exemple.titre}</p>
      <p className="accroche-description">{exemple.description}</p>

      <div className="accroche-scroll">
        <ComparaisonGroupes titre={exemple.titre} comparaison={exemple.comparaison} />
      </div>

      <div className="accroche-footer">
        <span className="decompte-item">
          <span className="brief-label">Votants</span>
          <span className="decompte-value">
            {exemple.votants}/{exemple.effectifTotal}
          </span>
        </span>
        <ResultatBadge resultat={exemple.resultat} variant="value" />
        <Link href={exemple.href} className="a-tile-arrow accroche-lien">
          Voir le dossier complet →
        </Link>
      </div>
    </div>
  );
}
