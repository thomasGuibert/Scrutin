import type { AmendementRepository } from "@/domain/amendement";
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

export function createGenererFicheScrutinEnrichie(
  amendementRepository: AmendementRepository
) {
  return async function genererFicheScrutinEnrichie(
    scrutin: Scrutin,
    dossierTitre: string | null
  ): Promise<FicheScrutin | FicheScrutinEffetAttendu> {
    const detail = await amendementRepository.getByScrutin(scrutin);

    // Pas de contenu réel trouvé (amendement hors périmètre curé, ou tout
    // scrutin non-amendement) : repli sur la Fiche dérivée du seul titre,
    // avec son "Résultat" = issue déjà connue du vote — jamais d'erreur,
    // jamais de contenu manquant (cf. issue #46).
    if (!detail) {
      return genererFicheScrutin(scrutin, dossierTitre);
    }

    const amendement = extraireAmendement(scrutin.titre);
    const attribution = amendement
      ? `Amendement de ${amendement.auteur}${
          amendement.article ? ` à l'article ${amendement.article}` : ""
        }.`
      : "Amendement.";

    const { fond, effetAttendu } = scinderExposeSommaire(detail.exposeSommaire);

    return {
      contexte: fond ? `${attribution}\n\n${fond}` : attribution,
      action: detail.dispositif,
      resultatAttendu: effetAttendu,
    };
  };
}
