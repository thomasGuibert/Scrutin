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

  it("reconnaît aussi le bloc au singulier « Explication de vote » (issue #96)", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Restreindre la vente de protoxyde d’azote"
    );

    expect(explications).toEqual([
      {
        groupe: "LIOT",
        orateur: "M. Karim Nasser",
        texte: "Le groupe LIOT votera pour ce texte de santé publique.",
      },
    ]);
  });

  it("reconnaît aussi « Vote sur la proposition de résolution » (formulation alternative pour une résolution, issue #96)", async () => {
    const repository = creerRepository();

    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Condamner l’ingérence étrangère dans les processus électoraux"
    );

    expect(explications).toEqual([
      {
        groupe: "GDR",
        orateur: "M. Farid Aziz",
        texte: "Le groupe GDR votera pour cette résolution de fermeté diplomatique.",
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

  it("ne confond pas 2 sujets qui ne partagent que l'article « les » (issue #62)", async () => {
    const repository = creerRepository();

    // "les" n'a pas de rapport de fond avec "Encadrer les délais de
    // paiement des entreprises" (le seul candidat réel ce jour-là à part
    // les 2 dossiers "Réforme du financement..." déjà testés plus haut) —
    // doit rester à un score de 0, pas 1, sous peine de reproduire le bug
    // trouvé sur un cas réel (3 dossiers faussement associés aux mêmes
    // Explications de vote le même jour, "les" manquant de MOTS_VIDES).
    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Renforcer les contrôles sanitaires dans les abattoirs"
    );

    expect(explications).toBeNull();
  });

  it("ne confond pas 2 sujets qui ne partagent qu'un seul mot de fond, même hors mot vide (issue #62)", async () => {
    const repository = creerRepository();

    // "gestion" est un mot de fond ordinaire, pas un mot vide — mais un
    // seul mot partagé, même significatif, s'est avéré systématiquement
    // fortuit sur les cas réels (ex. un dossier sur les successions
    // héritant à tort du texte d'un dossier sur les inondations, les deux
    // ne partageant que "gestion"). D'où le score minimal de 2 dans
    // getExplicationsVote, qui ne se limite pas à filtrer des mots vides.
    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Réviser la gestion des flux migratoires"
    );

    expect(explications).toBeNull();
  });

  it("retrouve un bloc Explications de vote communes à 2 textes votés le même jour, distingués par un suffixe en italique dans l'intitulé du vote (ex. « Vote sur l'ensemble (accompagnement et soins palliatifs) »)", async () => {
    const repository = creerRepository();

    // Le suffixe entre parenthèses qui distingue les 2 votes est encodé en
    // XML avec une balise <italique> juste après "l'ensemble" — sans elle,
    // le motif qui vérifie qu'un bloc Explications de vote est bien suivi
    // d'un "Vote sur l'ensemble/l'article unique" échouait (le texte de
    // l'intitulé n'était capturé que jusqu'à la première balise inline
    // rencontrée), et le bloc entier passait inaperçu.
    const explications = await repository.getExplicationsVote(
      "2025-01-15",
      "Accompagnement et soins palliatifs"
    );

    expect(explications).toEqual([
      {
        groupe: "Dem",
        orateur: "M. Marc Rousseau",
        texte: "Le groupe Dem votera pour ces deux textes sur la fin de vie.",
      },
    ]);
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
