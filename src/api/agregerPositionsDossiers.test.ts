import { describe, expect, it } from "vitest";
import { createAgregerPositionsDossiers } from "@/api/agregerPositionsDossiers";
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
  dossierRef: string,
  positionsParGroupe: Scrutin["positionsParGroupe"]
): Scrutin {
  return {
    uid,
    titre: `Scrutin ${uid}`,
    dossierRef,
    decompte: { pour: 0, contre: 0, abstentions: 0 },
    positionsParGroupe,
  };
}

const UN_GROUPE: Groupe = {
  organeRef: "PO1",
  nom: "Groupe Un",
  abreviation: "G1",
  ordreHemicycle: 0,
};

describe("agregerPositionsDossiers", () => {
  it("agrège la Position d'un groupe sur tous les scrutins réels d'un seul dossier, pondérée par le taux de participation", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17TEST: [
        unScrutin("V1", "DLR5L17TEST", [
          {
            organeRef: "PO1",
            decompte: { pour: 9, contre: 1, abstentions: 0 },
            effectif: 10,
          },
        ]),
        unScrutin("V2", "DLR5L17TEST", [
          {
            organeRef: "PO1",
            decompte: { pour: 1, contre: 1, abstentions: 0 },
            effectif: 2,
          },
        ]),
      ],
    });
    const groupeRepository = new FakeGroupeRepository({ PO1: UN_GROUPE });
    const agregerPositionsDossiers = createAgregerPositionsDossiers(
      scrutinRepository,
      groupeRepository
    );

    const comparaison = await agregerPositionsDossiers(["DLR5L17TEST"]);

    expect(comparaison).toHaveLength(1);
    expect(comparaison[0].groupe).toEqual(UN_GROUPE);
    // même calcul que le test domaine agregerPositions : 70%/30% -> Pour
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.7);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.3);
    expect(comparaison[0].position).toBe("Pour");
  });

  it("agrège sur plusieurs dossiers à la fois (niveau branche/thème) exactement comme sur les scrutins d'un seul dossier", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17A: [
        unScrutin("V1", "DLR5L17A", [
          {
            organeRef: "PO1",
            decompte: { pour: 9, contre: 1, abstentions: 0 },
            effectif: 10,
          },
        ]),
      ],
      DLR5L17B: [
        unScrutin("V2", "DLR5L17B", [
          {
            organeRef: "PO1",
            decompte: { pour: 1, contre: 1, abstentions: 0 },
            effectif: 2,
          },
        ]),
      ],
    });
    const groupeRepository = new FakeGroupeRepository({ PO1: UN_GROUPE });
    const agregerPositionsDossiers = createAgregerPositionsDossiers(
      scrutinRepository,
      groupeRepository
    );

    const comparaison = await agregerPositionsDossiers([
      "DLR5L17A",
      "DLR5L17B",
    ]);

    // même résultat que l'agrégation d'un seul dossier à 2 scrutins : la
    // logique de pondération ne connaît pas la notion de "dossier".
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.7);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.3);
    expect(comparaison[0].position).toBe("Pour");
  });
});
