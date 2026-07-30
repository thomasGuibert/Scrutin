import { describe, expect, it } from "vitest";
import {
  agregerPositions,
  calculerPosition,
  calculerTauxParticipation,
  calculerVotants,
} from "@/domain/scrutin";

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

describe("calculerTauxParticipation", () => {
  it("divise les Votants du groupe par son effectif total", () => {
    const taux = calculerTauxParticipation(
      { pour: 8, contre: 2, abstentions: 0 },
      20
    );

    expect(taux).toBe(0.5);
  });
});

describe("agregerPositions", () => {
  it("pondère chaque scrutin par le taux de participation du groupe, pas par une simple moyenne du nombre de scrutins", () => {
    // Scrutin A : 9 pour, 1 contre sur 10 votants, effectif 10 -> taux 1.0, 90%/10%
    // Scrutin B : 1 pour, 1 contre sur 2 votants, effectif 2 -> taux 1.0, 50%/50%
    // même poids (taux=1 chacun) -> moyenne simple des deux répartitions : 70%/30%
    const agrege = agregerPositions([
      { decompte: { pour: 9, contre: 1, abstentions: 0 }, effectif: 10 },
      { decompte: { pour: 1, contre: 1, abstentions: 0 }, effectif: 2 },
    ]);

    expect(agrege.pour).toBeCloseTo(0.7);
    expect(agrege.contre).toBeCloseTo(0.3);
    expect(agrege.abstentions).toBeCloseTo(0);
  });

  it("pèse moins un scrutin technique peu suivi qu'un scrutin largement suivi (taux de participation faible)", () => {
    // Scrutin A : bien suivi, taux de participation 1.0, 100% pour
    // Scrutin B : très peu suivi (1 votant sur 100 membres), taux 0.01, 100% contre
    // le résultat agrégé doit rester très majoritairement Pour, pas 50/50
    const agrege = agregerPositions([
      { decompte: { pour: 10, contre: 0, abstentions: 0 }, effectif: 10 },
      { decompte: { pour: 0, contre: 1, abstentions: 0 }, effectif: 100 },
    ]);

    expect(agrege.pour).toBeGreaterThan(0.9);
  });

  it("retourne un décompte nul quand aucun scrutin n'a de Votant (taux de participation total nul)", () => {
    const agrege = agregerPositions([
      { decompte: { pour: 0, contre: 0, abstentions: 0 }, effectif: 10 },
    ]);

    expect(agrege).toEqual({ pour: 0, contre: 0, abstentions: 0 });
  });
});
