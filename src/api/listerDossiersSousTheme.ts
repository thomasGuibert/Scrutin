import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { Dossier, DossierRepository } from "@/domain/dossier";

export type DossierAvecPosition = {
  dossier: Dossier;
  comparaison: ComparaisonGroupe[];
};

export function createListerDossiersSousTheme(
  dossierRepository: DossierRepository,
  agregerPositionsDossier: (dossierRef: string) => Promise<ComparaisonGroupe[]>
) {
  return async function listerDossiersSousTheme(
    slug: string
  ): Promise<DossierAvecPosition[]> {
    const dossiers = await dossierRepository.getBySousTheme(slug);

    return Promise.all(
      dossiers.map(async (dossier) => ({
        dossier,
        comparaison: await agregerPositionsDossier(dossier.dossierRef),
      }))
    );
  };
}
