import type { DossierRepository } from "@/domain/dossier";
import type { Scrutin } from "@/domain/scrutin";
import {
  tousLesSousThemes,
  type TaxonomyRepository,
  type ThemeRacine,
} from "@/domain/taxonomie";

export type ThemeAvecCompte = {
  theme: ThemeRacine;
  nombreDossiers: number;
  // Dates brutes (ISO) des scrutins de chaque dossier du thème — sert au
  // filtre par période de l'accueil (cf. domain/filtreDate.ts), comme
  // SousThemeAvecPosition.datesParDossier pour les pages Thème/Branche.
  datesParDossier: string[][];
};

export function createListerThemesTries(
  taxonomyRepository: TaxonomyRepository,
  dossierRepository: DossierRepository,
  listerScrutinsDossier: (dossierRef: string) => Promise<Scrutin[]>
) {
  return async function listerThemesTries(): Promise<ThemeAvecCompte[]> {
    const themes = taxonomyRepository.listerThemes();

    const avecCompte = await Promise.all(
      themes.map(async (theme) => {
        const dossiersParSousTheme = await Promise.all(
          tousLesSousThemes(theme).map((sousTheme) =>
            dossierRepository.getBySousTheme(sousTheme.slug)
          )
        );
        const dossiers = dossiersParSousTheme.flat();
        const scrutinsParDossier = await Promise.all(
          dossiers.map((dossier) => listerScrutinsDossier(dossier.dossierRef))
        );
        const datesParDossier = scrutinsParDossier.map((scrutins) =>
          scrutins.map((scrutin) => scrutin.date)
        );
        return { theme, nombreDossiers: dossiers.length, datesParDossier };
      })
    );

    // Tri par nombre de dossiers, calculé en direct depuis les données
    // réelles — pas un choix éditorial (cf. projet-votes-assemblee-nationale.md).
    // Départage en cas d'égalité pas encore implémenté (spécifié mais aucun
    // cas réel à ce jour ne l'exerce, cf. le même document).
    return avecCompte.sort((a, b) => b.nombreDossiers - a.nombreDossiers);
  };
}
