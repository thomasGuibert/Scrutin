import { AccrocheExemple, type ExempleAccroche } from "@/app/_components/AccrocheExemple";
import { ThemeGrilleFiltrable } from "@/app/_components/ThemeGrilleFiltrable";
import {
  comparerGroupes,
  listerThemesTries,
  trouverDernierDossierVote,
} from "@/app/_composition";
import {
  calculerEffectifTotal,
  calculerVotants,
  determinerResultatDossier,
} from "@/domain/scrutin";

// Dossier mis en avant en accroche (cf. AccrocheExemple) : le dernier
// dossier curé dont le Scrutin décisif a eu lieu (cf.
// trouverDernierDossierVote), recalculé à chaque build — donc à chaque
// passage du pipeline quotidien qui publie de nouvelles données.
export default async function Home() {
  const themes = await listerThemesTries();
  const dernier = await trouverDernierDossierVote();

  const exemple: ExempleAccroche | null = dernier && {
    titre: dernier.dossier.titre,
    href: `/dossier/${dernier.dossier.dossierRef}`,
    description: dernier.dossier.ficheDossier.contexte,
    comparaison: comparerGroupes(dernier.scrutinDecisif),
    resultat: determinerResultatDossier(dernier.scrutins) ?? dernier.scrutinDecisif.resultat,
    votants: calculerVotants(dernier.scrutinDecisif.decompte),
    effectifTotal: calculerEffectifTotal(dernier.scrutinDecisif.positionsParGroupe),
  };

  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">
        Consultez les votes réels de l&apos;Assemblée nationale, classés par
        thème : comparez ce que les groupes parlementaires ont concrètement
        voté, dossier par dossier, au-delà de leurs discours.
      </p>

      {exemple && <AccrocheExemple exemple={exemple} />}

      <ThemeGrilleFiltrable themes={themes} />
    </main>
  );
}
