import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Scrutin } from "@/domain/scrutin";
import { FilesystemDiscoursAmendementRepository } from "@/spi/filesystem/discoursAmendementRepository";

const FIXTURE_DIR = path.join(
  import.meta.dirname,
  "__fixtures__/discours-amendements"
);

function creerRepository(): FilesystemDiscoursAmendementRepository {
  return new FilesystemDiscoursAmendementRepository(FIXTURE_DIR);
}

function creerScrutin(overrides: Partial<Scrutin>): Scrutin {
  return {
    uid: "VTANR5L17V0",
    titre:
      "l'amendement n° 10 de M. Fait à l'article premier de la proposition de loi (première lecture).",
    date: "2025-06-01",
    numero: 1,
    dossierRef: "DLR5L17FIX01",
    decompte: { pour: 1, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat: "adopté",
    ...overrides,
  };
}

describe("FilesystemDiscoursAmendementRepository", () => {
  it("retrouve le discours de l'auteur·ice défendant CET amendement, en normalisant « l'article premier » du titre en « 1er »", async () => {
    const repository = creerRepository();

    const discours = await repository.getByScrutin(creerScrutin({}));

    expect(discours).toBe(
      "Il vise à répondre à une situation rencontrée sur le terrain, où plusieurs familles se sont retrouvées sans solution."
    );
  });

  it("écarte un segment qui partage le même numéro+article mais appartient à un autre dossier (numéro de document officiel différent)", async () => {
    const repository = creerRepository();

    const discours = await repository.getByScrutin(creerScrutin({}));

    expect(discours).not.toContain("tout autre texte");
  });

  it("retourne null quand le seul candidat trouvé appartient à un dossier différent (aucun document officiel commun)", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({ dossierRef: "DLR5L17FIXINCONNU" });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBeNull();
  });

  it("désambiguïse par la date exacte du scrutin quand 2 candidats partagent le même document (2 lectures)", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({
      titre: "l'amendement n° 20 de Mme Nouvelle à l'article 2 de la proposition de loi (nouvelle lecture).",
      date: "2025-07-01",
    });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBe(
      "Discours de la nouvelle lecture, retenu car la date correspond exactement à celle du scrutin."
    );
  });

  it("retourne null quand aucune des dates candidates ne correspond exactement à celle du scrutin", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({
      titre: "l'amendement n° 20 de Mme Nouvelle à l'article 2 de la proposition de loi (nouvelle lecture).",
      date: "2025-09-01",
    });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBeNull();
  });

  it("retourne null pour une défense trop courte pour apporter un contexte utile (« Il est défendu. »)", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({
      titre: "l'amendement n° 30 de M. Court à l'article 3 de la proposition de loi (première lecture).",
    });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBeNull();
  });

  it("retrouve un amendement déposé après un article (préfixe « après_ » du compte rendu)", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({
      titre: "l'amendement n° 40 de Mme Fuentes après l'article 6 de la proposition de loi (première lecture).",
    });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBe(
      "Il vise à prévoir un dispositif complémentaire pour les cas particuliers identifiés lors des débats en commission."
    );
  });

  it("retourne null quand aucun segment ne correspond au numéro+article demandé", async () => {
    const repository = creerRepository();

    const scrutin = creerScrutin({
      titre: "l'amendement n° 999 de M. Inconnu à l'article 5 de la proposition de loi (première lecture).",
    });

    const discours = await repository.getByScrutin(scrutin);

    expect(discours).toBeNull();
  });

  it("retourne null immédiatement quand le scrutin n'a pas de dossierRef résolu", async () => {
    const repository = creerRepository();

    const discours = await repository.getByScrutin(
      creerScrutin({ dossierRef: null })
    );

    expect(discours).toBeNull();
  });

  it("retourne null pour un scrutin qui n'est pas un vote sur amendement", async () => {
    const repository = creerRepository();

    const discours = await repository.getByScrutin(
      creerScrutin({ titre: "l'ensemble de la proposition de loi (première lecture)." })
    );

    expect(discours).toBeNull();
  });
});
