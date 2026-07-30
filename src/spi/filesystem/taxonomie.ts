import type {
  SousTheme,
  TaxonomyRepository,
  ThemeRacine,
} from "@/domain/taxonomie";

const TAXONOMIE: ThemeRacine[] = [
  {
    slug: "souverainete",
    nom: "Souveraineté & rôle de la France",
    sousThemes: [
      {
        slug: "reparation-memorielle",
        nom: "Réparation et reconnaissance mémorielle",
        type: "consensuel",
        branche: null,
      },
    ],
  },
];

export class DeclaredTaxonomyRepository implements TaxonomyRepository {
  trouverSousTheme(slug: string): SousTheme | undefined {
    for (const theme of TAXONOMIE) {
      const sousTheme = theme.sousThemes.find((s) => s.slug === slug);
      if (sousTheme) {
        return sousTheme;
      }
    }
    return undefined;
  }
}
