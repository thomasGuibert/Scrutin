"use client";

import {
  AUCUN_FILTRE,
  anneesDisponibles,
  moisDisponibles,
  type FiltrePeriode,
} from "@/domain/filtreDate";

const NOMS_MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Sélecteurs Année/Mois réutilisés par toute liste filtrable par période
// (dossiers d'un sous-thème, sous-thèmes d'une branche ou d'un thème — cf.
// issue #151/#152) : même peuplement des options (domain/filtreDate.ts) et
// même rendu partout, un seul endroit à faire évoluer. `datesParEntree`
// couvre toute la liste affichée par le parent (pas seulement la sélection
// courante) — sert à peupler les options disponibles, jamais à filtrer
// elle-même (le parent s'en charge avec `correspondAuFiltre`). Invisible
// tant qu'aucune date n'est disponible (rien à filtrer).
export function SelecteurPeriode({
  datesParEntree,
  filtre,
  onChange,
}: {
  datesParEntree: string[][];
  filtre: FiltrePeriode;
  onChange: (filtre: FiltrePeriode) => void;
}) {
  const annees = anneesDisponibles(datesParEntree);
  if (annees.length === 0) {
    return null;
  }

  const mois =
    filtre.annee === null ? [] : moisDisponibles(datesParEntree, filtre.annee);

  return (
    <div className="date-filter">
      <label className="date-filter-field">
        <span className="date-filter-label">Année</span>
        <select
          value={filtre.annee ?? ""}
          onChange={(evenement) => {
            const valeur = evenement.target.value;
            onChange(
              valeur === "" ? AUCUN_FILTRE : { annee: Number(valeur), mois: null }
            );
          }}
        >
          <option value="">Toutes</option>
          {annees.map((annee) => (
            <option key={annee} value={annee}>
              {annee}
            </option>
          ))}
        </select>
      </label>

      <label className="date-filter-field">
        <span className="date-filter-label">Mois</span>
        <select
          value={filtre.mois ?? ""}
          disabled={filtre.annee === null}
          onChange={(evenement) => {
            const valeur = evenement.target.value;
            onChange({ ...filtre, mois: valeur === "" ? null : Number(valeur) });
          }}
        >
          <option value="">Tous</option>
          {mois.map((numeroMois) => (
            <option key={numeroMois} value={numeroMois}>
              {NOMS_MOIS[numeroMois - 1]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
