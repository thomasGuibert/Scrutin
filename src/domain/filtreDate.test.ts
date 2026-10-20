import { describe, expect, it } from "vitest";
import {
  AUCUN_FILTRE,
  anneesDisponibles,
  compterDossiersDansPeriode,
  correspondAuFiltre,
  filtreDepuisParametres,
  moisDisponibles,
  parametresDuFiltre,
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

describe("filtreDepuisParametres / parametresDuFiltre", () => {
  const lire = (requete: string) => filtreDepuisParametres(new URLSearchParams(requete));

  it("lit l'année et le mois depuis l'URL", () => {
    expect(lire("annee=2026&mois=3")).toEqual({ annee: 2026, mois: 3 });
    expect(lire("annee=2026")).toEqual({ annee: 2026, mois: null });
  });

  it("ignore les valeurs invalides plutôt que de casser la page", () => {
    expect(lire("")).toEqual(AUCUN_FILTRE);
    expect(lire("mois=3")).toEqual(AUCUN_FILTRE);
    expect(lire("annee=abc&mois=3")).toEqual(AUCUN_FILTRE);
    expect(lire("annee=2026&mois=13")).toEqual({ annee: 2026, mois: null });
    expect(lire("annee=2026&mois=0")).toEqual({ annee: 2026, mois: null });
  });

  it("produit la chaîne de requête à propager, vide sans filtre", () => {
    expect(parametresDuFiltre(AUCUN_FILTRE)).toBe("");
    expect(parametresDuFiltre({ annee: 2026, mois: null })).toBe("?annee=2026");
    expect(parametresDuFiltre({ annee: 2026, mois: 3 })).toBe("?annee=2026&mois=3");
  });

  it("fait l'aller-retour sans perte", () => {
    const filtre = { annee: 2025, mois: 11 };
    expect(lire(parametresDuFiltre(filtre).slice(1))).toEqual(filtre);
  });
});

describe("compterDossiersDansPeriode", () => {
  const datesParDossier = [["2025-03-18", "2026-01-10"], ["2026-01-20"], ["2025-11-02"]];

  it("compte les dossiers qui ont au moins un scrutin dans la période", () => {
    expect(compterDossiersDansPeriode(datesParDossier, 3, { annee: 2026, mois: null })).toBe(2);
    expect(compterDossiersDansPeriode(datesParDossier, 3, { annee: 2025, mois: 11 })).toBe(1);
    expect(compterDossiersDansPeriode(datesParDossier, 3, { annee: 2024, mois: null })).toBe(0);
  });

  it("garde le total du nœud sans filtre, dossiers sans scrutin compris", () => {
    expect(compterDossiersDansPeriode(datesParDossier, 4, AUCUN_FILTRE)).toBe(4);
  });
});
