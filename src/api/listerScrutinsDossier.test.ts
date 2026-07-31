import { describe, expect, it } from "vitest";
import { createListerScrutinsDossier } from "@/api/listerScrutinsDossier";
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

function unScrutin(uid: string, date: string, numero: number): Scrutin {
  return {
    uid,
    titre: `Scrutin ${uid}`,
    date,
    numero,
    dossierRef: "DLR5L17TEST",
    decompte: { pour: 0, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat: "adopté",
  };
}

describe("listerScrutinsDossier", () => {
  it("retourne les scrutins que le repository associe au dossierRef", async () => {
    const unique = unScrutin("V1", "2024-01-01", 1);
    const repository = new FakeScrutinRepository({ DLR5L17TEST: [unique] });
    const listerScrutinsDossier = createListerScrutinsDossier(repository);

    const scrutins = await listerScrutinsDossier("DLR5L17TEST");

    expect(scrutins).toEqual([unique]);
  });

  it("trie les scrutins par date croissante, quel que soit l'ordre du repository", async () => {
    const plusRecent = unScrutin("V2", "2024-06-15", 2);
    const plusAncien = unScrutin("V1", "2024-01-01", 1);
    const repository = new FakeScrutinRepository({
      DLR5L17TEST: [plusRecent, plusAncien],
    });
    const listerScrutinsDossier = createListerScrutinsDossier(repository);

    const scrutins = await listerScrutinsDossier("DLR5L17TEST");

    expect(scrutins.map((s) => s.uid)).toEqual(["V1", "V2"]);
  });

  it("départage les scrutins du même jour par numéro croissant", async () => {
    const dernier = unScrutin("V7002", "2026-05-28", 7002);
    const premier = unScrutin("V6993", "2026-05-28", 6993);
    const repository = new FakeScrutinRepository({
      DLR5L17TEST: [dernier, premier],
    });
    const listerScrutinsDossier = createListerScrutinsDossier(repository);

    const scrutins = await listerScrutinsDossier("DLR5L17TEST");

    expect(scrutins.map((s) => s.uid)).toEqual(["V6993", "V7002"]);
  });
});
