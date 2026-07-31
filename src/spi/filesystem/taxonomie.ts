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
      {
        slug: "housekeeping-technique",
        nom: "Housekeeping / technique",
        type: "housekeeping",
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
          {
            slug: "acces-ecole",
            nom: "Accès à l'école : égalité territoriale vs adaptation aux réalités locales",
            type: "clivant",
          },
        ],
      },
      {
        slug: "culture-patrimoine",
        nom: "Culture & patrimoine",
        sousThemes: [
          {
            slug: "patrimoine-transmission",
            nom: "Financement et transmission du patrimoine",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [],
  },
  {
    slug: "libertes-securite",
    nom: "Libertés & sécurité",
    description: "Justice, police, surveillance, immigration, libertés individuelles.",
    branches: [
      {
        slug: "justice-police-immigration",
        nom: "Justice, police & immigration",
        sousThemes: [
          {
            slug: "fermete-penale",
            nom: "Sécurité : fermeté pénale vs garanties individuelles",
            type: "clivant",
          },
          {
            slug: "protection-victimes",
            nom: "Protection des victimes (violences sexuelles, intrafamiliales, mineurs)",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [],
  },
  {
    slug: "institutions",
    nom: "Institutions",
    description:
      "Vie démocratique & pouvoirs publics, collectivités territoriales & décentralisation, droit civil & état des personnes.",
    branches: [
      {
        slug: "vie-democratique",
        nom: "Vie démocratique & pouvoirs publics",
        sousThemes: [
          {
            slug: "mode-scrutin",
            nom: "Mode de scrutin : proportionnelle vs scrutin majoritaire",
            type: "clivant",
          },
        ],
      },
      {
        slug: "collectivites-territoriales",
        nom: "Collectivités territoriales & décentralisation",
        sousThemes: [
          {
            slug: "statuts-outre-mer",
            nom: "Statuts spéciaux outre-mer : autonomie vs unité républicaine",
            type: "clivant",
          },
          {
            slug: "organisation-territoriale",
            nom: "Organisation territoriale : simplifier les échelons vs préserver la proximité",
            type: "clivant",
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
