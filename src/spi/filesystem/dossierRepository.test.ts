import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import type {
  Branche,
  SousTheme,
  TaxonomyRepository,
  ThemeRacine,
} from "@/domain/taxonomie";

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

  trouverTheme(): ThemeRacine | undefined {
    throw new Error("not used in this test");
  }

  trouverBranche(): { theme: ThemeRacine; branche: Branche } | undefined {
    throw new Error("not used in this test");
  }

  listerThemes(): ThemeRacine[] {
    throw new Error("not used in this test");
  }
}

const TAXONOMIE_DE_TEST = new FakeTaxonomyRepository({
  "sous-theme-test": {
    slug: "sous-theme-test",
    nom: "Sous-thème de test",
    type: "consensuel",
  },
  "sous-theme-cible": {
    slug: "sous-theme-cible",
    nom: "Sous-thème cible",
    type: "consensuel",
  },
  "autre-sous-theme": {
    slug: "autre-sous-theme",
    nom: "Autre sous-thème",
    type: "consensuel",
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

  it("rejette un dossierRef contenant un séparateur de chemin plutôt que de lire hors de content/dossiers (path traversal)", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    // Ce fichier existe bel et bien, juste dans un répertoire voisin — sans
    // le garde-fou de validation, ce dossierRef le lirait avec succès.
    const dossier = await repository.getByRef(
      "../content-dossiers-sous-theme/DLR5L17A"
    );

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

  it("liste les dossiers portant un Tag d'impact donné, quel que soit leur sous-thème d'appartenance", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR_SOUS_THEME,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    const dossiers = await repository.getByTagImpact("Tag partagé");

    // DLR5L17A (sous-theme-cible) et DLR5L17C (autre-sous-theme) partagent
    // le tag mais ont chacun un sous-thème d'appartenance différent.
    expect(dossiers.map((d) => d.dossierRef).sort()).toEqual([
      "DLR5L17A",
      "DLR5L17C",
    ]);
  });

  it("retourne une liste vide pour un tag que personne ne porte", async () => {
    const repository = new FilesystemDossierRepository({
      contentDir: FIXTURE_CONTENT_DIR_SOUS_THEME,
      taxonomyRepository: TAXONOMIE_DE_TEST,
    });

    const dossiers = await repository.getByTagImpact("Tag inexistant");

    expect(dossiers).toEqual([]);
  });
});
