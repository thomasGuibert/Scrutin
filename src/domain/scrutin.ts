export type DecompteScrutin = {
  pour: number;
  contre: number;
  abstentions: number;
};

export type PositionGroupe = {
  organeRef: string;
  decompte: DecompteScrutin;
  effectif: number;
};

export type Scrutin = {
  uid: string;
  titre: string;
  dossierRef: string | null;
  decompte: DecompteScrutin;
  positionsParGroupe: PositionGroupe[];
};

export interface ScrutinRepository {
  getByUid(uid: string): Promise<Scrutin | null>;
  getByDossierRef(dossierRef: string): Promise<Scrutin[]>;
}

export function calculerVotants(decompte: DecompteScrutin): number {
  return decompte.pour + decompte.contre + decompte.abstentions;
}

export type Position = "Pour" | "Contre" | "Divisé";

const SEUIL_DIVISE = 0.33;

export function calculerPosition(decompte: DecompteScrutin): Position {
  const votants = calculerVotants(decompte);
  const minoritaire = Math.min(decompte.pour, decompte.contre);

  // Aucun Votant (le groupe n'a pas participé) : pas de camp minoritaire à
  // mesurer, donc jamais Divisé — retombe sur la règle Pour/Contre ci-dessous.
  if (votants > 0 && minoritaire / votants > SEUIL_DIVISE) {
    return "Divisé";
  }

  return decompte.pour >= decompte.contre ? "Pour" : "Contre";
}

export function calculerTauxParticipation(
  decompte: DecompteScrutin,
  effectif: number
): number {
  return calculerVotants(decompte) / effectif;
}

export type EntreeAgregation = {
  decompte: DecompteScrutin;
  effectif: number;
};

// Moyenne des répartitions Pour/Contre/Abstention de chaque scrutin, pondérée
// par le taux de participation du groupe sur ce scrutin (cf. CONTEXT.md) —
// jamais une simple moyenne par nombre de scrutins. Un scrutin technique peu
// suivi pèse ainsi naturellement moins qu'un scrutin solennel largement suivi.
export function agregerPositions(
  entrees: EntreeAgregation[]
): DecompteScrutin {
  let poidsTotal = 0;
  let pour = 0;
  let contre = 0;
  let abstentions = 0;

  for (const { decompte, effectif } of entrees) {
    const votants = calculerVotants(decompte);
    if (votants === 0) {
      continue;
    }

    const poids = calculerTauxParticipation(decompte, effectif);
    poidsTotal += poids;
    pour += poids * (decompte.pour / votants);
    contre += poids * (decompte.contre / votants);
    abstentions += poids * (decompte.abstentions / votants);
  }

  if (poidsTotal === 0) {
    return { pour: 0, contre: 0, abstentions: 0 };
  }

  return {
    pour: pour / poidsTotal,
    contre: contre / poidsTotal,
    abstentions: abstentions / poidsTotal,
  };
}
