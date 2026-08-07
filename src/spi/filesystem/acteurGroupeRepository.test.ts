import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemActeurGroupeRepository } from "@/spi/filesystem/acteurGroupeRepository";

const FIXTURE_PATH = path.join(
  import.meta.dirname,
  "__fixtures__/deputes/AMO10Fixture.zip"
);

function creerRepository(): FilesystemActeurGroupeRepository {
  return new FilesystemActeurGroupeRepository(FIXTURE_PATH);
}

describe("FilesystemActeurGroupeRepository", () => {
  it("retrouve le groupe actif d'un acteur à une date donnée (mandats multiples, format tableau)", async () => {
    const repository = creerRepository();

    expect(repository.groupeAuMoment("900", "2024-08-01")).toBe("DR");
  });

  it("suit le changement de groupe en cours de législature (ex. bascule vers un nouveau groupe)", async () => {
    const repository = creerRepository();

    expect(repository.groupeAuMoment("900", "2025-01-15")).toBe("RN");
  });

  it("retrouve le groupe d'un acteur n'ayant qu'un seul mandat GP (format objet, pas tableau)", async () => {
    const repository = creerRepository();

    expect(repository.groupeAuMoment("901", "2025-01-15")).toBe("SOC");
  });

  it("retourne null pour un acteur inconnu du référentiel", async () => {
    const repository = creerRepository();

    expect(repository.groupeAuMoment("999999", "2025-01-15")).toBeNull();
  });

  it("retourne null pour une date antérieure à tout mandat GP connu", async () => {
    const repository = creerRepository();

    expect(repository.groupeAuMoment("900", "2020-01-01")).toBeNull();
  });

  it("ignore les mandats qui ne sont pas de type Groupe Parlementaire (ex. délégation)", async () => {
    const repository = creerRepository();

    // Le mandat DELEG de l'acteur 900 (organeRef PO999999, hors référentiel
    // des groupes) ne doit jamais être retourné comme un groupe.
    const groupe = repository.groupeAuMoment("900", "2024-08-01");
    expect(groupe).not.toBeNull();
    expect(groupe).not.toBe(undefined);
  });
});
