import type { AmendementRepository } from "@/domain/amendement";
import {
  extraireAmendement,
  genererFicheScrutin,
  type FicheScrutin,
  type FicheScrutinEffetAttendu,
  type Scrutin,
} from "@/domain/scrutin";

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
    const contexte = amendement
      ? `Amendement de ${amendement.auteur}${
          amendement.article ? ` à l'article ${amendement.article}` : ""
        }.`
      : "Amendement.";

    // L'exposé des motifs argue l'effet visé par l'amendement s'il est
    // appliqué — c'est un "Résultat attendu" (même concept que
    // FicheDossier.resultatAttendu), pas l'issue du vote lui-même (déjà
    // affichée séparément dans le décompte du scrutin de la page).
    return {
      contexte,
      action: detail.dispositif,
      resultatAttendu: detail.exposeSommaire,
    };
  };
}
