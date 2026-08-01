import type { Scrutin } from "@/domain/scrutin";

// Contenu réel d'un amendement (cf. jeu de données "Amendements" de l'AN,
// issue #45) : le dispositif (texte exact proposé) et l'exposé des motifs
// (justification rédigée par l'auteur·ice). L'auteur·ice et l'article visé
// ne sont volontairement pas dupliqués ici — déjà extraits du titre du
// scrutin lui-même par extraireAmendement (domain/scrutin.ts), seule source
// pour cette information.
export type AmendementDetail = {
  dispositif: string;
  exposeSommaire: string;
};

export interface AmendementRepository {
  getByScrutin(scrutin: Scrutin): Promise<AmendementDetail | null>;
}
