import { describe, expect, it } from "vitest";
import { createListerThemesTries } from "@/api/listerThemesTries";
import type {
  Branche,
  ContexteSousTheme,
  SousTheme,
  TaxonomyRepository,
  ThemeRacine,
} from "@/domain/taxonomie";
import type { Dossier, DossierRepository } from "@/domain/dossier";

class FakeTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly themes: ThemeRacine[]) {}

  trouverSousTheme(): SousTheme | undefined {
    throw new Error("not used in this test");
  }

  trouverTheme(): ThemeRacine | undefined {
    throw new Error("not used in this test");
  }

  trouverBranche(): { theme: ThemeRacine; branche: Branche } | undefined {
    throw new Error("not used in this test");
  }

  trouverContexteSousTheme(): ContexteSousTheme | undefined {
    throw new Error("not used in this test");
  }

  listerThemes(): ThemeRacine[] {
    return this.themes;
  }
}

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

function unSousTheme(slug: string): SousTheme {
  return { slug, nom: `Sous-thème ${slug}`, type: "consensuel" };
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

describe("listerThemesTries", () => {
  it("trie les thèmes par nombre de dossiers réel, du plus grand au plus petit — pas dans l'ordre de déclaration", async () => {
    const themePetit: ThemeRacine = {
      slug: "petit",
      nom: "Petit thème",
      description: "D",
      branches: [],
      sousThemes: [unSousTheme("st-petit")],
    };
    const themeGrand: ThemeRacine = {
      slug: "grand",
      nom: "Grand thème",
      description: "D",
      branches: [
        { slug: "branche", nom: "Branche", sousThemes: [unSousTheme("st-branche")] },
      ],
      sousThemes: [unSousTheme("st-direct")],
    };
    const taxonomyRepository = new FakeTaxonomyRepository([
      themePetit,
      themeGrand,
    ]);
    const dossierRepository = new FakeDossierRepository({
      "st-petit": [unDossier("D1", "st-petit")],
      "st-direct": [unDossier("D2", "st-direct")],
      "st-branche": [unDossier("D3", "st-branche"), unDossier("D4", "st-branche")],
    });
    const listerThemesTries = createListerThemesTries(
      taxonomyRepository,
      dossierRepository
    );

    const resultat = await listerThemesTries();

    expect(resultat).toEqual([
      { theme: themeGrand, nombreDossiers: 3 },
      { theme: themePetit, nombreDossiers: 1 },
    ]);
  });
});
