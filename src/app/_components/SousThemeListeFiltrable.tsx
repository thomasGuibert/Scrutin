"use client";

import { Fragment, useState } from "react";
import { SelecteurPeriode } from "@/app/_components/SelecteurPeriode";
import { SousThemeRow } from "@/app/_components/SousThemeRow";
import type { SousThemeAvecPosition } from "@/api/listerSousThemesAvecPosition";
import { AUCUN_FILTRE, correspondAuFiltre, type FiltrePeriode } from "@/domain/filtreDate";

// Un groupe de sous-thèmes tel qu'affiché par la page Branche (un seul
// groupe, sans titre : `titre: null`, le h1 de la page donne déjà le nom
// de la branche) ou par la page Thème (un groupe par branche, plus un
// dernier groupe `titre: null` pour les sous-thèmes directement sous le
// thème, hors de toute branche).
export type GroupeSousThemes = {
  titre: string | null;
  sousThemes: SousThemeAvecPosition[];
  // Affiche "branche pas encore descendue" quand ce groupe est vide dès le
  // départ (avant tout filtre) : vrai pour un groupe qui représente une
  // branche (avec ou sans titre affiché — la page Branche n'a pas besoin
  // de reprendre son propre nom en sous-titre), faux pour le groupe des
  // sous-thèmes "directs" d'un thème, où une liste vide est un état normal
  // (rien à signaler), pas un signe d'incomplétude des données.
  placeholderSiVide: boolean;
};

// Liste de sous-thèmes d'une branche ou d'un thème, filtrable par période
// (Année, éventuellement Mois — cf. domain/filtreDate.ts, issue #152) : le
// pendant, un niveau au-dessus, du filtre déjà en place sur la page
// sous-thème (issue #151). Un sous-thème reste affiché dès qu'un seul de
// ses dossiers a un scrutin dans la période choisie.
export function SousThemeListeFiltrable({
  groupes,
}: {
  groupes: GroupeSousThemes[];
}) {
  const [filtre, setFiltre] = useState<FiltrePeriode>(AUCUN_FILTRE);

  const groupesAffiches = groupes.map((groupe) => ({
    ...groupe,
    sousThemesAffiches: groupe.sousThemes.filter((entree) =>
      correspondAuFiltre(entree.datesScrutins, filtre)
    ),
  }));

  const filtreActif = filtre.annee !== null;
  const totalAffiche = groupesAffiches.reduce(
    (total, groupe) => total + groupe.sousThemesAffiches.length,
    0
  );

  return (
    <>
      <SelecteurPeriode
        datesParEntree={groupes.flatMap((groupe) =>
          groupe.sousThemes.map((entree) => entree.datesScrutins)
        )}
        filtre={filtre}
        onChange={setFiltre}
      />

      {groupesAffiches.map((groupe, index) => {
        const originellementVide = groupe.sousThemes.length === 0;
        // Groupe vide dès le départ mais qui ne signale pas une branche
        // incomplète (le groupe "direct" d'un thème) : rien à afficher,
        // jamais le placeholder "branche pas encore descendue" — une
        // liste directe vide est un état normal, pas un signal
        // d'incomplétude des données.
        if (originellementVide && !groupe.placeholderSiVide) {
          return null;
        }
        // Une branche qui a des sous-thèmes, mais dont aucun n'a de
        // scrutin dans la période choisie : la section entière (titre
        // compris) disparaît plutôt que de rester affichée vide.
        if (!originellementVide && groupe.sousThemesAffiches.length === 0) {
          return null;
        }

        const contenu = originellementVide ? (
          <p className="branch-placeholder">
            Détail des sous-thèmes pas encore fait — branche identifiée mais
            non descendue plus bas.
          </p>
        ) : (
          groupe.sousThemesAffiches.map((entree) => (
            <SousThemeRow key={entree.sousTheme.slug} {...entree} />
          ))
        );

        if (groupe.titre === null) {
          return <Fragment key={`direct-${index}`}>{contenu}</Fragment>;
        }

        return (
          <div className="branch-group" key={groupe.titre}>
            <p className="branch-title">{groupe.titre}</p>
            {contenu}
          </div>
        );
      })}

      {filtreActif && totalAffiche === 0 && (
        <p className="dossier-note">Aucun sous-thème pour cette période.</p>
      )}
    </>
  );
}
