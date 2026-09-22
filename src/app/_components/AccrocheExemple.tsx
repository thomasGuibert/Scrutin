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
// sans rien à expliquer ailleurs sur la page.
const RUBRIQUE = "Au-delà des clivages";

// Accroche de la page d'accueil : un dossier réel dont le scrutin décisif
// a été voté dans le même sens par tous les groupes, pour montrer la
// neutralité de traitement du site par un fait plutôt que l'affirmer (cf.
// projet-votes-assemblee-nationale.md, impact map #4 : désamorcer le
// soupçon de biais avant qu'il s'installe, sur le tout premier écran).
// L'exemple est fixe (cf. page.tsx) — pas de rotation pour l'instant.
export function AccrocheExemple({ exemple }: { exemple: ExempleAccroche }) {
  return (
    <div className="accroche-exemple">
      <p className="accroche-kicker">{RUBRIQUE}</p>
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
