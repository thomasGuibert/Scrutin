import {
  agregerPositionsDecisives,
  type PositionDecisiveGroupe,
} from "@/api/agregerPositionsDossiers";
import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { DossierRepository } from "@/domain/dossier";
import type { Scrutin } from "@/domain/scrutin";
import type { SousTheme } from "@/domain/taxonomie";

export type SousThemeAvecPosition = {
  sousTheme: SousTheme;
  nombreDossiers: number;
  comparaison: ComparaisonGroupe[];
  // Dates brutes (ISO) des scrutins de chaque dossier du sous-thème, un
  // tableau par dossier — sert au filtre par période des pages
  // Branche/Thème (cf. domain/filtreDate.ts, issue #152) et à recompter
  // les dossiers de la période (cf. compterDossiersDansPeriode).
  datesParDossier: string[][];
  // Positions sur le scrutin décisif de chaque dossier, dans le même ordre
  // que datesParDossier : permet de recalculer `comparaison` sur les seuls
  // dossiers de la période filtrée (cf. SousThemeListeFiltrable).
  positionsParDossier: PositionDecisiveGroupe[][];
};

// Un sous-thème avec, à sa suite, ce que la navigation montre de lui avant
// qu'on y entre : son nombre de dossiers et sa propre Position agrégée —
// jamais celle du thème ou de la branche qui le contient (cf. Nœud,
// CONTEXT.md : la comparaison entre groupes, c'est la navigation de l'arbre).
export function createListerSousThemesAvecPosition(
  dossierRepository: DossierRepository,
  positionsDecisivesParDossier: (
    dossierRefs: string[]
  ) => Promise<PositionDecisiveGroupe[][]>,
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
        const [positionsParDossier, scrutinsParDossier] = await Promise.all([
          positionsDecisivesParDossier(
            dossiers.map((dossier) => dossier.dossierRef)
          ),
          Promise.all(
            dossiers.map((dossier) => listerScrutinsDossier(dossier.dossierRef))
          ),
        ]);
        const datesParDossier = scrutinsParDossier.map((scrutins) =>
          scrutins.map((scrutin) => scrutin.date)
        );
        return {
          sousTheme,
          nombreDossiers: dossiers.length,
          comparaison: agregerPositionsDecisives(positionsParDossier),
          datesParDossier,
          positionsParDossier,
        };
      })
    );
  };
}
