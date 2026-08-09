import { describe, expect, it } from "vitest";
import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import { createGenererFicheScrutinEnrichie } from "@/api/genererFicheScrutinEnrichie";
import type { AmendementDetail, AmendementRepository } from "@/domain/amendement";
import type {
  DiscoursAmendementRepository,
  ExplicationVote,
  ExplicationsVoteRepository,
} from "@/domain/compteRendu";
import type { Dossier } from "@/domain/dossier";
import type { Groupe } from "@/domain/groupes";
import type { Scrutin } from "@/domain/scrutin";

class FakeAmendementRepository implements AmendementRepository {
  constructor(private readonly detail: AmendementDetail | null) {}

  async getByScrutin(): Promise<AmendementDetail | null> {
    return this.detail;
  }
}

// null par défaut : la plupart des tests de ce fichier ne concernent pas
// les Explications de vote (issue #56), ce repository y reste transparent.
class FakeExplicationsVoteRepository implements ExplicationsVoteRepository {
  constructor(private readonly explications: ExplicationVote[] | null = null) {}

  async getByScrutin(): Promise<ExplicationVote[] | null> {
    return this.explications;
  }
}

// [] par défaut, transparent pour les tests qui ne concernent pas le
// tableau des Explications de vote (issue #59) — comparerGroupes n'est
// consulté que sur ce chemin-là dans genererFicheScrutinEnrichie.
function comparerGroupesFixe(comparaison: ComparaisonGroupe[] = []) {
  return () => comparaison;
}

// null par défaut : la plupart des tests de ce fichier ne concernent pas
// le complément de Contexte tiré du discours de séance (issue #94), ce
// repository y reste transparent.
class FakeDiscoursAmendementRepository implements DiscoursAmendementRepository {
  constructor(private readonly discours: string | null = null) {}

  async getByScrutin(): Promise<string | null> {
    return this.discours;
  }
}

function creerGroupe(abreviation: string, overrides: Partial<Groupe> = {}): Groupe {
  return {
    organeRef: `PO-${abreviation}`,
    nom: abreviation,
    abreviation,
    ordreHemicycle: 0,
    ...overrides,
  };
}

function creerScrutin(overrides: Partial<Scrutin>): Scrutin {
  return {
    uid: "VTANR5L17V0",
    titre:
      "l'amendement n° 674 de M. Amirshahi à l'article 2 de la proposition de loi (première lecture).",
    date: "2025-03-18",
    numero: 1,
    dossierRef: "DLR5L17N50169",
    decompte: { pour: 184, contre: 92, abstentions: 1 },
    positionsParGroupe: [],
    resultat: "adopté",
    ...overrides,
  };
}

function creerDossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    dossierRef: "DLR5L17N50169",
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

describe("genererFicheScrutinEnrichie", () => {
  it("construit la Fiche depuis le contenu réel de l'amendement quand le repository en a un", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche).toEqual({
      contexte: "Amendement de M. Amirshahi à l'article 2.",
      action: "Insérer l'alinéa suivant : « ... ».",
      resultatAttendu: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
  });

  it("complète le Contexte avec le discours de séance quand l'exposé des motifs ne fait qu'un seul paragraphe (issue #94)", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository(
        "Il vise à répondre à une situation rencontrée sur le terrain, où plusieurs familles se sont retrouvées sans solution."
      )
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche).toEqual({
      contexte:
        "Amendement de M. Amirshahi à l'article 2.\n\nIl vise à répondre à une situation rencontrée sur le terrain, où plusieurs familles se sont retrouvées sans solution.",
      action: "Insérer l'alinéa suivant : « ... ».",
      resultatAttendu: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
  });

  it("ignore le discours de séance quand l'exposé des motifs a déjà du fond (jamais un doublon avec le Contexte)", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire:
        "Premier paragraphe de fond.\n\nCet amendement propose ainsi l'effet visé.",
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository("Discours de séance qui ne doit pas apparaître.")
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche.contexte).toBe(
      "Amendement de M. Amirshahi à l'article 2.\n\nPremier paragraphe de fond."
    );
  });

  it("ne garde que le dernier paragraphe de l'exposé des motifs comme Résultat attendu, le reste rejoint le Contexte", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire:
        "Premier paragraphe de fond.\n\nDeuxième paragraphe de fond.\n\nCet amendement propose ainsi l'effet visé.",
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche).toEqual({
      contexte:
        "Amendement de M. Amirshahi à l'article 2.\n\nPremier paragraphe de fond.\n\nDeuxième paragraphe de fond.",
      action: "Insérer l'alinéa suivant : « ... ».",
      resultatAttendu: "Cet amendement propose ainsi l'effet visé.",
    });
  });

  it("borne l'Action et le Résultat attendu à ~10 lignes quand le contenu réel est très long", async () => {
    const phraseLongue =
      "Ceci est une phrase de test suffisamment longue pour dépasser la limite fixée. ".repeat(
        15
      );
    const repository = new FakeAmendementRepository({
      dispositif: phraseLongue,
      exposeSommaire: phraseLongue,
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche.action.length).toBeLessThanOrEqual(801);
    expect(fiche.action.endsWith("…")).toBe(true);
    expect(fiche.resultatAttendu.length).toBeLessThanOrEqual(801);
    expect(fiche.resultatAttendu.endsWith("…")).toBe(true);
  });

  it("borne le Contexte à ~10 lignes quand les paragraphes de fond sont longs", async () => {
    const fondLong = "Motif détaillé numéro un très long. ".repeat(30);
    const repository = new FakeAmendementRepository({
      dispositif: "Dispositif court.",
      exposeSommaire: `${fondLong}\n\nCet amendement propose l'effet visé.`,
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche.contexte.length).toBeLessThanOrEqual(801);
    expect(fiche.contexte.endsWith("…")).toBe(true);
    expect(fiche.resultatAttendu).toBe("Cet amendement propose l'effet visé.");
  });

  it("ne tronque pas un contenu déjà court", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Dispositif court.",
      exposeSommaire: "Cet amendement propose l'effet visé.",
    });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche.action).toBe("Dispositif court.");
    expect(fiche.resultatAttendu).toBe("Cet amendement propose l'effet visé.");
  });

  it("retombe sur la Fiche dérivée du titre quand le repository ne trouve rien", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), null, []);

    expect(fiche.contexte).toBe("Amendement de M. Amirshahi à l'article 2.");
  });

  it("retombe aussi proprement sur un scrutin non-amendement quand le repository ne trouve rien", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });

    const fiche = await genererFicheScrutinEnrichie(scrutin, null, [scrutin]);

    expect(fiche.contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de sa première lecture."
    );
  });

  it("renvoie l'état 'pas de données' pointant vers le dossier pour un vote sur l'ensemble, même quand le repository d'amendements ne trouve rien — jamais une copie du Contexte/Action du dossier (issue #84)", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const dossier = creerDossier({
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "Non utilisé ici.",
      },
    });

    const fiche = await genererFicheScrutinEnrichie(scrutin, dossier, [scrutin]);

    expect(fiche).not.toHaveProperty("contexte");
    expect(fiche).not.toHaveProperty("action");
    expect(fiche).toMatchObject({
      dossierRef: dossier.dossierRef,
      dossierTitre: dossier.titre,
    });
  });

  it("ne reprend pas la Fiche dossier quand le dossier a plusieurs votes sur le texte entier (plusieurs lectures)", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      new FakeExplicationsVoteRepository(),
      comparerGroupesFixe(),
      new FakeDiscoursAmendementRepository()
    );

    const premiereLecture = creerScrutin({
      uid: "V1",
      numero: 1,
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const cmp = creerScrutin({
      uid: "V2",
      numero: 2,
      titre:
        "l'ensemble de la proposition de loi (texte de la commission mixte paritaire).",
    });
    const dossier = creerDossier({
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "Non utilisé ici.",
      },
    });

    const fiche = await genererFicheScrutinEnrichie(cmp, dossier, [
      premiereLecture,
      cmp,
    ]);

    expect(fiche.contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de l'examen du texte issu de la commission mixte paritaire."
    );
  });

  it("construit le tableau des Explications de vote (résumés déjà curés) plutôt que la Fiche dossier — issue #59", async () => {
    const repository = new FakeAmendementRepository(null);
    const explicationsVoteRepository = new FakeExplicationsVoteRepository([
      { groupe: "RN", orateur: "M. X", texte: "…", resume: "Le groupe votera contre." },
      { groupe: "SOC", orateur: "Mme Y", texte: "…", resume: "Le groupe votera pour." },
    ]);
    const groupeRN = creerGroupe("RN", { ordreHemicycle: 10 });
    const groupeSOC = creerGroupe("SOC", { ordreHemicycle: 3 });
    const decompteRN = { pour: 0, contre: 5, abstentions: 0 };
    const decompteSOC = { pour: 8, contre: 0, abstentions: 0 };
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      explicationsVoteRepository,
      comparerGroupesFixe([
        { groupe: groupeRN, decompte: decompteRN, position: "Contre" },
        { groupe: groupeSOC, decompte: decompteSOC, position: "Pour" },
      ]),
      new FakeDiscoursAmendementRepository()
    );

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
      decompte: { pour: 184, contre: 92, abstentions: 1 },
      resultat: "adopté",
    });
    const dossier = creerDossier({
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "L'effet attendu du texte.",
      },
    });

    const fiche = await genererFicheScrutinEnrichie(scrutin, dossier, [scrutin]);

    expect(fiche).toEqual({
      contexte: "Contexte de fond du dossier.",
      action: "Ce que change le texte.",
      resultatAttendu: "L'effet attendu du texte.",
      explicationsParGroupe: [
        { groupe: groupeRN, decompte: decompteRN, position: "Contre", resume: "Le groupe votera contre." },
        { groupe: groupeSOC, decompte: decompteSOC, position: "Pour", resume: "Le groupe votera pour." },
      ],
      resultat: "Ce scrutin a été adopté (184 pour, 92 contre, 1 abstention).",
    });
  });

  it("inclut aussi les groupes qui ont voté sans prendre la parole en Explications de vote, avec resume à null", async () => {
    const repository = new FakeAmendementRepository(null);
    const explicationsVoteRepository = new FakeExplicationsVoteRepository([
      { groupe: "RN", orateur: "M. X", texte: "…", resume: "Le groupe votera contre." },
    ]);
    const groupeRN = creerGroupe("RN", { ordreHemicycle: 10 });
    const groupeGDR = creerGroupe("GDR", { ordreHemicycle: 1 });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      explicationsVoteRepository,
      comparerGroupesFixe([
        { groupe: groupeRN, decompte: { pour: 0, contre: 5, abstentions: 0 }, position: "Contre" },
        { groupe: groupeGDR, decompte: { pour: 2, contre: 0, abstentions: 0 }, position: "Pour" },
      ]),
      new FakeDiscoursAmendementRepository()
    );

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const dossier = creerDossier({});

    const fiche = await genererFicheScrutinEnrichie(scrutin, dossier, [scrutin]);

    expect("explicationsParGroupe" in fiche).toBe(true);
    if ("explicationsParGroupe" in fiche) {
      const ligneGDR = fiche.explicationsParGroupe.find(
        (ligne) => ligne.groupe.abreviation === "GDR"
      );
      expect(ligneGDR?.resume).toBeNull();
    }
  });

  it("reprend les Explications de vote même pour un dossier à plusieurs lectures (pas soumis à la contrainte de genererFicheScrutin)", async () => {
    const repository = new FakeAmendementRepository(null);
    const explicationsVoteRepository = new FakeExplicationsVoteRepository([
      { groupe: "RN", orateur: "M. X", texte: "…", resume: "Le groupe votera contre en CMP." },
    ]);
    const groupeRN = creerGroupe("RN", { ordreHemicycle: 10 });
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      explicationsVoteRepository,
      comparerGroupesFixe([
        { groupe: groupeRN, decompte: { pour: 0, contre: 5, abstentions: 0 }, position: "Contre" },
      ]),
      new FakeDiscoursAmendementRepository()
    );

    const premiereLecture = creerScrutin({
      uid: "V1",
      numero: 1,
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const cmp = creerScrutin({
      uid: "V2",
      numero: 2,
      titre:
        "l'ensemble de la proposition de loi (texte de la commission mixte paritaire).",
    });
    const dossier = creerDossier({});

    const fiche = await genererFicheScrutinEnrichie(cmp, dossier, [
      premiereLecture,
      cmp,
    ]);

    expect("explicationsParGroupe" in fiche).toBe(true);
    if ("explicationsParGroupe" in fiche) {
      expect(fiche.explicationsParGroupe).toEqual([
        {
          groupe: groupeRN,
          decompte: { pour: 0, contre: 5, abstentions: 0 },
          position: "Contre",
          resume: "Le groupe votera contre en CMP.",
        },
      ]);
    }
  });

  it("retombe sur l'état 'pas de données' quand des Explications de vote existent mais qu'un groupe n'a pas encore de résumé rédigé (curation incomplète, issue #57)", async () => {
    const repository = new FakeAmendementRepository(null);
    const explicationsVoteRepository = new FakeExplicationsVoteRepository([
      { groupe: "RN", orateur: "M. X", texte: "Nous voterons contre." },
      { groupe: "SOC", orateur: "Mme Y", texte: "…", resume: "Le groupe votera pour." },
    ]);
    const genererFicheScrutinEnrichie = createGenererFicheScrutinEnrichie(
      repository,
      explicationsVoteRepository,
      comparerGroupesFixe([
        { groupe: creerGroupe("RN"), decompte: { pour: 0, contre: 5, abstentions: 0 }, position: "Contre" },
        { groupe: creerGroupe("SOC"), decompte: { pour: 8, contre: 0, abstentions: 0 }, position: "Pour" },
      ]),
      new FakeDiscoursAmendementRepository()
    );

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });
    const dossier = creerDossier({
      ficheDossier: {
        contexte: "Contexte de fond du dossier.",
        action: "Ce que change le texte.",
        resultatAttendu: "Non utilisé ici.",
      },
    });

    const fiche = await genererFicheScrutinEnrichie(scrutin, dossier, [scrutin]);

    expect(fiche).not.toHaveProperty("explicationsParGroupe");
    expect(fiche).toMatchObject({
      dossierRef: dossier.dossierRef,
      dossierTitre: dossier.titre,
    });
  });
});
