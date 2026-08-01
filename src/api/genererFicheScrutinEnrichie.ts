import type { AmendementRepository } from "@/domain/amendement";
import {
  extraireAmendement,
  formaterResultatScrutin,
  genererFicheScrutin,
  type FicheScrutin,
  type Scrutin,
} from "@/domain/scrutin";

export function createGenererFicheScrutinEnrichie(
  amendementRepository: AmendementRepository
) {
  return async function genererFicheScrutinEnrichie(
    scrutin: Scrutin,
    dossierTitre: string | null
  ): Promise<FicheScrutin> {
    const detail = await amendementRepository.getByScrutin(scrutin);

    // Pas de contenu réel trouvé (amendement hors périmètre curé, ou tout
    // scrutin non-amendement) : repli sur la Fiche dérivée du seul titre —
    // jamais d'erreur, jamais de contenu manquant (cf. issue #46).
    if (!detail) {
      return genererFicheScrutin(scrutin, dossierTitre);
    }

    const amendement = extraireAmendement(scrutin.titre);
    const attribution = amendement
      ? `Amendement de ${amendement.auteur}${
          amendement.article ? ` à l'article ${amendement.article}` : ""
        }.`
      : "Amendement.";

    return {
      contexte: `${attribution} ${detail.exposeSommaire}`,
      action: detail.dispositif,
      resultat: formaterResultatScrutin(scrutin),
    };
  };
}
