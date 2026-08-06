import { describe, expect, it } from "vitest";
import { resumerExplicationsVote, type ExplicationVote } from "@/domain/compteRendu";

describe("resumerExplicationsVote", () => {
  it("garde la première phrase de chaque groupe, attribuée par sigle", () => {
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: "Nous voterons contre. Détail supplémentaire ignoré." },
      { groupe: "SOC", orateur: "Mme Y", texte: "Le groupe SOC soutient ce texte. Suite du propos." },
    ];

    expect(resumerExplicationsVote(explications)).toBe(
      "RN : Nous voterons contre.\nSOC : Le groupe SOC soutient ce texte."
    );
  });

  it("tronque un extrait sans point avant la limite, avec des points de suspension", () => {
    const texteLong = "Une phrase sans point interne qui continue longtemps ".repeat(6).trim();
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: texteLong },
    ];

    const resultat = resumerExplicationsVote(explications);

    expect(resultat.startsWith("RN : ")).toBe(true);
    expect(resultat.length).toBeLessThan(texteLong.length);
    expect(resultat.endsWith("…")).toBe(true);
  });

  it("garde le texte intégral quand il est déjà court et sans point", () => {
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: "Court" },
    ];

    expect(resumerExplicationsVote(explications)).toBe("RN : Court");
  });

  it("compte les groupes en trop plutôt que de dépasser le budget global", () => {
    const phraseLongue = `${"Motif détaillé qui prend beaucoup de place dans le budget global. ".repeat(3).trim()}`;
    const explications: ExplicationVote[] = Array.from({ length: 20 }, (_, i) => ({
      groupe: `G${i}`,
      orateur: `M. ${i}`,
      texte: phraseLongue,
    }));

    const resultat = resumerExplicationsVote(explications);

    expect(resultat.length).toBeLessThan(900);
    expect(resultat).toMatch(/… et \d+ autres? groupes?\.$/);
  });

  it("ne compte aucun groupe en trop quand tout tient dans le budget", () => {
    const explications: ExplicationVote[] = [
      { groupe: "RN", orateur: "M. X", texte: "Contre." },
    ];

    expect(resumerExplicationsVote(explications)).not.toContain("autre");
  });
});
