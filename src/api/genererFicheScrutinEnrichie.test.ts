import { describe, expect, it } from "vitest";
import { createGenererFicheScrutinEnrichie } from "@/api/genererFicheScrutinEnrichie";
import type { AmendementDetail, AmendementRepository } from "@/domain/amendement";
import type { Scrutin } from "@/domain/scrutin";

class FakeAmendementRepository implements AmendementRepository {
  constructor(private readonly detail: AmendementDetail | null) {}

  async getByScrutin(): Promise<AmendementDetail | null> {
    return this.detail;
  }
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

describe("genererFicheScrutinEnrichie", () => {
  it("construit la Fiche depuis le contenu réel de l'amendement quand le repository en a un", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

    expect(fiche).toEqual({
      contexte: "Amendement de M. Amirshahi à l'article 2.",
      action: "Insérer l'alinéa suivant : « ... ».",
      resultatAttendu: "Cet amendement vise à garantir une prise en charge adaptée.",
    });
  });

  it("ne garde que le dernier paragraphe de l'exposé des motifs comme Résultat attendu, le reste rejoint le Contexte", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Insérer l'alinéa suivant : « ... ».",
      exposeSommaire:
        "Premier paragraphe de fond.\n\nDeuxième paragraphe de fond.\n\nCet amendement propose ainsi l'effet visé.",
    });
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

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
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

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
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

    expect(fiche.contexte.length).toBeLessThanOrEqual(801);
    expect(fiche.contexte.endsWith("…")).toBe(true);
    expect(fiche.resultatAttendu).toBe("Cet amendement propose l'effet visé.");
  });

  it("ne tronque pas un contenu déjà court", async () => {
    const repository = new FakeAmendementRepository({
      dispositif: "Dispositif court.",
      exposeSommaire: "Cet amendement propose l'effet visé.",
    });
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

    expect(fiche.action).toBe("Dispositif court.");
    expect(fiche.resultatAttendu).toBe("Cet amendement propose l'effet visé.");
  });

  it("retombe sur la Fiche dérivée du titre quand le repository ne trouve rien", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const fiche = await genererFicheScrutinEnrichie(creerScrutin({}), "Un dossier");

    expect(fiche.contexte).toBe("Amendement de M. Amirshahi à l'article 2.");
  });

  it("retombe aussi proprement sur un scrutin non-amendement quand le repository ne trouve rien", async () => {
    const repository = new FakeAmendementRepository(null);
    const genererFicheScrutinEnrichie =
      createGenererFicheScrutinEnrichie(repository);

    const scrutin = creerScrutin({
      titre: "l'ensemble de la proposition de loi (première lecture).",
    });

    const fiche = await genererFicheScrutinEnrichie(scrutin, "Un dossier");

    expect(fiche.contexte).toBe(
      "Vote sur l'ensemble du texte, à l'issue de sa première lecture."
    );
  });
});
