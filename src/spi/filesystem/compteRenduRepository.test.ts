import path from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemCompteRenduRepository } from "@/spi/filesystem/compteRenduRepository";

const FIXTURE_DIR = path.join(import.meta.dirname, "__fixtures__/comptes-rendus");

function creerRepository(): FilesystemCompteRenduRepository {
  return new FilesystemCompteRenduRepository(FIXTURE_DIR);
}

describe("FilesystemCompteRenduRepository", () => {
  it("retrouve les Explications de vote d'un vote sur l'ensemble, une par groupe parlementaire", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Réforme du financement des associations locales"
    );

    expect(explications).toEqual([
      {
        groupe: "RN",
        orateur: "M. Jean Dupont",
        texte: "Le groupe RN votera contre ce texte financièrement irresponsable.",
      },
      {
        groupe: "SOC",
        orateur: "Mme Alice Martin",
        texte: "Le groupe SOC soutient cette réforme du financement associatif.",
      },
    ]);
  });

  it("écarte un orateur sans groupe parlementaire identifiable entre parenthèses (ex. un ministre)", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Réforme du financement des associations locales"
    );

    expect(explications?.some((e) => e.orateur.includes("ministre"))).toBe(false);
  });

  it("distingue 2 sujets discutés le même jour par le titre du dossier (vote sur l'article unique)", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Réforme du financement des collectivités territoriales"
    );

    expect(explications).toEqual([
      {
        groupe: "EPR",
        orateur: "Mme Sophie Petit",
        texte: "Le groupe EPR votera pour ce texte équilibré.",
      },
    ]);
  });

  it("retourne null quand la date n'est couverte par aucun compte rendu disponible", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2099-01-01",
      "Un dossier quelconque"
    );

    expect(explications).toBeNull();
  });

  it("retourne null quand un vote sur le texte entier existe mais sans bloc Explications de vote qui le précède", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-16",
      "Ratification d’un accord bilatéral"
    );

    expect(explications).toBeNull();
  });

  it("retourne null quand aucun sujet de la date ne correspond au titre donné", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Un sujet complètement sans rapport avec les XML de la fixture"
    );

    expect(explications).toBeNull();
  });
});
