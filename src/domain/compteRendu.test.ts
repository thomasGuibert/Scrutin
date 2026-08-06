import { describe, expect, it } from "vitest";
import { resumerExplicationsVote, type ExplicationVote } from "@/domain/compteRendu";

describe("resumerExplicationsVote", () => {
  it("assemble un paragraphe par groupe, à partir du résumé rédigé (pas de texte brut)", () => {
    const explications: ExplicationVote[] = [
      {
        groupe: "RN",
        orateur: "M. X",
        texte: "Nous voterons contre. Détail supplémentaire ignoré.",
        resume: "Le groupe votera contre, jugeant le texte insuffisant.",
      },
      {
        groupe: "SOC",
        orateur: "Mme Y",
        texte: "Le groupe SOC soutient ce texte. Suite du propos.",
        resume: "Le groupe soutient le texte, saluant une avancée pour les familles concernées.",
      },
    ];

    expect(resumerExplicationsVote(explications)).toBe(
      "RN : Le groupe votera contre, jugeant le texte insuffisant.\n\n" +
        "SOC : Le groupe soutient le texte, saluant une avancée pour les familles concernées."
    );
  });

  it("retourne null si un seul groupe n'a pas encore de résumé rédigé (curation incomplète, issue #57)", () => {
    const explications: ExplicationVote[] = [
      {
        groupe: "RN",
        orateur: "M. X",
        texte: "Nous voterons contre.",
        resume: "Le groupe votera contre.",
      },
      { groupe: "SOC", orateur: "Mme Y", texte: "Nous voterons pour." },
    ];

    expect(resumerExplicationsVote(explications)).toBeNull();
  });

  it("retourne null si aucun groupe n'a de résumé rédigé", () => {
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: "Nous voterons contre." },
    ];

    expect(resumerExplicationsVote(explications)).toBeNull();
  });

  it("garde l'ordre reçu (celui de la prise de parole en séance)", () => {
    const explications: ExplicationVote[] = [
      { groupe: "SOC", orateur: "Mme Y", texte: "…", resume: "Résumé SOC." },
      { groupe: "RN", orateur: "M. X", texte: "…", resume: "Résumé RN." },
    ];

    expect(resumerExplicationsVote(explications)).toBe("SOC : Résumé SOC.\n\nRN : Résumé RN.");
  });
});
