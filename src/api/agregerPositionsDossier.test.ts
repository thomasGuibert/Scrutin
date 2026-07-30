import { describe, expect, it } from "vitest";
import { createAgregerPositionsDossier } from "@/api/agregerPositionsDossier";
import type { Groupe, GroupeRepository } from "@/domain/groupes";
import type { Scrutin, ScrutinRepository } from "@/domain/scrutin";

class FakeScrutinRepository implements ScrutinRepository {
  constructor(private readonly scrutinsParDossier: Record<string, Scrutin[]>) {}

  async getByUid(): Promise<Scrutin | null> {
    throw new Error("not used in this test");
  }

  async getByDossierRef(dossierRef: string): Promise<Scrutin[]> {
    return this.scrutinsParDossier[dossierRef] ?? [];
  }
}

class FakeGroupeRepository implements GroupeRepository {
  constructor(private readonly groupes: Record<string, Groupe>) {}

  trouverGroupe(organeRef: string): Groupe | undefined {
    return this.groupes[organeRef];
  }
}

function unScrutin(
  uid: string,
  positionsParGroupe: Scrutin["positionsParGroupe"]
): Scrutin {
  return {
    uid,
    titre: `Scrutin ${uid}`,
    dossierRef: "DLR5L17TEST",
    decompte: { pour: 0, contre: 0, abstentions: 0 },
    positionsParGroupe,
  };
}

describe("agregerPositionsDossier", () => {
  it("agrège la Position d'un groupe sur tous les scrutins réels du dossier, pondérée par le taux de participation", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17TEST: [
        unScrutin("V1", [
          {
            organeRef: "PO1",
            decompte: { pour: 9, contre: 1, abstentions: 0 },
            effectif: 10,
          },
        ]),
        unScrutin("V2", [
          {
            organeRef: "PO1",
            decompte: { pour: 1, contre: 1, abstentions: 0 },
            effectif: 2,
          },
        ]),
      ],
    });
    const groupeRepository = new FakeGroupeRepository({
      PO1: { organeRef: "PO1", nom: "Groupe Un", abreviation: "G1" },
    });
    const agregerPositionsDossier = createAgregerPositionsDossier(
      scrutinRepository,
      groupeRepository
    );

    const comparaison = await agregerPositionsDossier("DLR5L17TEST");

    expect(comparaison).toHaveLength(1);
    expect(comparaison[0].groupe).toEqual({
      organeRef: "PO1",
      nom: "Groupe Un",
      abreviation: "G1",
    });
    // même calcul que le test domaine agregerPositions : 70%/30% -> Pour
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.7);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.3);
    expect(comparaison[0].position).toBe("Pour");
  });
});
