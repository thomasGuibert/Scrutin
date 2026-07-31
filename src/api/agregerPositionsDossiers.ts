import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { GroupeRepository } from "@/domain/groupes";
import {
  agregerPositions,
  calculerPosition,
  trouverScrutinDecisif,
  type EntreeAgregation,
  type ScrutinRepository,
} from "@/domain/scrutin";

// Agrège la Position d'un groupe sur le scrutin décisif de chaque dossier
// passé — même mécanisme, qu'il s'agisse d'un seul dossier ou de tous les
// dossiers rattachés à un sous-thème/branche/thème. Un dossier peut contenir
// des dizaines de scrutins d'amendement/d'article en plus de celui qui l'a
// réellement acté ou rejeté ; les agréger tous ensemble diluerait la position
// d'un groupe sur le fond du texte avec ses votes de détail (cf.
// trouverScrutinDecisif). Un dossier sans scrutin décisif pour l'instant
// (encore en cours d'examen) ne contribue à aucune Position.
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
      const scrutinDecisif = trouverScrutinDecisif(scrutins);
      if (!scrutinDecisif) {
        continue;
      }

      for (const positionGroupe of scrutinDecisif.positionsParGroupe) {
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
