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
  getBySousTheme(slug: string): Promise<Dossier[]>;
  getByTagImpact(tag: string): Promise<Dossier[]>;
}

// La fiche officielle du dossier sur assemblee-nationale.fr accepte
// directement le dossierRef comme identifiant d'URL (pas besoin du slug
// textuel du titre) — vérifié sur un cas réel (DLR5L17N53980). Le numéro
// de législature est extrait du dossierRef lui-même ("...5L17..." = 5e
// République, 17e législature) plutôt que codé en dur, pour rester correct
// si le pipeline est un jour rejoué sur une autre législature (cf.
// ADR-0001) ; 17 par défaut si jamais le format venait à changer.
export function lienDossierAN(dossierRef: string): string {
  const legislature = dossierRef.match(/5L(\d+)/)?.[1] ?? "17";
  return `https://www.assemblee-nationale.fr/dyn/${legislature}/dossiers/${dossierRef}`;
}
