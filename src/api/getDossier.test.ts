import { describe, expect, it } from "vitest";
import { createGetDossier } from "@/api/getDossier";
import type { Dossier, DossierRepository } from "@/domain/dossier";

class FakeDossierRepository implements DossierRepository {
  constructor(private readonly dossiers: Record<string, Dossier>) {}

  async getByRef(dossierRef: string): Promise<Dossier | null> {
    return this.dossiers[dossierRef] ?? null;
  }

  async getBySousTheme(slug: string): Promise<Dossier[]> {
    return Object.values(this.dossiers).filter(
      (dossier) => dossier.sousTheme === slug
    );
  }
}

const A_DOSSIER: Dossier = {
  dossierRef: "DLR5L17TEST",
  titre: "Un dossier de test",
  sousTheme: "sous-theme-test",
  tagsImpact: [],
  ficheDossier: {
    contexte: "Contexte",
    action: "Action",
    resultatAttendu: "Résultat",
  },
};

describe("getDossier", () => {
  it("returns the dossier the repository holds for that dossierRef", async () => {
    const repository = new FakeDossierRepository({
      DLR5L17TEST: A_DOSSIER,
    });
    const getDossier = createGetDossier(repository);

    const dossier = await getDossier("DLR5L17TEST");

    expect(dossier).toEqual(A_DOSSIER);
  });

  it("returns null when the repository has no such dossier", async () => {
    const repository = new FakeDossierRepository({});
    const getDossier = createGetDossier(repository);

    const dossier = await getDossier("DLR5L17DOESNOTEXIST");

    expect(dossier).toBeNull();
  });
});
