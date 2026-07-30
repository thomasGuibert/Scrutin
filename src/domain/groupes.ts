export type Groupe = {
  organeRef: string;
  nom: string;
  abreviation: string;
};

export interface GroupeRepository {
  trouverGroupe(organeRef: string): Groupe | undefined;
}
