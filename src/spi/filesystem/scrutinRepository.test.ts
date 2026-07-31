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
      date: "2024-10-08",
      numero: 1,
      decompte: { pour: 197, contre: 0, abstentions: 0 },
      resultat: "rejeté",
    });
  });

  it("extrait la position réelle d'un groupe sur un scrutin (cas Divisé réel : DR sur l'amendement Code noir)", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17V6993");

    expect(scrutin?.positionsParGroupe).toContainEqual({
      organeRef: "PO845425",
      decompte: { pour: 1, contre: 1, abstentions: 0 },
      effectif: 48,
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

  it("throws when le sort n'est ni adopté ni rejeté", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    await expect(repository.getByUid("VTANR5L17VBADSORT")).rejects.toThrow(
      /irrecevable/
    );
  });

  it("normalise un seul groupe ventilé (non tableau) en liste d'un élément", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17VSINGLEGROUP");

    expect(scrutin?.positionsParGroupe).toEqual([
      {
        organeRef: "PO845401",
        decompte: { pour: 1, contre: 0, abstentions: 0 },
        effectif: 125,
      },
    ]);
  });

  it("normalise l'organeRef \"PO0\" (anomalie d'export AN) vers le RN", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17VPO0");

    expect(scrutin?.positionsParGroupe).toContainEqual({
      organeRef: "PO845401",
      decompte: { pour: 0, contre: 17, abstentions: 0 },
      effectif: 122,
    });
  });

  it("normalise l'ancien organeRef \"PO847173\" (UDR avant réimmatriculation) vers PO872880", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutin = await repository.getByUid("VTANR5L17VPO847173");

    expect(scrutin?.positionsParGroupe).toContainEqual({
      organeRef: "PO872880",
      decompte: { pour: 10, contre: 2, abstentions: 0 },
      effectif: 16,
    });
  });

  it("retourne tous les scrutins réels rattachés à un dossierRef donné", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutins = await repository.getByDossierRef("DLR5L17N52767");

    expect(scrutins.map((s) => s.uid).sort()).toEqual([
      "VTANR5L17V6993",
      "VTANR5L17V6994",
    ]);
  });

  it("rattache un scrutin dont le dossierRef AN est absent, via la curation manuelle connue (VTANR5L17V1304 -> DLR5L17N50579)", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const parDossierRef = await repository.getByUid("VTANR5L17V1304");
    expect(parDossierRef?.dossierRef).toBe("DLR5L17N50579");

    const scrutins = await repository.getByDossierRef("DLR5L17N50579");
    expect(scrutins.map((s) => s.uid)).toEqual(["VTANR5L17V1304"]);
  });

  it("ne retourne aucun scrutin pour un dossierRef inconnu", async () => {
    const repository = new FilesystemScrutinRepository(FIXTURE_ZIP_PATH);

    const scrutins = await repository.getByDossierRef("DLR5L17INCONNU");

    expect(scrutins).toEqual([]);
  });
});
