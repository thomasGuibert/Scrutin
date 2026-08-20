import { describe, expect, it } from "vitest";
import {
  AUCUN_FILTRE,
  anneesDisponibles,
  correspondAuFiltre,
  moisDisponibles,
} from "@/domain/filtreDate";

describe("anneesDisponibles", () => {
  it("retourne les années présentes, sans doublon, de la plus récente à la plus ancienne", () => {
    const annees = anneesDisponibles([
      ["2025-03-18", "2025-01-01"],
      ["2026-07-02"],
    ]);

    expect(annees).toEqual([2026, 2025]);
  });

  it("retourne un tableau vide quand aucune entrée n'a de date", () => {
    expect(anneesDisponibles([])).toEqual([]);
    expect(anneesDisponibles([[]])).toEqual([]);
  });
});

describe("moisDisponibles", () => {
  it("retourne les mois présents pour l'année donnée, en ordre calendaire", () => {
    const mois = moisDisponibles(
      [["2026-07-02"], ["2026-01-15"], ["2025-12-01"]],
      2026
    );

    expect(mois).toEqual([1, 7]);
  });

  it("ignore les dates d'une autre année", () => {
    expect(moisDisponibles([["2025-07-02"]], 2026)).toEqual([]);
  });
});

describe("correspondAuFiltre", () => {
  it("accepte tout quand aucun filtre n'est actif", () => {
    expect(correspondAuFiltre(["2025-03-18"], AUCUN_FILTRE)).toBe(true);
    expect(correspondAuFiltre([], AUCUN_FILTRE)).toBe(true);
  });

  it("filtre sur l'année quand aucun mois n'est choisi", () => {
    const filtre = { annee: 2026, mois: null };

    expect(correspondAuFiltre(["2025-12-31", "2026-01-02"], filtre)).toBe(true);
    expect(correspondAuFiltre(["2025-12-31"], filtre)).toBe(false);
  });

  it("filtre sur l'année ET le mois quand les deux sont choisis", () => {
    const filtre = { annee: 2026, mois: 7 };

    expect(correspondAuFiltre(["2026-07-15"], filtre)).toBe(true);
    expect(correspondAuFiltre(["2026-01-15"], filtre)).toBe(false);
  });

  it("suffit qu'une seule date corresponde parmi plusieurs (dossier à lectures multiples)", () => {
    const filtre = { annee: 2026, mois: 7 };

    expect(correspondAuFiltre(["2025-01-10", "2026-07-15"], filtre)).toBe(true);
  });
});
