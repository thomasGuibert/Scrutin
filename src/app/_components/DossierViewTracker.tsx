"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

// Marque, côté visiteur réel, qu'un dossier législatif a été atteint —
// l'événement mesurable derrière l'objectif SMART de projet-votes-assemblee-
// nationale.md ("50% des visiteurs uniques descendent jusqu'au niveau
// dossier"). Doit rester un Client Component déclenché au montage : la page
// dossier est générée statiquement (generateStaticParams), donc un appel
// serveur se produirait au build, pas à chaque visite réelle.
export function DossierViewTracker({ dossierRef }: { dossierRef: string }) {
  useEffect(() => {
    track("dossier_view", { dossierRef });
  }, [dossierRef]);

  return null;
}
