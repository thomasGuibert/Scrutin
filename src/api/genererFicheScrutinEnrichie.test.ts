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
