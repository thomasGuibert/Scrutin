"use client";

// PROTOTYPE — jetable. Barre flottante de bascule entre variantes d'une
// page en cours de maquettage, pilotée par ?variant= dans l'URL. À
// supprimer avec les variantes une fois un choix arrêté (cf. skill
// "prototype" du dépôt, sous-shape A : la page d'accueil existante,
// `src/app/page.tsx`, teste ici un habillage de l'accroche "exemple").
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export type PrototypeVariant = {
  key: string;
  label: string;
};

export function PrototypeSwitcher({
  variants,
  current,
  basePath,
}: {
  variants: PrototypeVariant[];
  current: string;
  basePath: string;
}) {
  const router = useRouter();

  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current)
  );

  const aller = useCallback(
    (nouvelIndex: number) => {
      const cible = variants[(nouvelIndex + variants.length) % variants.length];
      router.replace(`${basePath}?variant=${cible.key}`);
    },
    [router, variants, basePath]
  );

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null;
      if (
        cible &&
        (cible.tagName === "INPUT" ||
          cible.tagName === "TEXTAREA" ||
          cible.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") aller(index - 1);
      if (e.key === "ArrowRight") aller(index + 1);
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [aller, index]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const courante = variants[index];

  return (
    <div className="proto-switcher">
      <button
        type="button"
        onClick={() => aller(index - 1)}
        aria-label="Variante précédente"
      >
        ←
      </button>
      <span className="proto-switcher-label">
        {courante.key} — {courante.label}
      </span>
      <button
        type="button"
        onClick={() => aller(index + 1)}
        aria-label="Variante suivante"
      >
        →
      </button>
    </div>
  );
}
