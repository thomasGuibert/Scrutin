import { describe, expect, it } from "vitest";
import { explicationsVoteCurees, type ExplicationVote } from "@/domain/compteRendu";

describe("explicationsVoteCurees", () => {
  it("vrai quand tous les groupes ayant pris la parole ont un résumé rédigé", () => {
    const explications: ExplicationVote[] = [
      {
        groupe: "RN",
        orateur: "M. X",
        texte: "Nous voterons contre.",
        resume: "Le groupe votera contre, jugeant le texte insuffisant.",
      },
      {
        groupe: "SOC",
        orateur: "Mme Y",
        texte: "Nous voterons pour.",
        resume: "Le groupe soutient le texte, saluant une avancée pour les familles concernées.",
      },
    ];

    expect(explicationsVoteCurees(explications)).toBe(true);
  });

  it("faux si un seul groupe n'a pas encore de résumé rédigé (curation incomplète, issue #57)", () => {
    const explications: ExplicationVote[] = [
      {
        groupe: "RN",
        orateur: "M. X",
        texte: "Nous voterons contre.",
        resume: "Le groupe votera contre.",
      },
      { groupe: "SOC", orateur: "Mme Y", texte: "Nous voterons pour." },
    ];

    expect(explicationsVoteCurees(explications)).toBe(false);
  });

  it("faux si aucun groupe n'a de résumé rédigé", () => {
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: "Nous voterons contre." },
    ];

    expect(explicationsVoteCurees(explications)).toBe(false);
  });

  it("vrai (vacuité) sur une liste vide", () => {
    expect(explicationsVoteCurees([])).toBe(true);
  });
});
