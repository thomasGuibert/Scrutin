import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";

const FIXTURE_CONTENT_DIR = path.join(
  import.meta.dirname,
  "__fixtures__/content-dossiers"
);

describe("FilesystemDossierRepository", () => {
  it("returns the dossier parsed from its Markdown+frontmatter file", async () => {
    const repository = new FilesystemDossierRepository(FIXTURE_CONTENT_DIR);

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
    const repository = new FilesystemDossierRepository(FIXTURE_CONTENT_DIR);

    const dossier = await repository.getByRef("DLR5L17DOESNOTEXIST");

    expect(dossier).toBeNull();
  });

  it("throws when the Fiche dossier is missing a required section", async () => {
    const repository = new FilesystemDossierRepository(FIXTURE_CONTENT_DIR);

    await expect(repository.getByRef("DLR5L17INCOMPLETE")).rejects.toThrow(
      /Résultat attendu/
    );
  });
});
