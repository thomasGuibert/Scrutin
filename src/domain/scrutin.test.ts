import { describe, expect, it } from "vitest";
import type { Dossier } from "@/domain/dossier";
import {
  agregerPositions,
  calculerPosition,
  calculerTauxParticipation,
  calculerVotants,
  determinerResultatDossier,
  estVoteSurAmendement,
  estVoteSurEnsemble,
  extraireAmendement,
  formaterTitreScrutin,
  genererFicheScrutin,
  lienScrutinAN,
  type FicheScrutin,
  type FicheScrutinPasDeDonnees,
  type Scrutin,
  trouverScrutinDecisif,
} from "@/domain/scrutin";

// genererFicheScrutin retourne FicheScrutin | FicheScrutinPasDeDonnees (cf.
// ScrutinBrief.tsx pour le même narrowing en production) — cette poignée de
// tests portent spécifiquement sur le contenu textuel de la variante
// "avec données", donc affirment l'absence de la variante "pas de données"
// plutôt que de la gérer.
function ficheAvecDonnees(
  fiche: FicheScrutin | FicheScrutinPasDeDonnees
): FicheScrutin {
  if (!("contexte" in fiche)) {
    throw new Error(
      "Fiche 'pas de données' inattendue : ce test porte sur le Contexte/Action."
    );
  }
  return fiche;
}

describe("calculerVotants", () => {
  it("somme pour, contre et abstentions", () => {
    const votants = calculerVotants({ pour: 10, contre: 5, abstentions: 3 });

    expect(votants).toBe(18);
  });

  it("exclut les absents du calcul (ils ne sont pas comptés dans les décomptes)", () => {
    const votants = calculerVotants({ pour: 0, contre: 0, abstentions: 0 });

    expect(votants).toBe(0);
  });
});

describe("calculerPosition", () => {
  it("retourne Pour quand le camp Pour est majoritaire et le camp minoritaire ne dépasse pas 33% des Votants", () => {
    // votants = 20, contre (minoritaire) = 5 -> 25%
    const position = calculerPosition({ pour: 15, contre: 5, abstentions: 0 });

    expect(position).toBe("Pour");
  });

  it("retourne Contre quand le camp Contre est majoritaire et le camp minoritaire ne dépasse pas 33% des Votants", () => {
    // votants = 20, pour (minoritaire) = 5 -> 25%
    const position = calculerPosition({ pour: 5, contre: 15, abstentions: 0 });

    expect(position).toBe("Contre");
  });

  it("retourne Divisé quand le camp minoritaire dépasse strictement 33% des Votants (cas réel : DR sur l'amendement Code noir)", () => {
    // votants = 2, minoritaire = 1 -> 50%
    const position = calculerPosition({ pour: 1, contre: 1, abstentions: 0 });

    expect(position).toBe("Divisé");
  });

  it("retourne Pour quand le groupe n'a aucun Votant (n'a pas participé au scrutin)", () => {
    const position = calculerPosition({ pour: 0, contre: 0, abstentions: 0 });

    expect(position).toBe("Pour");
  });

  it("n'est pas Divisé exactement à 33% des Votants (seuil strict, pas inclusif)", () => {
    // votants = 3, minoritaire = 1 -> exactement 33.33...%, donc Divisé (au-dessus, pas égal)
    // votants = 100, minoritaire = 33 -> exactement 33%, ne dépasse pas -> pas Divisé
    const position = calculerPosition({ pour: 67, contre: 33, abstentions: 0 });

    expect(position).toBe("Pour");
  });
});

describe("calculerTauxParticipation", () => {
  it("divise les Votants du groupe par son effectif total", () => {
    const taux = calculerTauxParticipation(
      { pour: 8, contre: 2, abstentions: 0 },
      20
    );

    expect(taux).toBe(0.5);
  });
});

describe("agregerPositions", () => {
  it("pondère chaque scrutin par le taux de participation du groupe, pas par une simple moyenne du nombre de scrutins", () => {
    // Scrutin A : 9 pour, 1 contre sur 10 votants, effectif 10 -> taux 1.0, 90%/10%
    // Scrutin B : 1 pour, 1 contre sur 2 votants, effectif 2 -> taux 1.0, 50%/50%
    // même poids (taux=1 chacun) -> moyenne simple des deux répartitions : 70%/30%
    const agrege = agregerPositions([
      { decompte: { pour: 9, contre: 1, abstentions: 0 }, effectif: 10 },
      { decompte: { pour: 1, contre: 1, abstentions: 0 }, effectif: 2 },
    ]);

    expect(agrege.pour).toBeCloseTo(0.7);
    expect(agrege.contre).toBeCloseTo(0.3);
    expect(agrege.abstentions).toBeCloseTo(0);
  });

  it("pèse moins un scrutin technique peu suivi qu'un scrutin largement suivi (taux de participation faible)", () => {
    // Scrutin A : bien suivi, taux de participation 1.0, 100% pour
    // Scrutin B : très peu suivi (1 votant sur 100 membres), taux 0.01, 100% contre
    // le résultat agrégé doit rester très majoritairement Pour, pas 50/50
    const agrege = agregerPositions([
      { decompte: { pour: 10, contre: 0, abstentions: 0 }, effectif: 10 },
      { decompte: { pour: 0, contre: 1, abstentions: 0 }, effectif: 100 },
    ]);

    expect(agrege.pour).toBeGreaterThan(0.9);
  });

  it("retourne un décompte nul quand aucun scrutin n'a de Votant (taux de participation total nul)", () => {
    const agrege = agregerPositions([
      { decompte: { pour: 0, contre: 0, abstentions: 0 }, effectif: 10 },
    ]);

    expect(agrege).toEqual({ pour: 0, contre: 0, abstentions: 0 });
  });
});

describe("formaterTitreScrutin", () => {
  it("retire la description du dossier répétée après le type de texte, et met une majuscule initiale", () => {
    const titre = formaterTitreScrutin(
      "l'amendement n° 44 de M. Arnaud Bonnet à l'article premier de la proposition de loi visant à garantir l'information et la protection effective des victimes de violences sexistes et sexuelles lors de la libération de leur agresseur (première lecture)."
    );

    expect(titre).toBe(
      "L'amendement n° 44 de M. Arnaud Bonnet à l'article premier de la proposition de loi (première lecture)."
    );
  });

  it("conserve la qualification organique/constitutionnelle du type de texte", () => {
    const titre = formaterTitreScrutin(
      "l'article 3 du projet de loi organique relatif à l'élection des sénateurs (nouvelle lecture)."
    );

    expect(titre).toBe(
      "L'article 3 du projet de loi organique (nouvelle lecture)."
    );
  });

  it("laisse inchangé un titre sans type de texte reconnu (ex. motion de censure), à la majuscule près", () => {
    const titre = formaterTitreScrutin(
      "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par M. Boris Vallaud."
    );

    expect(titre).toBe(
      "La motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par M. Boris Vallaud."
    );
  });

  it("laisse inchangé un titre où le type de texte n'est suivi d'aucune description à retirer", () => {
    const titre = formaterTitreScrutin(
      "l'article 26 du projet de loi (première lecture)."
    );

    expect(titre).toBe("L'article 26 du projet de loi (première lecture).");
  });
});

describe("lienScrutinAN", () => {
  it("construit l'URL de la fiche officielle à partir du numéro et de la législature encodée dans l'uid", () => {
    const scrutin = creerScrutin({ uid: "VTANR5L17V7988", numero: 7988 });

    expect(lienScrutinAN(scrutin)).toBe(
      "https://www.assemblee-nationale.fr/dyn/17/scrutins/7988"
    );
  });

  it("s'adapte à une autre législature encodée dans l'uid", () => {
    const scrutin = creerScrutin({ uid: "VTANR5L16V123", numero: 123 });

    expect(lienScrutinAN(scrutin)).toBe(
      "https://www.assemblee-nationale.fr/dyn/16/scrutins/123"
    );
  });
});

describe("estVoteSurEnsemble", () => {
  it("reconnaît le vote sur l'ensemble d'un texte", () => {
    expect(
      estVoteSurEnsemble(
        "l'ensemble de la proposition de loi visant à garantir l'information (première lecture)."
      )
    ).toBe(true);
  });

  it("ne reconnaît pas un vote sur un article ou un amendement", () => {
    expect(
      estVoteSurEnsemble("l'article premier de la proposition de loi.")
    ).toBe(false);
  });
});

function creerScrutin(overrides: Partial<Scrutin>): Scrutin {
  return {
    uid: "VTANR5L17V0",
    titre: "l'article premier de la proposition de loi (première lecture).",
    date: "2026-01-01",
    numero: 1,
    dossierRef: "DLR5L17N1",
    decompte: { pour: 1, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat: "adopté",
    ...overrides,
  };
}

function creerDossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    dossierRef: "DLR5L17N1",
    titre: "Un dossier",
    sousTheme: "un-sous-theme",
    tagsImpact: [],
    ficheDossier: {
      contexte: "Contexte du dossier.",
      action: "Action du dossier.",
      resultatAttendu: "Résultat attendu du dossier.",
    },
    ...overrides,
  };
}

describe("trouverScrutinDecisif — cas au-delà du vote sur l'ensemble", () => {
  it("retient le vote sur l'article unique d'un texte qui n'a pas de vote sur l'ensemble distinct", () => {
    const decisif = creerScrutin({
      uid: "V2",
      numero: 2,
      titre:
        "l'article unique de la proposition de loi relative à la sortie des collections publiques (première lecture).",
    });
    const scrutins = [
      creerScrutin({ uid: "V1", numero: 1, titre: "l'amendement n° 1 à l'article unique de la proposition de loi." }),
      decisif,
    ];

    expect(trouverScrutinDecisif(scrutins)).toEqual(decisif);
  });

  it("retient un vote direct sur le texte lui-même, sans article ni ensemble distinct (ex. ratification de traité)", () => {
    const decisif = creerScrutin({
      uid: "V1",
      numero: 1,
      titre:
        "le projet de loi autorisant l'approbation de l'accord entre le Gouvernement de la République française et la Communauté des Caraïbes (première lecture).",
    });

    expect(trouverScrutinDecisif([decisif])).toEqual(decisif);
  });

  it("ne confond pas un vote direct sur le texte avec un vote sur un article ou une motion qui le mentionne plus loin", () => {
    const scrutins = [
      creerScrutin({
        titre: "l'article premier du projet de loi autorisant l'approbation de l'accord.",
      }),
      creerScrutin({
        titre:
          "la motion de rejet préalable, déposée par Mme X, du projet de loi autorisant l'approbation de l'accord.",
        resultat: "rejeté",
      }),
    ];

    expect(trouverScrutinDecisif(scrutins)).toBeNull();
  });

  it("retient une motion de rejet préalable adoptée, qui tue le texte avant tout vote sur l'ensemble", () => {
    const decisif = creerScrutin({
      uid: "V1",
      numero: 1,
      titre: "la motion de rejet préalable, déposée par Mme X, du projet de loi Y.",
      resultat: "adopté",
    });

    expect(trouverScrutinDecisif([decisif])).toEqual(decisif);
    // Le champ resultat du scrutin ("adopté") décrit l'issue de la motion,
    // pas celle du texte : la motion adoptée tue le texte, donc le dossier
    // est rejeté — l'inverse littéral du resultat de ce scrutin.
    expect(determinerResultatDossier([decisif])).toBe("rejeté");
  });

  it("ignore une motion de rejet préalable rejetée : le texte continue son parcours normal", () => {
    const scrutins = [
      creerScrutin({
        titre: "la motion de rejet préalable, déposée par Mme X, du projet de loi Y.",
        resultat: "rejeté",
      }),
    ];

    expect(trouverScrutinDecisif(scrutins)).toBeNull();
  });

  it("retient une motion de censure, décisive quelle que soit son issue puisqu'elle est son propre objet", () => {
    const censureAdoptee = creerScrutin({
      uid: "V1",
      numero: 1,
      titre:
        "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par Mme X.",
      resultat: "adopté",
    });

    expect(trouverScrutinDecisif([censureAdoptee])).toEqual(censureAdoptee);

    const censureRejetee = creerScrutin({
      uid: "V2",
      numero: 1,
      titre:
        "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par Mme X.",
      resultat: "rejeté",
    });

    expect(trouverScrutinDecisif([censureRejetee])).toEqual(censureRejetee);
  });
});

describe("determinerResultatDossier", () => {
  it("retourne le résultat du vote sur l'ensemble", () => {
    const scrutins = [
      creerScrutin({ numero: 1, titre: "l'article premier de la loi." }),
      creerScrutin({
        numero: 2,
        titre: "l'ensemble de la proposition de loi (première lecture).",
        resultat: "adopté",
      }),
    ];

    expect(determinerResultatDossier(scrutins)).toBe("adopté");
  });

  it("retient le vote sur l'ensemble le plus récent quand il y a plusieurs lectures", () => {
    const scrutins = [
      creerScrutin({
        numero: 2,
        titre: "l'ensemble de la proposition de loi (première lecture).",
        resultat: "rejeté",
      }),
      creerScrutin({
        numero: 10,
        titre: "l'ensemble de la proposition de loi (nouvelle lecture).",
        resultat: "adopté",
      }),
    ];

    expect(determinerResultatDossier(scrutins)).toBe("adopté");
  });

  it("retourne null quand aucun vote sur l'ensemble n'a encore eu lieu", () => {
    const scrutins = [
      creerScrutin({ numero: 1, titre: "l'article premier de la loi." }),
    ];

    expect(determinerResultatDossier(scrutins)).toBeNull();
  });
});

describe("trouverScrutinDecisif", () => {
  it("retourne le scrutin dont le titre commence par l'ensemble", () => {
    const decisif = creerScrutin({
      uid: "V2",
      numero: 2,
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const scrutins = [
      creerScrutin({ uid: "V1", numero: 1, titre: "l'article premier de la loi." }),
      decisif,
    ];

    expect(trouverScrutinDecisif(scrutins)).toEqual(decisif);
  });

  it("retourne null en l'absence de vote sur l'ensemble (dossier encore en cours d'examen)", () => {
    const scrutins = [
      creerScrutin({ titre: "l'article premier de la loi." }),
      creerScrutin({ titre: "l'amendement n° 1 à l'article premier." }),
    ];

    expect(trouverScrutinDecisif(scrutins)).toBeNull();
  });
});

describe("genererFicheScrutin", () => {
  it("dérive un contexte spécifique à l'amendement plutôt que le titre du dossier", () => {
    const scrutin = creerScrutin({
      titre:
        "l'amendement n° 44 de M. Arnaud Bonnet à l'article premier de la proposition de loi visant à garantir l'information (première lecture).",
      decompte: { pour: 46, contre: 36, abstentions: 32 },
      resultat: "adopté",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(fiche).toEqual({
      contexte: "Amendement de M. Arnaud Bonnet à l'article premier.",
      action:
        "L'amendement n° 44 de M. Arnaud Bonnet à l'article premier de la proposition de loi (première lecture).",
      resultat: "Ce scrutin a été adopté (46 pour, 36 contre, 32 abstentions).",
    });
  });

  it("indique l'absence de dossier rattaché quand il n'y en a pas et que le titre n'est pas classifiable", () => {
    const scrutin = creerScrutin({ dossierRef: null });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Ce scrutin ne se rattache à aucun dossier législatif recensé."
    );
  });

  it("retombe sur le titre du dossier quand le titre du scrutin n'est classifiable par aucun type de vote connu", () => {
    const scrutin = creerScrutin({
      titre: "l'article premier de la proposition de loi (première lecture).",
    });

    const fiche = genererFicheScrutin(
      scrutin,
      creerDossier({ titre: "Un dossier quelconque" }),
      [scrutin]
    );

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Ce scrutin porte sur le dossier « Un dossier quelconque »."
    );
  });

  it("accorde \"abstention\" au singulier quand il n'y en a qu'une", () => {
    const scrutin = creerScrutin({
      decompte: { pour: 5, contre: 2, abstentions: 1 },
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(fiche.resultat).toContain("1 abstention)");
  });

  it("mentionne la lecture pour un vote sur l'ensemble quand aucun dossier n'est rattaché", () => {
    const scrutin = creerScrutin({
      titre:
        "l'ensemble de la proposition de loi visant à garantir l'information (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de sa première lecture."
    );
  });

  it("décrit le texte issu de la commission mixte paritaire pour un vote sur l'ensemble en CMP, quand aucun dossier n'est rattaché", () => {
    const scrutin = creerScrutin({
      titre:
        "l'ensemble de la proposition de loi visant à sortir la France du piège du narcotrafic (texte de la commission mixte paritaire).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de l'examen du texte issu de la commission mixte paritaire."
    );
  });

  it("mentionne la lecture pour un vote sur l'article unique quand aucun dossier n'est rattaché", () => {
    const scrutin = creerScrutin({
      titre:
        "l'article unique de la proposition de loi relative à la sortie des collections publiques (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Vote sur l'article unique du texte, à l'issue de sa première lecture."
    );
  });

  it("mentionne la lecture pour un vote direct sur le texte (ex. ratification de traité), quand aucun dossier n'est rattaché", () => {
    const scrutin = creerScrutin({
      titre:
        "le projet de loi autorisant l'approbation de l'accord entre le Gouvernement de la République française et la Communauté des Caraïbes (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Vote sur le texte lui-même, à l'issue de sa première lecture."
    );
  });

  it("renvoie un état explicite 'pas de données' pointant vers le dossier pour un vote sur l'ensemble qui est le seul de son dossier, plutôt que la description procédurale ou une copie de la Fiche dossier", () => {
    const scrutin = creerScrutin({
      titre:
        "l'ensemble de la proposition de loi visant à sortir la France du piège du narcotrafic (texte de la commission mixte paritaire).",
      decompte: { pour: 65, contre: 41, abstentions: 52 },
      resultat: "adopté",
    });
    const dossier = creerDossier({
      dossierRef: "DLR5L17N53980",
      titre: "Sortir la France du piège du narcotrafic",
      ficheDossier: {
        contexte: "Le narcotrafic gangrène des pans entiers du territoire.",
        action: "Le texte crée un parquet national anti-criminalité organisée.",
        resultatAttendu: "Un arsenal juridique renforcé contre les réseaux.",
      },
    });

    const fiche = genererFicheScrutin(scrutin, dossier, [scrutin]);

    expect(fiche).toEqual({
      message: "Nous n'avons pas encore de contexte détaillé propre à ce scrutin.",
      dossierRef: "DLR5L17N53980",
      dossierTitre: "Sortir la France du piège du narcotrafic",
      resultat: "Ce scrutin a été adopté (65 pour, 41 contre, 52 abstentions).",
    });
  });

  it("renvoie aussi cet état pour un vote sur l'article unique et un vote direct sur le texte, chacun seul de son dossier — jamais le Contexte/Action du dossier recopiés", () => {
    const dossier = creerDossier({
      dossierRef: "DLR5L17N1",
      titre: "Un dossier",
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "Non utilisé ici.",
      },
    });

    const scrutinArticleUnique = creerScrutin({
      titre:
        "l'article unique de la proposition de loi relative à la sortie des collections publiques (première lecture).",
    });
    const articleUnique = genererFicheScrutin(scrutinArticleUnique, dossier, [
      scrutinArticleUnique,
    ]);
    expect(articleUnique).not.toHaveProperty("contexte");
    expect(articleUnique).not.toHaveProperty("action");
    expect(articleUnique).toMatchObject({
      dossierRef: "DLR5L17N1",
      dossierTitre: "Un dossier",
    });

    const scrutinVoteDirect = creerScrutin({
      titre:
        "le projet de loi autorisant l'approbation de l'accord entre le Gouvernement de la République française et la Communauté des Caraïbes (première lecture).",
    });
    const voteDirect = genererFicheScrutin(scrutinVoteDirect, dossier, [
      scrutinVoteDirect,
    ]);
    expect(voteDirect).not.toHaveProperty("contexte");
    expect(voteDirect).not.toHaveProperty("action");
    expect(voteDirect).toMatchObject({
      dossierRef: "DLR5L17N1",
      dossierTitre: "Un dossier",
    });
  });

  it("retombe sur la description procédurale quand le dossier a plusieurs votes sur le texte entier (plusieurs lectures)", () => {
    const premiereLecture = creerScrutin({
      uid: "V1",
      numero: 1,
      titre:
        "l'ensemble de la proposition de loi visant à sortir la France du piège du narcotrafic (première lecture).",
    });
    const cmp = creerScrutin({
      uid: "V2",
      numero: 2,
      titre:
        "l'ensemble de la proposition de loi visant à sortir la France du piège du narcotrafic (texte de la commission mixte paritaire).",
    });
    const dossier = creerDossier({
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "Non utilisé ici.",
      },
    });
    const scrutinsDossier = [premiereLecture, cmp];

    const ficheCmp = genererFicheScrutin(cmp, dossier, scrutinsDossier);

    // Ni la description générique de la première lecture ni celle de la CMP
    // ne doivent reprendre la Fiche dossier à l'identique : le dossier a
    // 2 votes sur le texte entier, répéter le même Contexte/Action sur les
    // deux perdrait le pourquoi propre à chacun (cf. discussion du
    // 2026-08-06) — repli sur la description procédurale en attendant une
    // curation par scrutin.
    expect(ficheAvecDonnees(ficheCmp).contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de l'examen du texte issu de la commission mixte paritaire."
    );
    expect(ficheAvecDonnees(ficheCmp).action).not.toBe("Ce que change le texte.");
  });

  it("nomme l'auteur·ice d'une motion de rejet préalable", () => {
    const scrutin = creerScrutin({
      titre:
        "la motion de rejet préalable, déposée par Mme Mathilde Panot, de la proposition de loi visant à sortir la France du piège du narcotrafic (texte de la commission mixte paritaire).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Mme Mathilde Panot dépose une motion de rejet préalable visant à écarter le texte avant tout débat sur son contenu."
    );
  });

  it("nomme le·la premier·ère signataire d'une motion de censure", () => {
    const scrutin = creerScrutin({
      titre:
        "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par M. Boris Vallaud, Mme Mathilde Panot, Mme Cyrielle Chatelain, M. André Chassaigne et 188 de leurs collègues.",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Motion de censure déposée par M. Boris Vallaud."
    );
  });

  it("nomme l'auteur·ice et l'article visé pour un vote sur amendement", () => {
    const scrutin = creerScrutin({
      titre:
        "l'amendement n° 674 de M. Amirshahi à l'article 2 de la proposition de loi visant à sortir la France du piège du narcotrafic (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe("Amendement de M. Amirshahi à l'article 2.");
  });

  it("distingue un sous-amendement d'un amendement", () => {
    const scrutin = creerScrutin({
      titre:
        "le sous-amendement n° 973 de M. Caure à l'amendement n° 674 de M. Amirshahi à l'article 2 de la proposition de loi visant à sortir la France du piège du narcotrafic (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe("Sous-amendement de M. Caure à l'article 2.");
  });

  it("retrouve l'auteur et l'article d'un amendement de suppression", () => {
    const scrutin = creerScrutin({
      titre:
        "l'amendement de suppression n° 265 de M. Bernalicis de suppression de l'article 5 bis de la proposition de loi visant à sortir la France du piège du narcotrafic (première lecture).",
    });

    const fiche = genererFicheScrutin(scrutin, null, [scrutin]);

    expect(ficheAvecDonnees(fiche).contexte).toBe(
      "Amendement de M. Bernalicis à l'article 5 bis."
    );
  });
});

describe("extraireAmendement", () => {
  it("extrait le numéro, l'auteur et l'article d'un amendement", () => {
    expect(
      extraireAmendement(
        "l'amendement n° 674 de M. Amirshahi à l'article 2 de la proposition de loi visant à sortir la France du piège du narcotrafic (première lecture)."
      )
    ).toEqual({ numero: "674", auteur: "M. Amirshahi", article: "2" });
  });

  it("retourne null pour un titre qui n'est pas un amendement", () => {
    expect(
      extraireAmendement("l'ensemble de la proposition de loi (première lecture).")
    ).toBeNull();
  });
});

describe("estVoteSurAmendement", () => {
  it("reconnaît un vote sur un amendement", () => {
    expect(
      estVoteSurAmendement(
        "l'amendement n° 9 de M. Di Filippo à l'article unique de la proposition de loi."
      )
    ).toBe(true);
  });

  it("reconnaît un vote sur un sous-amendement", () => {
    expect(
      estVoteSurAmendement(
        "le sous-amendement n° 973 de M. Caure à l'amendement n° 674 de M. Amirshahi à l'article 2."
      )
    ).toBe(true);
  });

  it("ne reconnaît pas un vote sur l'ensemble ou un article", () => {
    expect(
      estVoteSurAmendement(
        "l'ensemble de la proposition de loi (première lecture)."
      )
    ).toBe(false);
    expect(
      estVoteSurAmendement("l'article premier de la proposition de loi.")
    ).toBe(false);
  });
});
