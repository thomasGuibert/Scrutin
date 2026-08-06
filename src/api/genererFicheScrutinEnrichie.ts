import type { AmendementRepository } from "@/domain/amendement";
import type { Dossier } from "@/domain/dossier";
import {
  extraireAmendement,
  genererFicheScrutin,
  type FicheScrutin,
  type FicheScrutinEffetAttendu,
  type Scrutin,
} from "@/domain/scrutin";

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

export function createGenererFicheScrutinEnrichie(
  amendementRepository: AmendementRepository
) {
  return async function genererFicheScrutinEnrichie(
    scrutin: Scrutin,
    dossier: Dossier | null,
    scrutinsDossier: Scrutin[]
  ): Promise<FicheScrutin | FicheScrutinEffetAttendu> {
    const detail = await amendementRepository.getByScrutin(scrutin);

    // Pas de contenu réel trouvé (amendement hors périmètre curé, ou tout
    // scrutin non-amendement) : repli sur la Fiche dérivée du titre (ou,
    // pour l'unique vote sur le texte entier d'un dossier, sur sa Fiche
    // dossier — cf. genererFicheScrutin), avec son "Résultat" = issue déjà
    // connue du vote — jamais d'erreur, jamais de contenu manquant (cf.
    // issue #46).
    if (!detail) {
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
