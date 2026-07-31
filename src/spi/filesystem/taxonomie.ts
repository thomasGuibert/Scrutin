import {
  tousLesSousThemes,
  type Branche,
  type ContexteSousTheme,
  type SousTheme,
  type TaxonomyRepository,
  type ThemeRacine,
} from "@/domain/taxonomie";

const TAXONOMIE: ThemeRacine[] = [
  {
    slug: "souverainete",
    nom: "Souveraineté & rôle de la France",
    description: "Défense, diplomatie, Europe, commerce international.",
    branches: [],
    sousThemes: [
      {
        slug: "reparation-memorielle",
        nom: "Réparation et reconnaissance mémorielle",
        type: "consensuel",
      },
      {
        slug: "doctrine-defense",
        nom: "Doctrine de défense et effort militaire",
        type: "consensuel",
      },
    ],
  },
  {
    slug: "education-culture",
    nom: "Éducation & culture",
    description: "École, audiovisuel & médias, culture & patrimoine.",
    branches: [
      {
        slug: "ecole",
        nom: "École",
        sousThemes: [
          {
            slug: "role-civique",
            nom: "Rôle de l'école dans la formation civique et patriotique",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [],
  },
];

export class DeclaredTaxonomyRepository implements TaxonomyRepository {
  trouverSousTheme(slug: string): SousTheme | undefined {
    for (const theme of TAXONOMIE) {
      const sousTheme = tousLesSousThemes(theme).find((s) => s.slug === slug);
      if (sousTheme) {
        return sousTheme;
      }
    }
    return undefined;
  }

  trouverTheme(slug: string): ThemeRacine | undefined {
    return TAXONOMIE.find((theme) => theme.slug === slug);
  }

  trouverBranche(
    slug: string
  ): { theme: ThemeRacine; branche: Branche } | undefined {
    for (const theme of TAXONOMIE) {
      const branche = theme.branches.find((b) => b.slug === slug);
      if (branche) {
        return { theme, branche };
      }
    }
    return undefined;
  }

  trouverContexteSousTheme(slug: string): ContexteSousTheme | undefined {
    for (const theme of TAXONOMIE) {
      const direct = theme.sousThemes.find((s) => s.slug === slug);
      if (direct) {
        return { theme, branche: null, sousTheme: direct };
      }
      for (const branche of theme.branches) {
        const sousTheme = branche.sousThemes.find((s) => s.slug === slug);
        if (sousTheme) {
          return { theme, branche, sousTheme };
        }
      }
    }
    return undefined;
  }

  listerThemes(): ThemeRacine[] {
    return TAXONOMIE;
  }
}
