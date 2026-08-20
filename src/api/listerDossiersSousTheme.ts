import type { ComparaisonGroupe } from "@/api/comparerGroupes";
import type { Dossier, DossierRepository } from "@/domain/dossier";
import {
  determinerResultatDossier,
  formaterPeriodeDossier,
  scrutinsDecisifs,
  type ResultatScrutin,
  type Scrutin,
} from "@/domain/scrutin";

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
  // Nombre de Scrutins décisifs (cf. domain/scrutin.ts), pas le nombre brut
  // de scrutins du dossier — celui-ci compte aussi les votes d'amendement et
  // d'article, potentiellement des centaines sur un texte disputé, sans
  // rapport avec le nombre de lectures qui ont réellement tranché son sort.
  nombreLectures: number;
  // uid du Scrutin décisif unique du dossier quand nombreLectures === 1 —
  // permet de lier directement dessus depuis la liste de dossiers plutôt que
  // de repasser par la page Dossier, qui n'apporterait alors aucune
  // information supplémentaire (même Fiche dossier, même Position par
  // groupe, un seul scrutin à choisir). null dès qu'il y a plusieurs
  // lectures à départager (page Dossier nécessaire) ou aucune (dossier
  // encore en cours d'examen).
  scrutinDecisifUnique: string | null;
  resultat: ResultatScrutin | null;
  // Étendue temporelle du dossier (cf. formaterPeriodeDossier), du premier
  // au dernier de ses scrutins — ce que la liste peut afficher tant que le
  // dossier n'a pas encore de Scrutin décisif à date unique (nombreLectures
  // === 0), et une information complémentaire une fois qu'il en a un.
  periode: string | null;
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

    const dossiersAvecScrutins = await Promise.all(
      entrees.map(async ({ dossier, viaTag }) => {
        const [comparaison, scrutins] = await Promise.all([
          agregerPositionsDossiers([dossier.dossierRef]),
          listerScrutinsDossier(dossier.dossierRef),
        ]);
        return { dossier, viaTag, comparaison, scrutins };
      })
    );

    // Un dossier sans scrutin n'a encore aucun vote décisif à afficher (cf.
    // CONTEXT.md, Dossier législatif) — en v1, il n'apparaît pas sur le site.
    return dossiersAvecScrutins
      .filter(({ scrutins }) => scrutins.length > 0)
      .map(({ dossier, viaTag, comparaison, scrutins }) => {
        const decisifs = scrutinsDecisifs(scrutins);
        return {
          dossier,
          viaTag,
          comparaison,
          nombreLectures: decisifs.length,
          scrutinDecisifUnique: decisifs.length === 1 ? decisifs[0].uid : null,
          resultat: determinerResultatDossier(scrutins),
          periode: formaterPeriodeDossier(scrutins),
        };
      });
  };
}
