"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import type { DossierAvecPosition } from "@/api/listerDossiersSousTheme";
import {
  AUCUN_FILTRE,
  anneesDisponibles,
  correspondAuFiltre,
  moisDisponibles,
  type FiltrePeriode,
} from "@/domain/filtreDate";

const NOMS_MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Liste de dossiers d'un sous-thème (cf. page sous-thème), filtrable par
// période (Année, éventuellement Mois — cf. domain/filtreDate.ts, issue
// #151). Composant client : le filtre s'applique instantanément sur les
// dossiers déjà chargés par le Server Component parent, sans aller-retour
// réseau (le site reste par ailleurs entièrement statique).
export function DossierListeFiltrable({
  dossiers,
}: {
  dossiers: DossierAvecPosition[];
}) {
  const [filtre, setFiltre] = useState<FiltrePeriode>(AUCUN_FILTRE);

  const toutesLesDates = useMemo(
    () => dossiers.map((d) => d.datesScrutins),
    [dossiers]
  );
  const annees = useMemo(
    () => anneesDisponibles(toutesLesDates),
    [toutesLesDates]
  );
  const mois = useMemo(
    () =>
      filtre.annee === null
        ? []
        : moisDisponibles(toutesLesDates, filtre.annee),
    [toutesLesDates, filtre.annee]
  );

  const dossiersAffiches = dossiers.filter((d) =>
    correspondAuFiltre(d.datesScrutins, filtre)
  );

  return (
    <>
      {annees.length > 0 && (
        <div className="date-filter">
          <label className="date-filter-field">
            <span className="date-filter-label">Année</span>
            <select
              value={filtre.annee ?? ""}
              onChange={(evenement) => {
                const valeur = evenement.target.value;
                setFiltre(
                  valeur === ""
                    ? AUCUN_FILTRE
                    : { annee: Number(valeur), mois: null }
                );
              }}
            >
              <option value="">Toutes</option>
              {annees.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </label>

          <label className="date-filter-field">
            <span className="date-filter-label">Mois</span>
            <select
              value={filtre.mois ?? ""}
              disabled={filtre.annee === null}
              onChange={(evenement) => {
                const valeur = evenement.target.value;
                setFiltre((precedent) => ({
                  ...precedent,
                  mois: valeur === "" ? null : Number(valeur),
                }));
              }}
            >
              <option value="">Tous</option>
              {mois.map((numeroMois) => (
                <option key={numeroMois} value={numeroMois}>
                  {NOMS_MOIS[numeroMois - 1]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="dossier-list">
        {dossiersAffiches.length === 0 && (
          <p className="dossier-note">Aucun dossier pour cette période.</p>
        )}
        {dossiersAffiches.map(
          ({
            dossier,
            comparaison,
            viaTag,
            nombreLectures,
            scrutinDecisifUnique,
            resultat,
            periode,
          }) => {
            // Un seul Scrutin décisif : lien direct dessus, la page Dossier
            // n'apporterait aucune information supplémentaire (même Fiche
            // dossier, même Position par groupe, déjà affichées ici) — cf.
            // issue #82. Sinon (plusieurs lectures à départager, ou dossier
            // encore en cours d'examen sans aucun Scrutin décisif), la page
            // Dossier reste nécessaire.
            //
            // Vocabulaire aligné sur l'étiquette "Scrutin" déjà utilisée sur
            // la page Dossier (jamais "lecture" comme libellé d'interface,
            // seulement dans le texte brut des titres de scrutin) — les 3
            // formes commencent par "scrutin(s)" pour rester lisibles en
            // balayant la liste.
            const href = scrutinDecisifUnique
              ? `/scrutin/${scrutinDecisifUnique}`
              : `/dossier/${dossier.dossierRef}`;
            const libelle =
              nombreLectures === 0
                ? "Scrutins en cours"
                : nombreLectures === 1
                  ? "1 scrutin"
                  : `${nombreLectures} scrutins`;

            return (
              <div className="dossier-row" key={dossier.dossierRef}>
                <Link className="dossier-header" href={href}>
                  <span className="dossier-tags">
                    <span className="dossier-tag">{viaTag ?? "Dossier"}</span>
                    {resultat && <ResultatBadge resultat={resultat} />}
                  </span>
                  <span className="dossier-title">{dossier.titre}</span>
                  <span className="dossier-count">{libelle} →</span>
                </Link>
                {periode && <p className="node-date">{periode}</p>}
                <FicheDossier fiche={dossier.ficheDossier} />
                <ComparaisonGroupes titre="Position par groupe" comparaison={comparaison} />
              </div>
            );
          }
        )}
      </div>
    </>
  );
}
