import { describe, expect, it, vi } from "vitest";
import { createListerSousThemesAvecPosition } from "@/api/listerSousThemesAvecPosition";
import type { Dossier, DossierRepository } from "@/domain/dossier";
import type { SousTheme } from "@/domain/taxonomie";

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

function unSousTheme(slug: string): SousTheme {
  return { slug, nom: `Nom ${slug}`, type: "consensuel" };
}

const AUCUN_SCRUTIN = vi.fn().mockResolvedValue([]);

describe("listerSousThemesAvecPosition", () => {
  it("compte les dossiers et agrège la Position séparément pour chaque sous-thème", async () => {
    const dossierRepository = new FakeDossierRepository({
      "sous-theme-a": [
        unDossier("DLR5L17A", "sous-theme-a"),
        unDossier("DLR5L17B", "sous-theme-a"),
      ],
      "sous-theme-b": [unDossier("DLR5L17C", "sous-theme-b")],
    });
    const agregerPositionsDossiers = vi.fn().mockResolvedValue([]);
    const listerSousThemesAvecPosition = createListerSousThemesAvecPosition(
      dossierRepository,
      agregerPositionsDossiers,
      AUCUN_SCRUTIN
    );

    const resultat = await listerSousThemesAvecPosition([
      unSousTheme("sous-theme-a"),
      unSousTheme("sous-theme-b"),
    ]);

    expect(resultat.map((r) => r.nombreDossiers)).toEqual([2, 1]);
    expect(agregerPositionsDossiers).toHaveBeenCalledWith([
      "DLR5L17A",
      "DLR5L17B",
    ]);
    expect(agregerPositionsDossiers).toHaveBeenCalledWith(["DLR5L17C"]);
  });

  it("retourne un nombre de dossiers à zéro pour un sous-thème sans dossier", async () => {
    const dossierRepository = new FakeDossierRepository({});
    const agregerPositionsDossiers = vi.fn().mockResolvedValue([]);
    const listerSousThemesAvecPosition = createListerSousThemesAvecPosition(
      dossierRepository,
      agregerPositionsDossiers,
      AUCUN_SCRUTIN
    );

    const resultat = await listerSousThemesAvecPosition([
      unSousTheme("vide"),
    ]);

    expect(resultat).toEqual([
      {
        sousTheme: unSousTheme("vide"),
        nombreDossiers: 0,
        comparaison: [],
        datesScrutins: [],
      },
    ]);
  });

  it("agrège les dates de scrutin de tous les dossiers du sous-thème", async () => {
    const dossierRepository = new FakeDossierRepository({
      "sous-theme-a": [
        unDossier("DLR5L17A", "sous-theme-a"),
        unDossier("DLR5L17B", "sous-theme-a"),
      ],
    });
    const agregerPositionsDossiers = vi.fn().mockResolvedValue([]);
    const listerScrutinsDossier = vi
      .fn()
      .mockImplementation(async (dossierRef: string) =>
        dossierRef === "DLR5L17A"
          ? [{ uid: "V1", date: "2025-01-15" }]
          : [{ uid: "V2", date: "2026-07-02" }]
      );
    const listerSousThemesAvecPosition = createListerSousThemesAvecPosition(
      dossierRepository,
      agregerPositionsDossiers,
      listerScrutinsDossier
    );

    const resultat = await listerSousThemesAvecPosition([
      unSousTheme("sous-theme-a"),
    ]);

    expect(resultat[0].datesScrutins).toEqual(["2025-01-15", "2026-07-02"]);
  });
});
