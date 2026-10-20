"use client";

import Link from "next/link";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { FicheDossier } from "@/app/_components/FicheDossier";
import { ResultatBadge } from "@/app/_components/ResultatBadge";
import { AvecFiltrePeriode, type EtatFiltrePeriode } from "@/app/_components/AvecFiltrePeriode";
import { SelecteurPeriode } from "@/app/_components/SelecteurPeriode";
import type { DossierAvecPosition } from "@/api/listerDossiersSousTheme";
import { correspondAuFiltre } from "@/domain/filtreDate";

// Liste de dossiers d'un sous-thème (cf. page sous-thème), filtrable par
// période (Année, éventuellement Mois — cf. domain/filtreDate.ts, issue
// #151). Composant client : le filtre s'applique instantanément sur les
// dossiers déjà chargés par le Server Component parent, sans aller-retour
// réseau (le site reste par ailleurs entièrement statique). La période
// vient de l'URL (cf. AvecFiltrePeriode) et suit les liens vers les pages
// Dossier et Scrutin.
export function DossierListeFiltrable({
  dossiers,
}: {
  dossiers: DossierAvecPosition[];
}) {
  return (
    <AvecFiltrePeriode>
      {(etat) => <ListeDossiers dossiers={dossiers} {...etat} />}
    </AvecFiltrePeriode>
  );
}

function ListeDossiers({
  dossiers,
  filtre,
  onChange,
  suffixeLiens,
}: { dossiers: DossierAvecPosition[] } & EtatFiltrePeriode) {

  const dossiersAffiches = dossiers.filter((d) =>
    correspondAuFiltre(d.datesScrutins, filtre)
  );

  return (
    <>
      <SelecteurPeriode
        datesParEntree={dossiers.map((d) => d.datesScrutins)}
        filtre={filtre}
        onChange={onChange}
      />

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
              ? `/scrutin/${scrutinDecisifUnique}${suffixeLiens}`
              : `/dossier/${dossier.dossierRef}${suffixeLiens}`;
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
