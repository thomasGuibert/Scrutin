import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import type { SousTheme, TaxonomyRepository } from "@/domain/taxonomie";

const FIXTURE_CONTENT_DIR = path.join(
  import.meta.dirname,
  "__fixtures__/content-dossiers"
);

const FIXTURE_CONTENT_DIR_SOUS_THEME = path.join(
  import.meta.dirname,
  "__fixtures__/content-dossiers-sous-theme"
);

class FakeTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly sousThemes: Record<string, SousTheme>) {}

  trouverSousTheme(slug: string): SousTheme | undefined {
    return this.sousThemes[slug];
  }
}

const TAXONOMIE_DE_TEST = new FakeTaxonomyRepository({
  "sous-theme-test": {
    slug: "sous-theme-test",
    nom: "Sous-thème de test",
    type: "consensuel",
    branche: null,
  },
  "sous-theme-cible": {
    slug: "sous-theme-cible",
    nom: "Sous-thème cible",
    type: "consensuel",
    branche: null,
  },
  "autre-sous-theme": {
    slug: "autre-sous-theme",
    nom: "Autre sous-thème",
    type: "consensuel",
    branche: null,
  },
});

describe("FilesystemDossierRepository", () => {
  it("returns the dossier parsed from its Markdown+frontmatter file", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    const dossier = await repository.getByRef("DLR5L17TEST");

    expect(dossier).toEqual({
      dossierRef: "DLR5L17TEST",
      titre: "Un dossier de test",
      sousTheme: "sous-theme-test",
      tagsImpact: ["Tag test"],
      ficheDossier: {
        contexte: "Contexte de test.",
        action: "Action de test.",
        resultatAttendu: "Résultat attendu de test.",
      },
    });
  });

  it("returns null for an unknown dossierRef", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    const dossier = await repository.getByRef("DLR5L17DOESNOTEXIST");

    expect(dossier).toBeNull();
  });

  it("throws when the Fiche dossier is missing a required section", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    await expect(repository.getByRef("DLR5L17INCOMPLETE")).rejects.toThrow(
      /Résultat attendu/
    );
  });

  it("échoue explicitement quand le sous-thème référencé est absent de la taxonomie déclarée", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR,
      taxonomyRepository: new FakeTaxonomyRepository({}),
    });

    await expect(repository.getByRef("DLR5L17TEST")).rejects.toThrow(
      /sous-theme-test/
    );
  });

  it("liste les dossiers réellement classés dans un sous-thème donné, sans les autres", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR_SOUS_THEME,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    const dossiers = await repository.getBySousTheme("sous-theme-cible");

    expect(dossiers.map((d) => d.dossierRef).sort()).toEqual([
      "DLR5L17A",
      "DLR5L17B",
    ]);
  });
});
