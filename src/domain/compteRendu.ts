// Une intervention en "Explications de vote", juste avant un vote sur le
// texte entier (cf. Scrutin décisif, CONTEXT.md) — un·e orateur·ice par
// Groupe parlementaire vient y justifier sa position, ce qui manque au
// titre AN seul pour expliquer le pourquoi d'un vote (cf. discussion du
// 2026-08-06, issue #52).
export type ExplicationVote = {
  groupe: string; // sigle du Groupe parlementaire, ex. "RN" (cf. CONTEXT.md)
  orateur: string; // nom tel qu'annoncé en séance, ex. "M. Yoann Gillet"
  texte: string;
};

export interface CompteRenduRepository {
  // Retrouve les Explications de vote du vote sur le texte entier d'un
  // dossier donné, à la séance de la date indiquée — null si la date n'est
  // pas couverte par les comptes rendus disponibles, ou si aucun bloc
  // "Vote sur l'ensemble"/"Vote sur l'article unique"/"Vote sur le texte
  // lui-même" ne correspond au dossier à cette date (cf. Scrutin décisif,
  // CONTEXT.md — mêmes 3 formes que estVoteSurLeTexteEntier,
  // domain/scrutin.ts). Jamais une liste vide : soit des interventions,
  // soit null (pas de séance sans aucune Explication de vote trouvée à
  // distinguer d'une séance non couverte).
  getExplicationsVote(
    dateSeance: string,
    dossierTitre: string
  ): Promise<ExplicationVote[] | null>;
}

// Lecture de l'archive précalculée (scripts/extraire-explications-vote.ts,
// issue #54) plutôt que du matching date+titre à la volée
// (CompteRenduRepository ci-dessus, encore utile pour explorer un nouveau
// lot de comptes rendus avant qu'il ne soit passé dans le script) — clé
// directe dossierRef + uid du scrutin, déjà résolue une fois pour toutes.
export interface ExplicationsVoteRepository {
  getByScrutin(
    dossierRef: string,
    scrutinUid: string
  ): Promise<ExplicationVote[] | null>;
}
