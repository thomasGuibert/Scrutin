// Filtre par période (Année, éventuellement Mois) appliqué à une liste de
// dossiers (cf. page sous-thème) : ne garde qu'une entrée qui a au moins un
// scrutin dans la période choisie. Année seule filtre sur l'année entière ;
// Année + Mois affine sur un mois précis. Jamais de niveau Jour — les
// listes de dossiers, déjà scopées par sous-thème, sont trop courtes pour
// qu'un filtre par jour retourne autre chose que du vide la plupart du
// temps (cf. issue #151).
export type FiltrePeriode = {
  annee: number | null;
  // 1-12 (janvier = 1) ; ignoré tant que annee est null.
  mois: number | null;
};

export const AUCUN_FILTRE: FiltrePeriode = { annee: null, mois: null };

function anneeDeDate(date: string): number {
  return Number(date.slice(0, 4));
}

function moisDeDate(date: string): number {
  return Number(date.slice(5, 7));
}

// Les années où au moins un scrutin a eu lieu, toutes entrées confondues,
// triées de la plus récente à la plus ancienne — peuple le sélecteur Année.
export function anneesDisponibles(datesParEntree: string[][]): number[] {
  const annees = new Set<number>();
  for (const dates of datesParEntree) {
    for (const date of dates) {
      annees.add(anneeDeDate(date));
    }
  }
  return [...annees].sort((a, b) => b - a);
}

// Les mois où au moins un scrutin a eu lieu pour l'année donnée, dans
// l'ordre calendaire (1 = janvier) — peuple le sélecteur Mois une fois une
// Année choisie ; volontairement vide tant qu'aucune Année n'est
// sélectionnée (le mois seul, sans année, n'a pas de sens ici).
export function moisDisponibles(
  datesParEntree: string[][],
  annee: number
): number[] {
  const mois = new Set<number>();
  for (const dates of datesParEntree) {
    for (const date of dates) {
      if (anneeDeDate(date) === annee) {
        mois.add(moisDeDate(date));
      }
    }
  }
  return [...mois].sort((a, b) => a - b);
}

// Une entrée (ex. un dossier, via ses dates de scrutin) correspond au
// filtre si AU MOINS UNE de ses dates tombe dans la période choisie —
// jamais "toutes les dates" : un dossier avec un scrutin en 2026 apparaît
// quand on filtre sur 2026, même s'il en a aussi d'autres années (il peut
// s'étaler sur plusieurs lectures, cf. formaterPeriodeDossier).
export function correspondAuFiltre(
  dates: string[],
  filtre: FiltrePeriode
): boolean {
  const { annee, mois } = filtre;
  if (annee === null) {
    return true;
  }
  return dates.some(
    (date) => anneeDeDate(date) === annee && (mois === null || moisDeDate(date) === mois)
  );
}

// Nombre de dossiers à afficher pour un nœud (thème, branche, sous-thème)
// sous le filtre : ceux qui ont au moins un scrutin dans la période (même
// règle que correspondAuFiltre). Sans filtre, le total du nœud, qui compte
// aussi les dossiers encore sans scrutin.
export function compterDossiersDansPeriode(
  datesParDossier: string[][],
  nombreDossiers: number,
  filtre: FiltrePeriode
): number {
  if (filtre.annee === null) {
    return nombreDossiers;
  }
  return datesParDossier.filter((dates) => correspondAuFiltre(dates, filtre)).length;
}

// Le filtre voyage dans l'URL (`?annee=2026&mois=3`) pour suivre la
// navigation : choisi sur l'accueil ou un thème, il reste appliqué sur les
// pages suivantes (thème → branche → sous-thème), et un lien partagé
// retombe sur la même vue. Toute valeur invalide (absente, non numérique,
// mois hors 1-12, mois sans année) est ignorée plutôt que de casser la page.
export function filtreDepuisParametres(parametres: {
  get(nom: string): string | null;
}): FiltrePeriode {
  const annee = entierOuNull(parametres.get("annee"));
  if (annee === null) {
    return AUCUN_FILTRE;
  }
  const mois = entierOuNull(parametres.get("mois"));
  return { annee, mois: mois !== null && mois >= 1 && mois <= 12 ? mois : null };
}

// Pendant de filtreDepuisParametres : la chaîne de requête à ajouter à un
// lien pour y propager le filtre (`?annee=2026&mois=3`), vide sans filtre.
export function parametresDuFiltre(filtre: FiltrePeriode): string {
  if (filtre.annee === null) {
    return "";
  }
  return filtre.mois === null
    ? `?annee=${filtre.annee}`
    : `?annee=${filtre.annee}&mois=${filtre.mois}`;
}

function entierOuNull(valeur: string | null): number | null {
  if (valeur === null || !/^\d+$/.test(valeur)) {
    return null;
  }
  return Number(valeur);
}
