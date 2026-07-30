import { describe, expect, it } from "vitest";
import { calculerVotants } from "@/domain/scrutin";

describe("calculerVotants", () => {
  it("somme pour, contre et abstentions", () => {
    const votants = calculerVotants({ pour: 10, contre: 5, abstentions: 3 });

    expect(votants).toBe(18);
  });

  it("exclut les absents du calcul (ils ne sont pas comptés dans les décomptes)", () => {
    const votants = calculerVotants({ pour: 0, contre: 0, abstentions: 0 });

    expect(votants).toBe(0);
  });
});
