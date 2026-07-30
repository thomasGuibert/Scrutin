export type TypeSousTheme = "clivant" | "consensuel" | "housekeeping";

export type SousTheme = {
  slug: string;
  nom: string;
  type: TypeSousTheme;
  branche: string | null;
};

export type ThemeRacine = {
  slug: string;
  nom: string;
  sousThemes: SousTheme[];
};

export interface TaxonomyRepository {
  trouverSousTheme(slug: string): SousTheme | undefined;
}
