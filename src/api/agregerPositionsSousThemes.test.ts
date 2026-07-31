import { describe, expect, it, vi } from "vitest";
import { createAgregerPositionsSousThemes } from "@/api/agregerPositionsSousThemes";
import type { Dossier, DossierRepository } from "@/domain/dossier";

class FakeDossierRepository implements DossierRepository {
  constructor(private readonly dossiers: Record<string, Dossier[]>) {}

  async getByRef(): Promise<Dossier | null> {
    throw new Error("not used in this test");
  }

  async getBySousTheme(slug: string): Promise<Dossier[]> {
    return this.dossiers[slug] ?? [];
  }

  async getByTagImpact(): Promise<Dossier[]> {
    throw new Error("not used in this test");
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

describe("agregerPositionsSousThemes", () => {
  it("agrège sur l'union des dossiers de plusieurs sous-thèmes", async () => {
    const dossierRepository = new FakeDossierRepository({
      "sous-theme-a": [unDossier("DLR5L17A", "sous-theme-a")],
      "sous-theme-b": [unDossier("DLR5L17B", "sous-theme-b")],
    });
    const agregerPositionsDossiers = vi.fn().mockResolvedValue([]);
    const agregerPositionsSousThemes = createAgregerPositionsSousThemes(
      dossierRepository,
      agregerPositionsDossiers
    );

    await agregerPositionsSousThemes(["sous-theme-a", "sous-theme-b"]);

    expect(agregerPositionsDossiers).toHaveBeenCalledWith([
      "DLR5L17A",
      "DLR5L17B",
    ]);
  });

  it("n'appelle pas l'agrégation quand aucun sous-thème n'a de dossier", async () => {
    const dossierRepository = new FakeDossierRepository({});
    const agregerPositionsDossiers = vi.fn().mockResolvedValue([]);
    const agregerPositionsSousThemes = createAgregerPositionsSousThemes(
      dossierRepository,
      agregerPositionsDossiers
    );

    await agregerPositionsSousThemes(["vide"]);

    expect(agregerPositionsDossiers).toHaveBeenCalledWith([]);
  });
});
