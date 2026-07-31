import type { FicheScrutin } from "@/domain/scrutin";

// Fiche Contexte / Action / Résultat propre à un scrutin (cf. FicheDossier) —
// contrairement à celle-ci, le résultat décrit une issue déjà connue, pas un
// effet attendu.
export function ScrutinBrief({ fiche }: { fiche: FicheScrutin }) {
  return (
    <div className="dossier-brief">
      <div>
        <span className="brief-label">Contexte</span>
        {fiche.contexte}
      </div>
      <div>
        <span className="brief-label">Action</span>
        {fiche.action}
      </div>
      <div>
        <span className="brief-label">Résultat</span>
        {fiche.resultat}
      </div>
    </div>
  );
}
