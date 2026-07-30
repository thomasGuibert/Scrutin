import { describe, expect, it } from "vitest";
import { createComparerGroupes } from "@/api/comparerGroupes";
import type { Groupe, GroupeRepository } from "@/domain/groupes";
import type { Scrutin } from "@/domain/scrutin";

class FakeGroupeRepository implements GroupeRepository {
  constructor(private readonly groupes: Record<string, Groupe>) {}

  trouverGroupe(organeRef: string): Groupe | undefined {
    return this.groupes[organeRef];
  }
}

function unScrutin(positionsParGroupe: Scrutin["positionsParGroupe"]): Scrutin {
  return {
    uid: "VTANR5L17V1",
    titre: "Un titre de scrutin",
    dossierRef: null,
    decompte: { pour: 10, contre: 6, abstentions: 0 },
    positionsParGroupe,
  };
}

describe("comparerGroupes", () => {
  it("associe la Position calculée au groupe réel pour chaque entrée", () => {
    const repository = new FakeGroupeRepository({
      PO1: { organeRef: "PO1", nom: "Groupe Un", abreviation: "G1", ordreHemicycle: 0 },
      PO2: { organeRef: "PO2", nom: "Groupe Deux", abreviation: "G2", ordreHemicycle: 1 },
    });
    const comparerGroupes = createComparerGroupes(repository);
    const scrutin = unScrutin([
      {
        organeRef: "PO1",
        decompte: { pour: 5, contre: 0, abstentions: 0 },
        effectif: 10,
      },
      {
        organeRef: "PO2",
        decompte: { pour: 0, contre: 5, abstentions: 0 },
        effectif: 10,
      },
    ]);

    const comparaison = comparerGroupes(scrutin);

    expect(comparaison).toEqual([
      {
        groupe: { organeRef: "PO1", nom: "Groupe Un", abreviation: "G1", ordreHemicycle: 0 },
        decompte: { pour: 5, contre: 0, abstentions: 0 },
        position: "Pour",
      },
      {
        groupe: { organeRef: "PO2", nom: "Groupe Deux", abreviation: "G2", ordreHemicycle: 1 },
        decompte: { pour: 0, contre: 5, abstentions: 0 },
        position: "Contre",
      },
    ]);
  });

  it("échoue explicitement quand un organeRef est absent du référentiel des groupes", () => {
    const repository = new FakeGroupeRepository({});
    const comparerGroupes = createComparerGroupes(repository);
    const scrutin = unScrutin([
      {
        organeRef: "POINCONNU",
        decompte: { pour: 1, contre: 0, abstentions: 0 },
        effectif: 10,
      },
    ]);

    expect(() => comparerGroupes(scrutin)).toThrow(/POINCONNU/);
  });
});
