import type { Scrutin } from "@/domain/scrutin";

// Une intervention en "Explications de vote", juste avant un vote sur le
// texte entier (cf. Scrutin décisif, CONTEXT.md) — un·e orateur·ice par
// Groupe parlementaire vient y justifier sa position, ce qui manque au
// titre AN seul pour expliquer le pourquoi d'un vote (cf. discussion du
// 2026-08-06, issue #52).
export type ExplicationVote = {
  groupe: string; // sigle du Groupe parlementaire, ex. "RN" (cf. CONTEXT.md)
  orateur: string; // nom tel qu'annoncé en séance, ex. "M. Yoann Gillet"
  texte: string;
  // Résumé rédigé à la main (curation manuelle, issue #57) : 2-3 phrases
  // reprenant les points soulevés par le groupe — jamais un extrait
  // mécanique de `texte`. Absent tant que ce scrutin n'a pas encore été
  // curé ; resumerExplicationsVote refuse alors un Contexte partiel (voir
  // plus bas).
  resume?: string;
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

// La curation manuelle (issue #57) avance dossier par dossier sur
// l'ensemble des 95 scrutins couverts : tant qu'un seul groupe ayant pris
// la parole sur ce scrutin n'a pas encore de `resume` rédigé, la curation
// n'est pas terminée pour lui. genererFicheScrutinEnrichie.ts s'en sert
// pour retomber sur son repli habituel dans ce cas — jamais un tableau de
// Fiche Scrutin où certaines interventions manqueraient de résumé sans
// explication (cf. issue #59 pour la mise en page qui consomme ce
// résultat : un tableau Groupe/Position/Explication, pas un extrait).
export function explicationsVoteCurees(explications: ExplicationVote[]): boolean {
  return explications.every(({ resume }) => Boolean(resume));
}

// Une intervention en Discussion générale — source complémentaire aux
// Explications de vote pour un scrutin décisif qui n'en a aucune (issue
// #87, ADR-0003) : contrairement à ExplicationVote, `groupe` n'est pas lu
// tel quel dans le texte (pas de sigle entre parenthèses) mais résolu via
// ActeurGroupeRepository ; et plusieurs interventions par Groupe sont la
// norme (discussion de fond, pas un roll-call d'un·e orateur·ice par
// groupe comme Explications de vote) — à trier/résumer manuellement,
// jamais utilisées telles quelles.
export type InterventionDiscussionGenerale = {
  groupe: string; // sigle du Groupe parlementaire, ex. "RN"
  orateur: string;
  texte: string;
};

export interface DiscussionGeneraleRepository {
  // Retrouve les interventions de Discussion générale attribuables à un
  // Groupe parlementaire, pour le dossier dont le titre est fourni, à la
  // séance de la date indiquée — null si la date n'est pas couverte par
  // les comptes rendus disponibles, ou si aucune section ne correspond au
  // dossier à cette date. Jamais une liste vide pour la même raison
  // qu'ExplicationVote ci-dessus.
  getInterventions(
    dateSeance: string,
    dossierTitre: string
  ): Promise<InterventionDiscussionGenerale[] | null>;
}

// Le discours par lequel l'auteur·ice défend EN SÉANCE un amendement précis
// (issue #94) — source de dernier recours pour compléter le Contexte d'un
// vote sur amendement dont l'exposé des motifs écrit ne fait qu'un seul
// paragraphe (juste la ligne d'attribution, cf. scinderExposeSommaire,
// api/genererFicheScrutinEnrichie.ts). Volontairement spécifique à CET
// amendement, jamais un repli sur le contexte du dossier en général : le
// compte rendu SYCERON tague chaque `<paragraphe>` avec le numéro
// d'amendement et l'article concernés au moment précis où il est défendu
// (cf. spi/filesystem/discoursAmendementRepository.ts pour le détail des
// attributs et la désambiguïsation par numéro de document officiel du
// dossier — un simple rapprochement numéro + article s'est avéré
// insuffisant, deux textes sans rapport pouvant réutiliser la même paire).
export interface DiscoursAmendementRepository {
  // null quand aucune intervention n'a pu être rattachée avec certitude à
  // CET amendement précis (scrutin non-amendement, dossier non résolu,
  // amendement non discuté individuellement — ex. discussion commune où
  // seul le premier amendement du groupe est tagué — ou séance hors des
  // archives disponibles) : jamais un contexte approximatif ou générique.
  getByScrutin(scrutin: Scrutin): Promise<string | null>;
}
