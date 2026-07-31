import { describe, expect, it } from "vitest";
import { tousLesSousThemes, type ThemeRacine } from "@/domain/taxonomie";

describe("tousLesSousThemes", () => {
  it("rassemble les sous-thèmes directs et ceux de toutes les branches", () => {
    const theme: ThemeRacine = {
      slug: "theme-test",
      nom: "Thème de test",
      description: "Description de test.",
      sousThemes: [{ slug: "direct", nom: "Direct", type: "consensuel" }],
      branches: [
        {
          slug: "branche-a",
          nom: "Branche A",
          sousThemes: [{ slug: "a1", nom: "A1", type: "consensuel" }],
        },
        {
          slug: "branche-b",
          nom: "Branche B",
          sousThemes: [{ slug: "b1", nom: "B1", type: "clivant" }],
        },
      ],
    };

    expect(tousLesSousThemes(theme).map((s) => s.slug)).toEqual([
      "direct",
      "a1",
      "b1",
    ]);
  });

  it("ne retourne que les sous-thèmes directs quand le thème n'a aucune branche", () => {
    const theme: ThemeRacine = {
      slug: "theme-test",
      nom: "Thème de test",
      description: "Description de test.",
      sousThemes: [{ slug: "direct", nom: "Direct", type: "consensuel" }],
      branches: [],
    };

    expect(tousLesSousThemes(theme).map((s) => s.slug)).toEqual(["direct"]);
  });
});
