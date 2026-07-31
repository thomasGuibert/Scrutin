import type { ResultatScrutin } from "@/domain/scrutin";

const LIBELLE: Record<ResultatScrutin, string> = {
  adopté: "Adopté",
  rejeté: "Rejeté",
};

const CLASSE: Record<ResultatScrutin, string> = {
  adopté: "resultat-adopte",
  rejeté: "resultat-rejete",
};

// Badge Adopté/Rejeté, réutilisé au format "tag" (en-tête de nœud, bordé,
// à côté de .dossier-tag) et au format "value" (dans une grille de décompte,
// à côté de Votants/Pour/Contre/Abstentions).
export function ResultatBadge({
  resultat,
  variant = "tag",
}: {
  resultat: ResultatScrutin;
  variant?: "tag" | "value";
}) {
  const classeBase = variant === "tag" ? "dossier-tag resultat-tag" : "decompte-value";
  return (
    <span className={`${classeBase} ${CLASSE[resultat]}`}>
      {LIBELLE[resultat]}
    </span>
  );
}
