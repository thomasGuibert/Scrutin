import type { AmendementRepository } from "@/domain/amendement";
import {
  explicationsVoteCurees,
  type ExplicationsVoteRepository,
} from "@/domain/compteRendu";
import type { Dossier } from "@/domain/dossier";
import {
  estVoteSurLeTexteEntier,
  extraireAmendement,
  formaterResultatScrutin,
  genererFicheScrutin,
  type FicheScrutin,
  type FicheScrutinEffetAttendu,
  type FicheScrutinExplicationsVote,
  type FicheScrutinPasDeDonnees,
  type LigneExplicationVote,
  type Scrutin,
} from "@/domain/scrutin";
import type { ComparaisonGroupe } from "@/api/comparerGroupes";

// L'exposé des motifs enchaîne généralement un ou plusieurs paragraphes de
// fond (le problème qui motive l'amendement) puis un dernier paragraphe
// conclusif ("Cet amendement propose ainsi de...", "Cet amendement vise
// à...") qui énonce l'effet visé — vérifié sur les données réelles (ex.
// amendement n°820 de M. Biteau, dossier "Loi Duplomb"). On ne garde que ce
// dernier paragraphe comme "Résultat attendu" (court, et sans redite du
// Contexte) ; les paragraphes de fond, s'il y en a, rejoignent le Contexte
// plutôt que d'être dupliqués ou perdus.
function scinderExposeSommaire(exposeSommaire: string): {
  fond: string | null;
  effetAttendu: string;
} {
  const paragraphes = exposeSommaire
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphes.length <= 1) {
    return { fond: null, effetAttendu: exposeSommaire };
  }

  return {
    fond: paragraphes.slice(0, -1).join("\n\n"),
    effetAttendu: paragraphes[paragraphes.length - 1],
  };
}

// Le contenu réel d'un amendement (dispositif, exposé des motifs) n'a pas
// de limite de longueur côté AN — certains dispositifs enchaînent une
// dizaine d'alinéas. On borne chaque champ de la Fiche à ~10 lignes plutôt
// que de l'afficher en entier (estimation à 80 caractères/ligne, une
// approximation volontairement simple — pas un calcul de rendu réel, qui
// dépend de la largeur d'écran). Coupe à la dernière fin de phrase avant la
// limite pour ne jamais tronquer en plein milieu d'une phrase.
const CARACTERES_PAR_LIGNE = 80;
const LIGNES_MAX = 10;

function limiterALignes(texte: string, lignesMax: number = LIGNES_MAX): string {
  const maxCaracteres = lignesMax * CARACTERES_PAR_LIGNE;
  if (texte.length <= maxCaracteres) {
    return texte;
  }

  const tronque = texte.slice(0, maxCaracteres);
  const finDePhrase = tronque.lastIndexOf(". ");

  // Coupe à la dernière phrase complète si elle laisse au moins la moitié
  // du budget (évite un résultat ridiculement court si la première phrase
  // dépasse déjà la limite) ; sinon coupe brute au mot le plus proche.
  if (finDePhrase > maxCaracteres * 0.5) {
    return `${tronque.slice(0, finDePhrase + 1)}…`;
  }
  return `${tronque.trimEnd()}…`;
}

// Associe à chaque groupe ayant voté sur ce scrutin (comparerGroupes —
// toujours tous les groupes, pas seulement ceux qui ont pris la parole)
// son résumé rédigé quand il existe — null pour un groupe qui n'a pas pris
// la parole en Explications de vote, jamais une ligne omise (cf. issue
// #59, le tableau de la Fiche Scrutin doit rester exhaustif).
function construireExplicationsParGroupe(
  comparaison: ComparaisonGroupe[],
  explications: readonly { groupe: string; resume?: string }[]
): LigneExplicationVote[] {
  const resumeParSigle = new Map(
    explications.map(({ groupe, resume }) => [groupe, resume as string])
  );

  return comparaison.map(({ groupe, decompte, position }) => ({
    groupe,
    decompte,
    position,
    resume: resumeParSigle.get(groupe.abreviation) ?? null,
  }));
}

export function createGenererFicheScrutinEnrichie(
  amendementRepository: AmendementRepository,
  explicationsVoteRepository: ExplicationsVoteRepository,
  comparerGroupes: (scrutin: Scrutin) => ComparaisonGroupe[]
) {
  return async function genererFicheScrutinEnrichie(
    scrutin: Scrutin,
    dossier: Dossier | null,
    scrutinsDossier: Scrutin[]
  ): Promise<
    | FicheScrutin
    | FicheScrutinPasDeDonnees
    | FicheScrutinEffetAttendu
    | FicheScrutinExplicationsVote
  > {
    const detail = await amendementRepository.getByScrutin(scrutin);

    if (!detail) {
      // Un vote sur le texte entier avec de vraies Explications de vote
      // disponibles (issue #52/#54) prime sur le repli de genererFicheScrutin
      // (état "pas de données" ou description procédurale) : contrairement à
      // la Fiche dossier recopiée par ce repli, ces interventions sont
      // spécifiques à CE scrutin — la contrainte "seul vote du dossier" de
      // genererFicheScrutin ne s'applique donc pas ici, un dossier à
      // plusieurs lectures peut avoir ses deux votes enrichis séparément
      // (cf. issue #56).
      if (dossier && estVoteSurLeTexteEntier(scrutin.titre)) {
        const explications = await explicationsVoteRepository.getByScrutin(
          dossier.dossierRef,
          scrutin.uid
        );
        // Tant que la curation manuelle (issue #57) n'a pas encore couvert
        // tous les groupes ayant pris la parole sur ce scrutin, traité
        // comme si aucune Explication n'était disponible — jamais un
        // tableau à moitié rempli.
        if (explications && explicationsVoteCurees(explications)) {
          return {
            contexte: dossier.ficheDossier.contexte,
            action: dossier.ficheDossier.action,
            resultatAttendu: dossier.ficheDossier.resultatAttendu,
            explicationsParGroupe: construireExplicationsParGroupe(
              comparerGroupes(scrutin),
              explications
            ),
            resultat: formaterResultatScrutin(scrutin),
          };
        }
      }

      // Pas de contenu réel trouvé (amendement hors périmètre curé, ou tout
      // scrutin non-amendement, ou vote sur le texte entier sans
      // Explications de vote disponibles) : repli sur la Fiche dérivée du
      // titre (ou, pour l'unique vote sur le texte entier d'un dossier, sur
      // un état explicite "pas de données" pointant vers sa Fiche dossier —
      // cf. genererFicheScrutin, issue #84), avec le "Résultat" toujours
      // présent = issue déjà connue du vote — jamais d'erreur, jamais de
      // contenu manquant (cf. issue #46).
      return genererFicheScrutin(scrutin, dossier, scrutinsDossier);
    }

    const amendement = extraireAmendement(scrutin.titre);
    const attribution = amendement
      ? `Amendement de ${amendement.auteur}${
          amendement.article ? ` à l'article ${amendement.article}` : ""
        }.`
      : "Amendement.";

    const { fond, effetAttendu } = scinderExposeSommaire(detail.exposeSommaire);

    return {
      contexte: limiterALignes(fond ? `${attribution}\n\n${fond}` : attribution),
      action: limiterALignes(detail.dispositif),
      resultatAttendu: limiterALignes(effetAttendu),
    };
  };
}
