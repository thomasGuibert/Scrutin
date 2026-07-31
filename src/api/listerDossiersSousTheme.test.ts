import { describe, expect, it, vi } from "vitest";
import { createListerDossiersSousTheme } from "@/api/listerDossiersSousTheme";
import type { Dossier, DossierRepository } from "@/domain/dossier";

class FakeDossierRepository implements DossierRepository {
  constructor(private readonly dossiers: Record<string, Dossier[]>) {}

  async getByRef(): Promise<Dossier | null> {
    throw new Error("not used in this test");
  }

  async getBySousTheme(slug: string): Promise<Dossier[]> {
    return this.dossiers[slug] ?? [];
  }
}

function unDossier(dossierRef: string, sousTheme: string): Dossier {
  return {
    dossierRef,
    titre: `Titre ${dossierRef}`,
    sousTheme,
    tagsImpact: [],
    ficheDossier: { contexte: "C", action: "A", resultatAttendu: "R" },
  };
}

describe("listerDossiersSousTheme", () => {
  it("associe à chaque dossier du sous-thème sa Position agrégée", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierB = unDossier("DLR5L17B", "cible");
    const dossierRepository = new FakeDossierRepository({
      cible: [dossierA, dossierB],
    });
    const agregerPositionsDossiers = vi
      .fn()
      .mockImplementation(async (dossierRefs: string[]) => [
        {
          groupe: { organeRef: "PO1", nom: "G1", abreviation: "G1" },
          decompte: { pour: 1, contre: 0, abstentions: 0 },
          position: "Pour",
          dossierRefs,
        },
      ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      agregerPositionsDossiers
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat).toHaveLength(2);
    expect(resultat[0].dossier).toEqual(dossierA);
    expect(resultat[0].comparaison[0].position).toBe("Pour");
    expect(agregerPositionsDossiers).toHaveBeenCalledWith(["DLR5L17A"]);
    expect(agregerPositionsDossiers).toHaveBeenCalledWith(["DLR5L17B"]);
  });

  it("retourne une liste vide quand aucun dossier n'est classé dans ce sous-thème", async () => {
    const dossierRepository = new FakeDossierRepository({});
    const agregerPositionsDossiers = vi.fn();
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      agregerPositionsDossiers
    );

    const resultat = await listerDossiersSousTheme("vide");

    expect(resultat).toEqual([]);
    expect(agregerPositionsDossiers).not.toHaveBeenCalled();
  });
});
