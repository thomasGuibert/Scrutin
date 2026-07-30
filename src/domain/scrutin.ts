export type DecompteScrutin = {
  pour: number;
  contre: number;
  abstentions: number;
};

export type PositionGroupe = {
  organeRef: string;
  decompte: DecompteScrutin;
};

export type Scrutin = {
  uid: string;
  titre: string;
  decompte: DecompteScrutin;
  positionsParGroupe: PositionGroupe[];
};

export interface ScrutinRepository {
  getByUid(uid: string): Promise<Scrutin | null>;
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
