import type { Dossier, DossierRepository } from "@/domain/dossier";
import { trouverScrutinDecisif, type Scrutin } from "@/domain/scrutin";

export type DernierDossierVote = {
  dossier: Dossier;
  scrutinDecisif: Scrutin;
  scrutins: Scrutin[];
};

// Le dossier curé (content/dossiers/) dont le Scrutin décisif est le plus
// récent (numéro de scrutin le plus élevé, cf. trouverScrutinDecisif) —
// l'accroche de la page d'accueil. Calculé au build plutôt que codé en dur :
// chaque passage du pipeline quotidien (push sur main → nouveau build) le
// met à jour de lui-même dès qu'un nouveau dossier est voté et curé. Un
// dossier encore sans Scrutin décisif (toujours en cours d'examen) n'est
// jamais retenu. null tant qu'aucun dossier n'en a.
export function createTrouverDernierDossierVote(
  dossierRepository: DossierRepository,
  listerScrutinsDossier: (dossierRef: string) => Promise<Scrutin[]>
) {
  return async function trouverDernierDossierVote(): Promise<DernierDossierVote | null> {
    const dossiers = await dossierRepository.getAll();

    const candidats = await Promise.all(
      dossiers.map(async (dossier) => {
        const scrutins = await listerScrutinsDossier(dossier.dossierRef);
        const scrutinDecisif = trouverScrutinDecisif(scrutins);
        return scrutinDecisif ? { dossier, scrutinDecisif, scrutins } : null;
      })
    );

    return candidats.reduce<DernierDossierVote | null>(
      (plusRecent, candidat) =>
        candidat &&
        (!plusRecent ||
          candidat.scrutinDecisif.numero > plusRecent.scrutinDecisif.numero)
          ? candidat
          : plusRecent,
      null
    );
  };
}
