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

// Longueur maximale d'un extrait par groupe — évite qu'une seule
// intervention prolixe épuise tout le budget avant même d'arriver aux
// groupes suivants (cf. LONGUEUR_MAX ci-dessous, le budget global).
const LONGUEUR_EXTRAIT_MAX = 220;

// Un extrait mécanique, pas un vrai résumé rédigé (cf. issue #56) : garde
// la première phrase de l'intervention (le plus souvent la prise de
// position elle-même, vérifié sur des cas réels), tronquée si elle dépasse
// LONGUEUR_EXTRAIT_MAX pour ne jamais priver les groupes suivants de place.
function extrairePremierePhrase(texte: string): string {
  const finDePhrase = texte.indexOf(". ");
  if (finDePhrase !== -1 && finDePhrase < LONGUEUR_EXTRAIT_MAX) {
    return texte.slice(0, finDePhrase + 1);
  }
  if (texte.length <= LONGUEUR_EXTRAIT_MAX) {
    return texte;
  }
  return `${texte.slice(0, LONGUEUR_EXTRAIT_MAX).trimEnd()}…`;
}

// Budget global du Contexte — même ordre de grandeur que les autres champs
// de Fiche (~10 lignes, cf. limiterALignes dans genererFicheScrutinEnrichie
// .ts), pas dupliqué ici en constante partagée : cette fonction-ci tronque
// par ligne entière (une intervention = une ligne), pas par caractère brut
// au milieu d'une phrase, donc un calcul différent malgré le même ordre de
// grandeur. Fixé en-dessous de ce budget (pas à 800 pile) pour laisser de
// la place à la ligne "… et N autres groupes." ajoutée après coup, sans
// jamais dépasser la limite de 820 caractères vérifiée par
// auditFichesScrutin.test.ts (#46).
const LONGUEUR_MAX = 750;

// Une ligne "Groupe : extrait" par intervention, dans l'ordre reçu
// (cf. ExplicationsVoteRepository — déjà dans l'ordre du compte rendu,
// donc de prise de parole) — jamais coupée en plein milieu d'une ligne :
// les groupes en trop une fois le budget atteint sont comptés plutôt
// qu'ajoutés à moitié.
export function resumerExplicationsVote(explications: ExplicationVote[]): string {
  const lignes: string[] = [];
  let longueur = 0;
  let omis = 0;

  for (const { groupe, texte } of explications) {
    const ligne = `${groupe} : ${extrairePremierePhrase(texte)}`;
    if (lignes.length > 0 && longueur + ligne.length + 1 > LONGUEUR_MAX) {
      omis++;
      continue;
    }
    lignes.push(ligne);
    longueur += ligne.length + 1;
  }

  if (omis > 0) {
    lignes.push(`… et ${omis} autre${omis > 1 ? "s" : ""} groupe${omis > 1 ? "s" : ""}.`);
  }

  return lignes.join("\n");
}
