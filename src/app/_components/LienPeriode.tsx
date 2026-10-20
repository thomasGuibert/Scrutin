"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentProps } from "react";
import { filtreDepuisParametres, parametresDuFiltre } from "@/domain/filtreDate";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// Lien interne qui garde la période du filtre par date présente dans l'URL
// courante (cf. AvecFiltrePeriode) : fil d'ariane, liens "Retour" et liens
// des pages Dossier/Scrutin, pour que la période choisie suive toute la
// navigation, y compris en remontant l'arbre. Sans période dans l'URL (ou
// avant hydratation, via le fallback), c'est un lien ordinaire.
export function LienPeriode(props: Props) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <LienAvecPeriode {...props} />
    </Suspense>
  );
}

function LienAvecPeriode({ href, ...props }: Props) {
  const suffixe = parametresDuFiltre(filtreDepuisParametres(useSearchParams()));
  return <Link {...props} href={`${href}${suffixe}`} />;
}
