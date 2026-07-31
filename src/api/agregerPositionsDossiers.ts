import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { GroupeRepository } from "@/domain/groupes";
import {
  agregerPositions,
  calculerPosition,
  type EntreeAgregation,
  type ScrutinRepository,
} from "@/domain/scrutin";

// Agrège la Position d'un groupe sur tous les scrutins réels de tous les
// dossiers passés — même mécanisme, qu'il s'agisse des scrutins d'un seul
// dossier ou de tous les dossiers rattachés à un sous-thème/branche/thème.
export function createAgregerPositionsDossiers(
  scrutinRepository: ScrutinRepository,
  groupeRepository: GroupeRepository
) {
  return async function agregerPositionsDossiers(
    dossierRefs: string[]
  ): Promise<ComparaisonGroupe[]> {
    const scrutinsParDossier = await Promise.all(
      dossierRefs.map((dossierRef) =>
        scrutinRepository.getByDossierRef(dossierRef)
      )
    );

    const entreesParGroupe = new Map<string, EntreeAgregation[]>();
    for (const scrutins of scrutinsParDossier) {
      for (const scrutin of scrutins) {
        for (const positionGroupe of scrutin.positionsParGroupe) {
          const entrees =
            entreesParGroupe.get(positionGroupe.organeRef) ?? [];
          entrees.push({
            decompte: positionGroupe.decompte,
            effectif: positionGroupe.effectif,
          });
          entreesParGroupe.set(positionGroupe.organeRef, entrees);
        }
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
