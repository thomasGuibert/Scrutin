import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { Dossier, DossierRepository } from "@/domain/dossier";

type DossierAffiche = {
  dossier: Dossier;
  // Le tag via lequel ce dossier apparaît ici, quand ce n'est pas son
  // sous-thème d'appartenance principal (cf. Tag d'impact, CONTEXT.md) : le
  // dossier garde un seul sous-thème d'appartenance (dossier.sousTheme),
  // seul son affichage se duplique.
  viaTag: string | null;
};

export type DossierAvecPosition = DossierAffiche & {
  comparaison: ComparaisonGroupe[];
};

export function createListerDossiersSousTheme(
  dossierRepository: DossierRepository,
  agregerPositionsDossiers: (
    dossierRefs: string[]
  ) => Promise<ComparaisonGroupe[]>
) {
  return async function listerDossiersSousTheme(
    slug: string
  ): Promise<DossierAvecPosition[]> {
    const dossiersPrincipaux = await dossierRepository.getBySousTheme(slug);

    const tags = new Set(dossiersPrincipaux.flatMap((d) => d.tagsImpact));
    const dossiersRecoupesParRef = new Map<string, { dossier: Dossier; tag: string }>();
    for (const tag of tags) {
      const autresDossiers = await dossierRepository.getByTagImpact(tag);
      for (const dossier of autresDossiers) {
        if (
          dossier.sousTheme !== slug &&
          !dossiersRecoupesParRef.has(dossier.dossierRef)
        ) {
          dossiersRecoupesParRef.set(dossier.dossierRef, { dossier, tag });
        }
      }
    }

    const entrees: DossierAffiche[] = [
      ...dossiersPrincipaux.map((dossier) => ({ dossier, viaTag: null })),
      ...[...dossiersRecoupesParRef.values()].map(({ dossier, tag }) => ({
        dossier,
        viaTag: tag,
      })),
    ];

    return Promise.all(
      entrees.map(async ({ dossier, viaTag }) => ({
        dossier,
        viaTag,
        comparaison: await agregerPositionsDossiers([dossier.dossierRef]),
      }))
    );
  };
}
