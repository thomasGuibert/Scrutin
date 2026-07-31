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
      {
        slug: "soutien-diplomatique-partenaires-europeens",
        nom: "Soutien diplomatique aux partenaires européens",
        type: "consensuel",
      },
    ],
  },
  {
    slug: "education-culture",
    nom: "Éducation & culture",
    description: "École, audiovisuel & médias, culture & patrimoine, sport.",
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
          {
            slug: "inclusion-scolaire-eleves-handicap",
            nom: "Inclusion scolaire des élèves en situation de handicap",
            type: "consensuel",
          },
          {
            slug: "vie-etudiante-bourses-precarite",
            nom: "Vie étudiante : bourses et lutte contre la précarité",
            type: "consensuel",
          },
          {
            slug: "lutte-discriminations-enseignement-superieur",
            nom: "Lutte contre les discriminations et l'antisémitisme dans l'enseignement supérieur",
            type: "consensuel",
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
      {
        slug: "audiovisuel-medias",
        nom: "Audiovisuel & médias",
        sousThemes: [
          {
            slug: "droits-voisins-remuneration-presse",
            nom: "Droits voisins et rémunération de la presse",
            type: "consensuel",
          },
          {
            slug: "financement-audiovisuel-public",
            nom: "Financement de l'audiovisuel public",
            type: "consensuel",
          },
        ],
      },
      {
        slug: "sport",
        nom: "Sport",
        sousThemes: [
          {
            slug: "gouvernance-financement-sport-professionnel",
            nom: "Gouvernance et financement du sport professionnel",
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
          {
            slug: "controle-transparence-lieux-privation-liberte",
            nom: "Contrôle et transparence des lieux de privation de liberté",
            type: "consensuel",
          },
          {
            slug: "securite-routiere",
            nom: "Sécurité routière",
            type: "consensuel",
          },
          {
            slug: "housekeeping-justice-police-immigration",
            nom: "Housekeeping / technique",
            type: "housekeeping",
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
          {
            slug: "transparence-probite-vie-politique",
            nom: "Transparence et probité de la vie politique",
            type: "consensuel",
          },
          {
            slug: "gouvernance-gestion-moyens-etat",
            nom: "Gouvernance et gestion des moyens de l'État",
            type: "consensuel",
          },
          {
            slug: "reconnaissance-engagement-securite-civile",
            nom: "Reconnaissance de l'engagement des acteurs de la sécurité civile",
            type: "consensuel",
          },
          {
            slug: "housekeeping-vie-democratique",
            nom: "Housekeeping / technique",
            type: "housekeeping",
          },
          {
            slug: "pouvoirs-parlement-vs-executif",
            nom: "Pouvoirs : renforcer le Parlement vs préserver la prééminence présidentielle",
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
          {
            slug: "statut-agents-publics-locaux",
            nom: "Statut et gestion des agents publics locaux",
            type: "consensuel",
          },
          {
            slug: "statut-elu-local",
            nom: "Statut et protection de l'élu local",
            type: "consensuel",
          },
          {
            slug: "financement-competences-communes",
            nom: "Financement des compétences déléguées aux communes",
            type: "consensuel",
          },
          {
            slug: "financement-investissement-communal",
            nom: "Financement de l'investissement communal",
            type: "consensuel",
          },
          {
            slug: "regularisation-fonciere-outre-mer",
            nom: "Régularisation foncière en outre-mer",
            type: "consensuel",
          },
          {
            slug: "urgence-reconstruction-outre-mer",
            nom: "Urgence et reconstruction après une catastrophe naturelle en outre-mer",
            type: "consensuel",
          },
          {
            slug: "housekeeping-collectivites-territoriales",
            nom: "Housekeeping / technique",
            type: "housekeeping",
          },
        ],
      },
      {
        slug: "droit-civil-etat-personnes",
        nom: "Droit civil & état des personnes",
        sousThemes: [
          {
            slug: "lutte-fraude-etat-civil",
            nom: "Lutte contre la fraude à l'état civil",
            type: "consensuel",
          },
          {
            slug: "protection-interet-enfant-procedures-familiales",
            nom: "Protection de l'intérêt de l'enfant dans les procédures familiales",
            type: "consensuel",
          },
          {
            slug: "simplification-droit-successoral",
            nom: "Simplification du droit successoral",
            type: "consensuel",
          },
          {
            slug: "acces-nationalite-francaise",
            nom: "Accès à la nationalité française : durcissement des conditions vs droit du sol",
            type: "clivant",
          },
        ],
      },
    ],
    sousThemes: [],
  },
  {
    slug: "repartition-richesses",
    nom: "Répartition des richesses",
    description: "Fiscalité, salaires, aides sociales, retraites, pouvoir d'achat.",
    branches: [
      {
        slug: "fiscalite-regulation",
        nom: "Fiscalité & régulation économique",
        sousThemes: [
          {
            slug: "nationalisations-marche",
            nom: "Rôle de l'État dans l'économie : nationalisations vs marché",
            type: "clivant",
          },
          {
            slug: "simplification-droit-vie-economique",
            nom: "Simplification du droit et de la vie économique",
            type: "consensuel",
          },
          {
            slug: "lutte-fraude-sociale-fiscale",
            nom: "Lutte contre la fraude sociale et fiscale",
            type: "consensuel",
          },
          {
            slug: "lutte-fraude-moyens-paiement",
            nom: "Lutte contre la fraude aux moyens de paiement",
            type: "consensuel",
          },
          {
            slug: "vie-chere-regulation-marches-outre-mer",
            nom: "Vie chère et régulation des marchés en outre-mer",
            type: "consensuel",
          },
          {
            slug: "fiscalite-grandes-fortunes",
            nom: "Fiscalité des grandes fortunes : taxation renforcée vs libre circulation des capitaux",
            type: "clivant",
          },
        ],
      },
      {
        slug: "retraites-salaires-minima",
        nom: "Retraites, salaires & minima sociaux",
        sousThemes: [
          {
            slug: "retraites",
            nom: "Retraites : capitalisation vs répartition",
            type: "clivant",
          },
          {
            slug: "emploi-formation-professionnelle",
            nom: "Emploi et formation professionnelle",
            type: "consensuel",
          },
          {
            slug: "temps-travail-jours-feries",
            nom: "Temps de travail et jours fériés",
            type: "consensuel",
          },
          {
            slug: "gouvernance-assurance-chomage",
            nom: "Gouvernance de l'assurance chômage",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [],
  },
  {
    slug: "solidarite",
    nom: "Solidarité & protection sociale",
    description: "Santé, handicap, famille, logement.",
    branches: [
      {
        slug: "logement",
        nom: "Logement",
        sousThemes: [
          {
            slug: "logement-travailleurs-services-publics",
            nom: "Logement des travailleurs des services publics",
            type: "consensuel",
          },
          {
            slug: "mobilisation-parc-logements-existants",
            nom: "Mobilisation du parc de logements existants",
            type: "consensuel",
          },
          {
            slug: "entretien-accessibilite-logements-collectifs",
            nom: "Entretien et accessibilité des logements collectifs",
            type: "consensuel",
          },
          {
            slug: "encadrement-loyers-habitat-outre-mer",
            nom: "Encadrement des loyers et qualité de l'habitat en outre-mer",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [
      {
        slug: "fin-de-vie",
        nom: "Fin de vie : légaliser l'aide à mourir vs renforcer les soins palliatifs",
        type: "clivant",
      },
      {
        slug: "acces-soins",
        nom: "Accès aux soins sur le territoire",
        type: "consensuel",
      },
      {
        slug: "protection-enfance",
        nom: "Protection de l'enfance",
        type: "consensuel",
      },
      {
        slug: "sante-publique-risque",
        nom: "Santé publique : réguler les produits à risque vs liberté de consommation",
        type: "clivant",
      },
      {
        slug: "prise-en-charge-cancers-maladies-rares-enfant",
        nom: "Prise en charge des cancers et maladies rares de l'enfant",
        type: "consensuel",
      },
      {
        slug: "prise-en-charge-maladies-graves",
        nom: "Prise en charge des maladies graves",
        type: "consensuel",
      },
      {
        slug: "prevention-sanitaire-contaminations",
        nom: "Prévention sanitaire et lutte contre les contaminations",
        type: "consensuel",
      },
      {
        slug: "financement-securite-sociale",
        nom: "Financement et équilibre de la sécurité sociale",
        type: "consensuel",
      },
    ],
  },
  {
    slug: "environnement",
    nom: "Environnement & ressources",
    description: "Écologie, énergie, agriculture, aménagement du territoire.",
    branches: [
      {
        slug: "agriculture",
        nom: "Agriculture",
        sousThemes: [
          {
            slug: "pesticides-sante-environnementale",
            nom: "Pesticides et santé environnementale",
            type: "consensuel",
          },
          {
            slug: "conditions-vie-sante-agriculteurs",
            nom: "Conditions de vie et santé des agriculteurs",
            type: "consensuel",
          },
          {
            slug: "resilience-agriculture-changement-climatique",
            nom: "Résilience de l'agriculture face au changement climatique",
            type: "consensuel",
          },
          {
            slug: "amenagement-developpement-territoires-montagne",
            nom: "Aménagement et développement des territoires de montagne",
            type: "consensuel",
          },
          {
            slug: "gouvernance-representation-agricole",
            nom: "Gouvernance et représentation dans les instances agricoles",
            type: "consensuel",
          },
          {
            slug: "protection-foncier-agricole",
            nom: "Protection du foncier agricole",
            type: "consensuel",
          },
          {
            slug: "biodiversite-especes-invasives",
            nom: "Biodiversité et lutte contre les espèces invasives",
            type: "consensuel",
          },
          {
            slug: "souverainete-alimentaire-renouvellement-generations",
            nom: "Souveraineté alimentaire et renouvellement des générations agricoles",
            type: "consensuel",
          },
        ],
      },
    ],
    sousThemes: [
      {
        slug: "souverainete-energetique",
        nom: "Souveraineté énergétique : nucléaire/hydrocarbures vs sobriété",
        type: "clivant",
      },
      {
        slug: "agriculture-pesticides",
        nom: "Agriculture : pesticides et compétitivité vs écologie/santé publique",
        type: "clivant",
      },
      {
        slug: "economie-circulaire",
        nom: "Déchets et économie circulaire",
        type: "consensuel",
      },
      {
        slug: "adaptation-changement-climatique-gestion-risques",
        nom: "Adaptation au changement climatique et gestion des risques",
        type: "consensuel",
      },
      {
        slug: "decarbonation-transport-maritime",
        nom: "Décarbonation du transport maritime",
        type: "consensuel",
      },
    ],
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
