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
  titre: string,
  numero: number,
  positionsParGroupe: Scrutin["positionsParGroupe"]
): Scrutin {
  return {
    uid,
    titre,
    date: "2024-10-08",
    numero,
    dossierRef,
    decompte: { pour: 0, contre: 0, abstentions: 0 },
    positionsParGroupe,
    resultat: "adopté",
  };
}

const UN_GROUPE: Groupe = {
  organeRef: "PO1",
  nom: "Groupe Un",
  abreviation: "G1",
  ordreHemicycle: 0,
};

describe("agregerPositionsDossiers", () => {
  it("n'agrège que le scrutin décisif du dossier (le vote sur l'ensemble), pas ses votes d'amendement/d'article", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17TEST: [
        unScrutin(
          "V1",
          "DLR5L17TEST",
          "l'amendement n° 1 à l'article premier de la proposition de loi.",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 1, contre: 9, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
        unScrutin(
          "V2",
          "DLR5L17TEST",
          "l'ensemble de la proposition de loi (première lecture).",
          2,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 9, contre: 1, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
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
    // Si l'amendement (1 pour, 9 contre) était agrégé avec le vote sur
    // l'ensemble (9 pour, 1 contre), le résultat serait 50/50 (Divisé) : la
    // valeur 90/10 prouve que seul le scrutin décisif compte.
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.9);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.1);
    expect(comparaison[0].position).toBe("Pour");
  });

  it("agrège sur plusieurs dossiers à la fois (niveau branche/thème), un scrutin décisif par dossier", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17A: [
        unScrutin(
          "V1",
          "DLR5L17A",
          "l'ensemble du projet de loi (première lecture).",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 9, contre: 1, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
      ],
      DLR5L17B: [
        unScrutin(
          "V2",
          "DLR5L17B",
          "l'ensemble de la proposition de loi (première lecture).",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 1, contre: 1, abstentions: 0 },
              effectif: 2,
            },
          ]
        ),
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

    // même calcul que le test domaine agregerPositions : 70%/30% -> Pour
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.7);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.3);
    expect(comparaison[0].position).toBe("Pour");
  });

  it("ignore un dossier sans scrutin décisif (encore en cours d'examen, seulement des amendements/articles)", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17A: [
        unScrutin(
          "V1",
          "DLR5L17A",
          "l'ensemble du projet de loi (première lecture).",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 9, contre: 1, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
      ],
      DLR5L17ENCOURS: [
        unScrutin(
          "V2",
          "DLR5L17ENCOURS",
          "l'amendement n° 1 à l'article premier.",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 0, contre: 5, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
      ],
    });
    const groupeRepository = new FakeGroupeRepository({ PO1: UN_GROUPE });
    const agregerPositionsDossiers = createAgregerPositionsDossiers(
      scrutinRepository,
      groupeRepository
    );

    const comparaison = await agregerPositionsDossiers([
      "DLR5L17A",
      "DLR5L17ENCOURS",
    ]);

    // seul DLR5L17A contribue : DLR5L17ENCOURS n'a pas encore de vote sur
    // l'ensemble, donc rien à retenir de ses votes d'amendement.
    expect(comparaison[0].decompte.pour).toBeCloseTo(0.9);
    expect(comparaison[0].decompte.contre).toBeCloseTo(0.1);
  });

  it("ne retourne aucune entrée quand aucun dossier n'a de scrutin décisif", async () => {
    const scrutinRepository = new FakeScrutinRepository({
      DLR5L17ENCOURS: [
        unScrutin(
          "V1",
          "DLR5L17ENCOURS",
          "l'amendement n° 1 à l'article premier.",
          1,
          [
            {
              organeRef: "PO1",
              decompte: { pour: 0, contre: 5, abstentions: 0 },
              effectif: 10,
            },
          ]
        ),
      ],
    });
    const groupeRepository = new FakeGroupeRepository({ PO1: UN_GROUPE });
    const agregerPositionsDossiers = createAgregerPositionsDossiers(
      scrutinRepository,
      groupeRepository
    );

    const comparaison = await agregerPositionsDossiers(["DLR5L17ENCOURS"]);

    expect(comparaison).toEqual([]);
  });
});
