import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemExplicationsVoteRepository } from "@/spi/filesystem/explicationsVoteRepository";

const FIXTURE_ZIP_PATH = path.join(
  import.meta.dirname,
  "__fixtures__/explications-vote/explicationsVoteFixture.zip"
);

describe("FilesystemExplicationsVoteRepository", () => {
  it("retrouve les Explications de vote d'un scrutin précis d'un dossier", async () => {
    const repository = new FilesystemExplicationsVoteRepository(FIXTURE_ZIP_PATH);

    const explications = await repository.getByScrutin(
      "DLR5L17FIX01",
      "VTANR5L17V001"
    );

    expect(explications).toEqual([
      { groupe: "RN", orateur: "M. Jean Dupont", texte: "Contre, texte A." },
      { groupe: "SOC", orateur: "Mme Alice Martin", texte: "Pour, texte A." },
    ]);
  });

  it("distingue 2 lectures d'un même dossier par l'uid du scrutin", async () => {
    const repository = new FilesystemExplicationsVoteRepository(FIXTURE_ZIP_PATH);

    const explications = await repository.getByScrutin(
      "DLR5L17FIX01",
      "VTANR5L17V002"
    );

    expect(explications).toEqual([
      { groupe: "EPR", orateur: "Mme Sophie Petit", texte: "Pour, texte B (CMP)." },
    ]);
  });

  it("retourne null quand le dossier n'est pas dans l'archive précalculée", async () => {
    const repository = new FilesystemExplicationsVoteRepository(FIXTURE_ZIP_PATH);

    const explications = await repository.getByScrutin(
      "DLR5L17INCONNU",
      "VTANR5L17V001"
    );

    expect(explications).toBeNull();
  });

  it("retourne null quand le dossier est connu mais pas ce scrutin précis", async () => {
    const repository = new FilesystemExplicationsVoteRepository(FIXTURE_ZIP_PATH);

    const explications = await repository.getByScrutin(
      "DLR5L17FIX01",
      "VTANR5L17V999"
    );

    expect(explications).toBeNull();
  });
});
