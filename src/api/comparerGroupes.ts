import type { Groupe, GroupeRepository } from "@/domain/groupes";
import {
  calculerPosition,
  type DecompteScrutin,
  type Position,
  type Scrutin,
} from "@/domain/scrutin";

export type ComparaisonGroupe = {
  groupe: Groupe;
  decompte: DecompteScrutin;
  position: Position;
};

export function createComparerGroupes(repository: GroupeRepository) {
  return function comparerGroupes(scrutin: Scrutin): ComparaisonGroupe[] {
    return scrutin.positionsParGroupe.map((positionGroupe) => {
      const groupe = repository.trouverGroupe(positionGroupe.organeRef);
      if (!groupe) {
        throw new Error(
          `Comparaison des groupes : organeRef "${positionGroupe.organeRef}" absent du référentiel des groupes.`
        );
      }

      return {
        groupe,
        decompte: positionGroupe.decompte,
        position: calculerPosition(positionGroupe.decompte),
      };
    });
  };
}
