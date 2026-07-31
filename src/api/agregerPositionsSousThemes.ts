import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { DossierRepository } from "@/domain/dossier";

// Agrège la Position sur l'union des dossiers de plusieurs sous-thèmes —
// le bloc de construction commun aux pages branche et thème racine, qui ne
// diffèrent que par la liste de sous-thèmes qu'elles rassemblent.
export function createAgregerPositionsSousThemes(
  dossierRepository: DossierRepository,
  agregerPositionsDossiers: (
    dossierRefs: string[]
  ) => Promise<ComparaisonGroupe[]>
) {
  return async function agregerPositionsSousThemes(
    slugs: string[]
  ): Promise<ComparaisonGroupe[]> {
    const dossiersParSousTheme = await Promise.all(
      slugs.map((slug) => dossierRepository.getBySousTheme(slug))
    );
    const dossierRefs = dossiersParSousTheme
      .flat()
      .map((dossier) => dossier.dossierRef);

    return agregerPositionsDossiers(dossierRefs);
  };
}
