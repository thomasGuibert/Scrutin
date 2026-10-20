"use client";

import Link from "next/link";
import { AvecFiltrePeriode, type EtatFiltrePeriode } from "@/app/_components/AvecFiltrePeriode";
import { SelecteurPeriode } from "@/app/_components/SelecteurPeriode";
import type { ThemeAvecCompte } from "@/api/listerThemesTries";
import { correspondAuFiltre } from "@/domain/filtreDate";

// Grille des thèmes de l'accueil, filtrable par période (Année,
// éventuellement Mois — cf. domain/filtreDate.ts) : un thème reste affiché
// dès qu'un seul de ses scrutins tombe dans la période. La période choisie
// suit les liens vers les pages Thème (cf. AvecFiltrePeriode).
export function ThemeGrilleFiltrable({ themes }: { themes: ThemeAvecCompte[] }) {
  return (
    <AvecFiltrePeriode>
      {(etat) => <GrilleThemes themes={themes} {...etat} />}
    </AvecFiltrePeriode>
  );
}

function GrilleThemes({
  themes,
  filtre,
  onChange,
  suffixeLiens,
}: { themes: ThemeAvecCompte[] } & EtatFiltrePeriode) {
  const themesAffiches = themes.filter((entree) =>
    correspondAuFiltre(entree.datesScrutins, filtre)
  );

  return (
    <>
      <SelecteurPeriode
        datesParEntree={themes.map((entree) => entree.datesScrutins)}
        filtre={filtre}
        onChange={onChange}
      />

      {themesAffiches.length === 0 && (
        <p className="dossier-note">Aucun thème pour cette période.</p>
      )}

      <div className="a-grid">
        {themesAffiches.map(({ theme, nombreDossiers }, index) => (
          <Link
            key={theme.slug}
            href={`/theme/${theme.slug}${suffixeLiens}`}
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
    </>
  );
}
