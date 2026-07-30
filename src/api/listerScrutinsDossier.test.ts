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

describe("listerScrutinsDossier", () => {
  it("retourne les scrutins que le repository associe au dossierRef", async () => {
    const unScrutin: Scrutin = {
      uid: "V1",
      titre: "Un scrutin",
      dossierRef: "DLR5L17TEST",
      decompte: { pour: 0, contre: 0, abstentions: 0 },
      positionsParGroupe: [],
    };
    const repository = new FakeScrutinRepository({ DLR5L17TEST: [unScrutin] });
    const listerScrutinsDossier = createListerScrutinsDossier(repository);

    const scrutins = await listerScrutinsDossier("DLR5L17TEST");

    expect(scrutins).toEqual([unScrutin]);
  });
});
