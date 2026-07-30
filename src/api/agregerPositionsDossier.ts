import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { GroupeRepository } from "@/domain/groupes";
import {
  agregerPositions,
  calculerPosition,
  type EntreeAgregation,
  type ScrutinRepository,
} from "@/domain/scrutin";

export function createAgregerPositionsDossier(
  scrutinRepository: ScrutinRepository,
  groupeRepository: GroupeRepository
) {
  return async function agregerPositionsDossier(
    dossierRef: string
  ): Promise<ComparaisonGroupe[]> {
    const scrutins = await scrutinRepository.getByDossierRef(dossierRef);

    const entreesParGroupe = new Map<string, EntreeAgregation[]>();
    for (const scrutin of scrutins) {
      for (const positionGroupe of scrutin.positionsParGroupe) {
        const entrees = entreesParGroupe.get(positionGroupe.organeRef) ?? [];
        entrees.push({
          decompte: positionGroupe.decompte,
          effectif: positionGroupe.effectif,
        });
        entreesParGroupe.set(positionGroupe.organeRef, entrees);
      }
    }

    return [...entreesParGroupe.entries()].map(([organeRef, entrees]) => {
      const groupe = groupeRepository.trouverGroupe(organeRef);
      if (!groupe) {
        throw new Error(
          `Agrégation des positions : organeRef "${organeRef}" absent du référentiel des groupes.`
        );
      }

      const decompte = agregerPositions(entrees);

      return { groupe, decompte, position: calculerPosition(decompte) };
    });
  };
}
