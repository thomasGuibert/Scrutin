import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ActeurGroupeRepository } from "@/domain/acteur";
import { FilesystemDiscussionGeneraleRepository } from "@/spi/filesystem/discussionGeneraleRepository";

const FIXTURE_DIR = path.join(import.meta.dirname, "__fixtures__/comptes-rendus");

// Reproduit exactement l'attribution de la fixture AMO10Fixture.zip
// (acteurGroupeRepository.test.ts), sans dépendre du .zip ici : ce fichier
// teste discussionGeneraleRepository, pas le rattachement acteur -> groupe
// lui-même (déjà couvert séparément).
class FakeActeurGroupeRepository implements ActeurGroupeRepository {
  groupeAuMoment(idActeur: string): string | null {
    if (idActeur === "900") return "RN";
    if (idActeur === "901") return "SOC";
    return null;
  }
}

function creerRepository(): FilesystemDiscussionGeneraleRepository {
  return new FilesystemDiscussionGeneraleRepository(
    new FakeActeurGroupeRepository(),
    FIXTURE_DIR
  );
}

describe("FilesystemDiscussionGeneraleRepository", () => {
  it("retrouve les interventions nommées d'un dossier sans bloc Explications de vote, dans tout le fichier le concernant", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-16",
      "Réforme du statut des lanceurs d'alerte"
    );

    expect(interventions).toEqual([
      {
        groupe: "RN",
        orateur: "M. Henri Leroy",
        texte:
          "Le statut des lanceurs d’alerte doit être renforcé, notre groupe soutient ce texte avec conviction.",
      },
      {
        groupe: "SOC",
        orateur: "Mme Claire Dubois",
        texte:
          "Notre groupe est plus réservé sur ce texte relatif aux lanceurs d’alerte, malgré des avancées notables.",
      },
    ]);
  });

  it("écarte un orateur sans id numérique (ex. « Un député du groupe RN », anonymisé)", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-16",
      "Réforme du statut des lanceurs d'alerte"
    );

    expect(interventions?.some((i) => i.orateur.includes("Un député"))).toBe(false);
  });

  it("écarte un orateur dont l'id ne résout à aucun groupe connu à cette date", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-16",
      "Réforme du statut des lanceurs d'alerte"
    );

    expect(interventions?.some((i) => i.orateur.includes("Inconnu"))).toBe(false);
  });

  it("retourne null quand la date n'est couverte par aucun compte rendu disponible", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2030-01-01",
      "Réforme du statut des lanceurs d'alerte"
    );

    expect(interventions).toBeNull();
  });

  it("retourne null quand aucun fichier de la date ne correspond au titre donné", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-16",
      "Un tout autre sujet sans rapport"
    );

    expect(interventions).toBeNull();
  });

  it("retourne null quand le seul fichier disponible ne concerne le dossier que par son bloc Explications de vote (aucun <paragraphe> orateur exploitable ailleurs)", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-15",
      "Réforme du financement des associations locales"
    );

    expect(interventions).toBeNull();
  });

  it("fusionne les interventions de 2 séances à égalité de score quand elles partagent le même intitulé de sommaire1 (discussion générale « suite », issue #96)", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-17",
      "Réforme du permis de conduire pour les jeunes conducteurs"
    );

    expect(interventions).toEqual([
      {
        groupe: "RN",
        orateur: "M. Karim Diallo",
        texte: "Ce texte réforme le permis de conduire pour les jeunes, notre groupe y est favorable.",
      },
      {
        groupe: "SOC",
        orateur: "Mme Nadia Ferrand",
        texte: "Nous poursuivons ce débat entamé lors de la précédente séance, toujours favorables au texte.",
      },
    ]);
  });

  it("retourne null quand 2 séances à égalité de score correspondent à 2 intitulés différents (deux dossiers sans rapport, même score par coïncidence)", async () => {
    const repository = creerRepository();

    const interventions = await repository.getInterventions(
      "2025-01-18",
      "Réforme du permis de conduire pour les jeunes conducteurs"
    );

    expect(interventions).toBeNull();
  });
});
