import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemAmendementRepository } from "@/spi/filesystem/amendementRepository";
import type { Scrutin } from "@/domain/scrutin";

const FIXTURE_ZIP_PATH = path.join(
  import.meta.dirname,
  "__fixtures__/amendements.json.zip"
);

function creerScrutin(overrides: Partial<Scrutin>): Scrutin {
  return {
    uid: "VTANR5L17V0",
    titre:
      "l'amendement n° 99 de M. Test à l'article premier de la proposition de loi (première lecture).",
    date: "2025-05-01",
    numero: 1,
    dossierRef: "DLR5L17FIX01",
    decompte: { pour: 1, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat: "adopté",
    ...overrides,
  };
}

describe("FilesystemAmendementRepository", () => {
  it("retrouve le dispositif et l'exposé des motifs, nettoyés du HTML", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(creerScrutin({}));

    expect(detail).toEqual({
      dispositif: "Première phrase : test.\n\nDeuxième phrase.",
      exposeSommaire: "Motif.",
    });
  });

  it("désambiguïse par date quand le même numéro existe à plusieurs lectures", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const scrutinLectureA = creerScrutin({
      titre:
        "l'amendement n° 42 de M. Test à l'article 2 de la proposition de loi (première lecture).",
      date: "2025-05-01",
    });
    const scrutinLectureB = creerScrutin({
      titre:
        "l'amendement n° 42 de M. Test à l'article 2 de la proposition de loi (nouvelle lecture).",
      date: "2025-06-02",
    });

    const detailA = await repository.getByScrutin(scrutinLectureA);
    const detailB = await repository.getByScrutin(scrutinLectureB);

    expect(detailA).toEqual({ dispositif: "Dispositif A.", exposeSommaire: "Exposé A." });
    expect(detailB).toEqual({ dispositif: "Dispositif B.", exposeSommaire: "Exposé B." });
  });

  it("écarte un candidat irrecevable (sans contenu réel) au profit d'un candidat avec du contenu", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({
        titre:
          "l'amendement n° 777 de M. Test à l'article premier de la proposition de loi (première lecture).",
        date: "2025-07-01",
      })
    );

    expect(detail).toEqual({
      dispositif: "Dispositif réel.",
      exposeSommaire: "Exposé réel.",
    });
  });

  it("décode des entités doublement échappées (&amp;nbsp; -> espace, pas &nbsp; littéral)", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({
        titre:
          "l'amendement n° 888 de M. Test à l'article premier de la proposition de loi (première lecture).",
      })
    );

    expect(detail?.dispositif).toBe("I. – Test.");
  });

  it("retourne null quand le dossier n'a pas de correspondance", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({ dossierRef: "DLR5L17INCONNU" })
    );

    expect(detail).toBeNull();
  });

  it("retourne null quand le numéro d'amendement n'a pas de correspondance", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({
        titre:
          "l'amendement n° 999999 de M. Personne à l'article premier de la proposition de loi.",
      })
    );

    expect(detail).toBeNull();
  });

  it("retourne null quand le scrutin n'a pas de dossier rattaché", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({ dossierRef: null })
    );

    expect(detail).toBeNull();
  });

  it("retourne null quand le titre n'est pas un vote d'amendement", async () => {
    const repository = new FilesystemAmendementRepository(FIXTURE_ZIP_PATH);

    const detail = await repository.getByScrutin(
      creerScrutin({
        titre: "l'ensemble de la proposition de loi (première lecture).",
      })
    );

    expect(detail).toBeNull();
  });
});
