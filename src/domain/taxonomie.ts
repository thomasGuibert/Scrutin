export type TypeSousTheme = "clivant" | "consensuel" | "housekeeping";

export type SousTheme = {
  slug: string;
  nom: string;
  type: TypeSousTheme;
};

export type Branche = {
  slug: string;
  nom: string;
  sousThemes: SousTheme[];
};

export type ThemeRacine = {
  slug: string;
  nom: string;
  description: string;
  // Une branche est un niveau intermédiaire optionnel (cf. CONTEXT.md) : un
  // thème racine peut n'avoir aucune branche et rattacher ses sous-thèmes
  // directement (`sousThemes`), ou regrouper certains sous-thèmes par branche.
  branches: Branche[];
  sousThemes: SousTheme[];
};

export interface TaxonomyRepository {
  trouverSousTheme(slug: string): SousTheme | undefined;
  trouverTheme(slug: string): ThemeRacine | undefined;
  trouverBranche(
    slug: string
  ): { theme: ThemeRacine; branche: Branche } | undefined;
  listerThemes(): ThemeRacine[];
}

// Tous les sous-thèmes d'un thème racine, qu'ils soient rattachés
// directement ou via une de ses branches.
export function tousLesSousThemes(theme: ThemeRacine): SousTheme[] {
  return [
    ...theme.sousThemes,
    ...theme.branches.flatMap((branche) => branche.sousThemes),
  ];
}
