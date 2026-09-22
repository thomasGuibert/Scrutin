import Link from "next/link";
import { AccrocheExemple, type ExempleAccroche } from "@/app/_components/AccrocheExemple";
import {
  comparerGroupes,
  getDossier,
  getScrutin,
  listerThemesTries,
} from "@/app/_composition";
import { calculerEffectifTotal, calculerVotants } from "@/domain/scrutin";

// Dossier mis en avant en accroche (cf. AccrocheExemple) : scrutin décisif
// voté dans le même sens par les 11 groupes parlementaires (56 pour,
// 0 contre) — choisi manuellement pour son sujet immédiatement lisible et
// son résultat vérifiable d'un coup d'œil. Fixe pour l'instant, pas de
// rotation (choisirait parmi les dossiers dont le scrutin décisif est
// unanime ou quasi — principe à formaliser le jour où une rotation réelle
// est construite).
const EXEMPLE_SCRUTIN_UID = "VTANR5L17V1725";
const EXEMPLE_DOSSIER_REF = "DLR5L17N50627";
const EXEMPLE_TITRE = "Lutter contre la pédocriminalité";

export default async function Home() {
  const themes = await listerThemesTries();
  const scrutin = await getScrutin(EXEMPLE_SCRUTIN_UID);
  const dossier = await getDossier(EXEMPLE_DOSSIER_REF);
  const comparaison = scrutin ? comparerGroupes(scrutin) : [];

  const exemple: ExempleAccroche = {
    titre: EXEMPLE_TITRE,
    href: `/dossier/${EXEMPLE_DOSSIER_REF}`,
    description: dossier?.ficheDossier.contexte ?? "",
    comparaison,
    resultat: scrutin?.resultat ?? "adopté",
    votants: scrutin ? calculerVotants(scrutin.decompte) : 0,
    effectifTotal: scrutin ? calculerEffectifTotal(scrutin.positionsParGroupe) : 0,
  };

  return (
    <main>
      <h1 className="page-title">Scrutins</h1>
      <p className="page-gloss">
        Consultez les votes réels de l&apos;Assemblée nationale, classés par
        thème : comparez ce que les groupes parlementaires ont concrètement
        voté, dossier par dossier, au-delà de leurs discours.
      </p>

      <AccrocheExemple exemple={exemple} />

      <div className="a-grid">
        {themes.map(({ theme, nombreDossiers }, index) => (
          <Link
            key={theme.slug}
            href={`/theme/${theme.slug}`}
            className={index === 0 ? "a-tile a-tile-feature" : "a-tile"}
          >
            <span className="a-tile-name">{theme.nom}</span>
            <span className="a-tile-gloss">{theme.description}</span>
            <span className="a-tile-arrow">
              {nombreDossiers} dossier{nombreDossiers > 1 ? "s" : ""} →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
