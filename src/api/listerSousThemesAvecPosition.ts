import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { DossierRepository } from "@/domain/dossier";
import type { SousTheme } from "@/domain/taxonomie";

export type SousThemeAvecPosition = {
  sousTheme: SousTheme;
  nombreDossiers: number;
  comparaison: ComparaisonGroupe[];
};

// Un sous-thème avec, à sa suite, ce que la navigation montre de lui avant
// qu'on y entre : son nombre de dossiers et sa propre Position agrégée —
// jamais celle du thème ou de la branche qui le contient (cf. Nœud,
// CONTEXT.md : la comparaison entre groupes, c'est la navigation de l'arbre).
export function createListerSousThemesAvecPosition(
  dossierRepository: DossierRepository,
  agregerPositionsDossiers: (
    dossierRefs: string[]
  ) => Promise<ComparaisonGroupe[]>
) {
  return async function listerSousThemesAvecPosition(
    sousThemes: SousTheme[]
  ): Promise<SousThemeAvecPosition[]> {
    return Promise.all(
      sousThemes.map(async (sousTheme) => {
        const dossiers = await dossierRepository.getBySousTheme(
          sousTheme.slug
        );
        const comparaison = await agregerPositionsDossiers(
          dossiers.map((dossier) => dossier.dossierRef)
        );
        return { sousTheme, nombreDossiers: dossiers.length, comparaison };
      })
    );
  };
}
