export type DecompteScrutin = {
  pour: number;
  contre: number;
  abstentions: number;
};

export type Scrutin = {
  uid: string;
  titre: string;
  decompte: DecompteScrutin;
};

export interface ScrutinRepository {
  getByUid(uid: string): Promise<Scrutin | null>;
}

export function calculerVotants(decompte: DecompteScrutin): number {
  return decompte.pour + decompte.contre + decompte.abstentions;
}
