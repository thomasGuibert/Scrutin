import { describe, expect, it } from "vitest";
import { calculerPosition, calculerVotants } from "@/domain/scrutin";

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

describe("calculerPosition", () => {
  it("retourne Pour quand le camp Pour est majoritaire et le camp minoritaire ne dépasse pas 33% des Votants", () => {
    // votants = 20, contre (minoritaire) = 5 -> 25%
    const position = calculerPosition({ pour: 15, contre: 5, abstentions: 0 });

    expect(position).toBe("Pour");
  });

  it("retourne Contre quand le camp Contre est majoritaire et le camp minoritaire ne dépasse pas 33% des Votants", () => {
    // votants = 20, pour (minoritaire) = 5 -> 25%
    const position = calculerPosition({ pour: 5, contre: 15, abstentions: 0 });

    expect(position).toBe("Contre");
  });

  it("retourne Divisé quand le camp minoritaire dépasse strictement 33% des Votants (cas réel : DR sur l'amendement Code noir)", () => {
    // votants = 2, minoritaire = 1 -> 50%
    const position = calculerPosition({ pour: 1, contre: 1, abstentions: 0 });

    expect(position).toBe("Divisé");
  });

  it("retourne Pour quand le groupe n'a aucun Votant (n'a pas participé au scrutin)", () => {
    const position = calculerPosition({ pour: 0, contre: 0, abstentions: 0 });

    expect(position).toBe("Pour");
  });

  it("n'est pas Divisé exactement à 33% des Votants (seuil strict, pas inclusif)", () => {
    // votants = 3, minoritaire = 1 -> exactement 33.33...%, donc Divisé (au-dessus, pas égal)
    // votants = 100, minoritaire = 33 -> exactement 33%, ne dépasse pas -> pas Divisé
    const position = calculerPosition({ pour: 67, contre: 33, abstentions: 0 });

    expect(position).toBe("Pour");
  });
});
