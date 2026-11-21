import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { Groupe, GroupeRepository } from "@/domain/groupes";
import {
  agregerPositions,
  calculerPosition,
  trouverScrutinDecisif,
  type DecompteScrutin,
  type EntreeAgregation,
  type ScrutinRepository,
} from "@/domain/scrutin";

// Position d'un groupe sur le scrutin décisif d'UN dossier, avant
// agrégation : de quoi recalculer une Position agrégée sur n'importe quel
// sous-ensemble de dossiers (ex. ceux d'une période, cf. SousThemeRow).
export type PositionDecisiveGroupe = {
  groupe: Groupe;
  decompte: DecompteScrutin;
  effectif: number;
};

// Positions sur le scrutin décisif de chaque dossier passé, dans l'ordre des
// dossiers. Un dossier peut contenir des dizaines de scrutins
// d'amendement/d'article en plus de celui qui l'a réellement acté ou
// rejeté ; les agréger tous ensemble diluerait la position d'un groupe sur
// le fond du texte avec ses votes de détail (cf. trouverScrutinDecisif). Un
// dossier sans scrutin décisif pour l'instant (encore en cours d'examen) a
// une liste vide.
export function createPositionsDecisivesParDossier(
  scrutinRepository: ScrutinRepository,
  groupeRepository: GroupeRepository
) {
  return async function positionsDecisivesParDossier(
    dossierRefs: string[]
  ): Promise<PositionDecisiveGroupe[][]> {
    const scrutinsParDossier = await Promise.all(
      dossierRefs.map((dossierRef) =>
        scrutinRepository.getByDossierRef(dossierRef)
      )
    );

    return scrutinsParDossier.map((scrutins) => {
      const scrutinDecisif = trouverScrutinDecisif(scrutins);
      if (!scrutinDecisif) {
        return [];
      }

      return scrutinDecisif.positionsParGroupe.map((positionGroupe) => {
        const groupe = groupeRepository.trouverGroupe(positionGroupe.organeRef);
        if (!groupe) {
          throw new Error(
            `Agrégation des positions : organeRef "${positionGroupe.organeRef}" absent du référentiel des groupes.`
          );
        }
        return {
          groupe,
          decompte: positionGroupe.decompte,
          effectif: positionGroupe.effectif,
        };
      });
    });
  };
}

// Agrège, groupe par groupe, les positions décisives de plusieurs dossiers
// (cf. agregerPositions : moyenne pondérée par la participation). Fonction
// pure : utilisée côté serveur et côté client (filtre par période).
export function agregerPositionsDecisives(
  positionsParDossier: PositionDecisiveGroupe[][]
): ComparaisonGroupe[] {
  const parGroupe = new Map<string, { groupe: Groupe; entrees: EntreeAgregation[] }>();
  for (const positions of positionsParDossier) {
    for (const { groupe, decompte, effectif } of positions) {
      const cumul = parGroupe.get(groupe.organeRef) ?? { groupe, entrees: [] };
      cumul.entrees.push({ decompte, effectif });
      parGroupe.set(groupe.organeRef, cumul);
    }
  }

  return [...parGroupe.values()].map(({ groupe, entrees }) => {
    const decompte = agregerPositions(entrees);
    return { groupe, decompte, position: calculerPosition(decompte) };
  });
}

// Agrège la Position d'un groupe sur le scrutin décisif de chaque dossier
// passé — même mécanisme, qu'il s'agisse d'un seul dossier ou de tous les
// dossiers rattachés à un sous-thème/branche/thème.
export function createAgregerPositionsDossiers(
  scrutinRepository: ScrutinRepository,
  groupeRepository: GroupeRepository
) {
  const positionsDecisivesParDossier = createPositionsDecisivesParDossier(
    scrutinRepository,
    groupeRepository
  );
  return async function agregerPositionsDossiers(
    dossierRefs: string[]
  ): Promise<ComparaisonGroupe[]> {
    return agregerPositionsDecisives(
      await positionsDecisivesParDossier(dossierRefs)
    );
  };
}
