import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { DossierRepository } from "@/domain/dossier";
import type { Scrutin } from "@/domain/scrutin";
import type { SousTheme } from "@/domain/taxonomie";

export type SousThemeAvecPosition = {
  sousTheme: SousTheme;
  nombreDossiers: number;
  comparaison: ComparaisonGroupe[];
  // Dates brutes (ISO) de tous les scrutins de tous les dossiers du
  // sous-thème — sert au filtre par période des pages Branche/Thème (cf.
  // domain/filtreDate.ts, issue #152), au même titre que
  // DossierAvecPosition.datesScrutins pour la page sous-thème elle-même.
  datesScrutins: string[];
};

// Un sous-thème avec, à sa suite, ce que la navigation montre de lui avant
// qu'on y entre : son nombre de dossiers et sa propre Position agrégée —
// jamais celle du thème ou de la branche qui le contient (cf. Nœud,
// CONTEXT.md : la comparaison entre groupes, c'est la navigation de l'arbre).
export function createListerSousThemesAvecPosition(
  dossierRepository: DossierRepository,
  agregerPositionsDossiers: (
    dossierRefs: string[]
  ) => Promise<ComparaisonGroupe[]>,
  listerScrutinsDossier: (dossierRef: string) => Promise<Scrutin[]>
) {
  return async function listerSousThemesAvecPosition(
    sousThemes: SousTheme[]
  ): Promise<SousThemeAvecPosition[]> {
    return Promise.all(
      sousThemes.map(async (sousTheme) => {
        const dossiers = await dossierRepository.getBySousTheme(
          sousTheme.slug
        );
        const [comparaison, scrutinsParDossier] = await Promise.all([
          agregerPositionsDossiers(dossiers.map((dossier) => dossier.dossierRef)),
          Promise.all(
            dossiers.map((dossier) => listerScrutinsDossier(dossier.dossierRef))
          ),
        ]);
        const datesScrutins = scrutinsParDossier
          .flat()
          .map((scrutin) => scrutin.date);
        return {
          sousTheme,
          nombreDossiers: dossiers.length,
          comparaison,
          datesScrutins,
        };
      })
    );
  };
}
