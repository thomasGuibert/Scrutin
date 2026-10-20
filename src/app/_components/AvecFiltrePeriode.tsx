"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  AUCUN_FILTRE,
  filtreDepuisParametres,
  parametresDuFiltre,
  type FiltrePeriode,
} from "@/domain/filtreDate";

export type EtatFiltrePeriode = {
  filtre: FiltrePeriode;
  onChange: (filtre: FiltrePeriode) => void;
  // Chaîne de requête à ajouter aux liens vers les pages suivantes pour
  // qu'elles s'ouvrent sur la même période (cf. parametresDuFiltre).
  suffixeLiens: string;
};

// Le filtre par période d'une page vit dans son URL plutôt que dans un état
// local : il suit ainsi la navigation vers les pages suivantes (accueil →
// thème → branche → sous-thème) et survit au retour arrière. Le Suspense
// est exigé par useSearchParams sur une page générée statiquement ; son
// fallback rend la liste sans filtre, pour que le HTML statique reste
// complet avant hydratation.
export function AvecFiltrePeriode({
  children,
}: {
  children: (etat: EtatFiltrePeriode) => ReactNode;
}) {
  return (
    <Suspense
      fallback={children({ filtre: AUCUN_FILTRE, onChange: () => {}, suffixeLiens: "" })}
    >
      <FiltreDepuisUrl>{children}</FiltreDepuisUrl>
    </Suspense>
  );
}

function FiltreDepuisUrl({
  children,
}: {
  children: (etat: EtatFiltrePeriode) => ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const filtre = filtreDepuisParametres(useSearchParams());
  const suffixeLiens = parametresDuFiltre(filtre);

  return children({
    filtre,
    onChange: (nouveau) =>
      router.replace(`${pathname}${parametresDuFiltre(nouveau)}`, { scroll: false }),
    suffixeLiens,
  });
}
