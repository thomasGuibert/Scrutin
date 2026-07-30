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

    expect(scrutin).toMatchObject({
      uid: "VTANR5L17V1",
      titre:
        "la motion de censure déposée en application de l'article 49, alinéa 2, de la Constitution par M. Boris Vallaud, Mme Mathilde Panot, Mme Cyrielle Chatelain, M. André Chassaigne et 188 de leurs collègues.",
      decompte: { pour: 197, contre: 0, abstentions: 0 },
    });
  });

  it("extrait la position réelle d'un groupe sur un scrutin (cas Divisé réel : DR sur l'amendement Code noir)", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17V6993");

    expect(scrutin?.positionsParGroupe).toContainEqual({
      organeRef: "PO845425",
      decompte: { pour: 1, contre: 1, abstentions: 0 },
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

  it("normalise un seul groupe ventilé (non tableau) en liste d'un élément", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17VSINGLEGROUP");

    expect(scrutin?.positionsParGroupe).toEqual([
      { organeRef: "PO845401", decompte: { pour: 1, contre: 0, abstentions: 0 } },
    ]);
  });
});
