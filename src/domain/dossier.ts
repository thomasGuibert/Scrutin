export type FicheDossier = {
  contexte: string;
  action: string;
  resultatAttendu: string;
};

export type Dossier = {
  dossierRef: string;
  titre: string;
  sousTheme: string;
  tagsImpact: string[];
  ficheDossier: FicheDossier;
};

export interface DossierRepository {
  getByRef(dossierRef: string): Promise<Dossier | null>;
}
