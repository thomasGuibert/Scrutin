export type Groupe = {
  organeRef: string;
  nom: string;
  abreviation: string;
  // Position dans l'hémicycle, de la gauche vers la droite (0 = le plus à
  // gauche) — sert uniquement à ordonner l'affichage, pas un jugement.
  ordreHemicycle: number;
};

export interface GroupeRepository {
  trouverGroupe(organeRef: string): Groupe | undefined;
}
