import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const FIXTURE_ZIP_PATH = path.join(
  import.meta.dirname,
  "__fixtures__/scrutins.json.zip"
);

describe("FilesystemScrutinRepository", () => {
  it("returns the real scrutin for a known uid", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17V1");

    expect(scrutin).toEqual({
      uid: "VTANR5L17V1",
      titre:
        "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par M. Boris Vallaud, Mme Mathilde Panot, Mme Cyrielle Chatelain, M. André Chassaigne et 188 de leurs collègues.",
      decompte: { pour: 197, contre: 0, abstentions: 0 },
    });
  });

  it("returns null for an unknown uid", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17V999999");

    expect(scrutin).toBeNull();
  });

  it("throws when a décompte value isn't numeric", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    await expect(repository.getByUid("VTANR5L17VBROKEN")).rejects.toThrow(
      /pour/
    );
  });
});
