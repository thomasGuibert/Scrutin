import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { Dossier, DossierRepository } from "@/domain/dossier";
import { determinerResultatDossier, type ResultatScrutin, type Scrutin } from "@/domain/scrutin";

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
  nombreScrutins: number;
  resultat: ResultatScrutin | null;
};

export function createListerDossiersSousTheme(
  dossierRepository: DossierRepository,
  agregerPositionsDossiers: (
    dossierRefs: string[]
  ) => Promise<ComparaisonGroupe[]>,
  listerScrutinsDossier: (dossierRef: string) => Promise<Scrutin[]>
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
      entrees.map(async ({ dossier, viaTag }) => {
        const [comparaison, scrutins] = await Promise.all([
          agregerPositionsDossiers([dossier.dossierRef]),
          listerScrutinsDossier(dossier.dossierRef),
        ]);
        return {
          dossier,
          viaTag,
          comparaison,
          nombreScrutins: scrutins.length,
          resultat: determinerResultatDossier(scrutins),
        };
      })
    );
  };
}
