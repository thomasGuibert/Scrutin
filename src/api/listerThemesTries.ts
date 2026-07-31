import type { DossierRepository } from "@/domain/dossier";
import {
  tousLesSousThemes,
  type TaxonomyRepository,
  type ThemeRacine,
} from "@/domain/taxonomie";

export type ThemeAvecCompte = {
  theme: ThemeRacine;
  nombreDossiers: number;
};

export function createListerThemesTries(
  taxonomyRepository: TaxonomyRepository,
  dossierRepository: DossierRepository
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
        const nombreDossiers = dossiersParSousTheme.reduce(
          (total, dossiers) => total + dossiers.length,
          0
        );
        return { theme, nombreDossiers };
      })
    );

    // Tri par nombre de dossiers, calculé en direct depuis les données
    // réelles — pas un choix éditorial (cf. projet-votes-assemblee-nationale.md).
    // Départage en cas d'égalité pas encore implémenté (spécifié mais aucun
    // cas réel à ce jour ne l'exerce, cf. le même document).
    return avecCompte.sort((a, b) => b.nombreDossiers - a.nombreDossiers);
  };
}
