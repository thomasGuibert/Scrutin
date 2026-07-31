import type { FicheDossier as TypeFicheDossier } from "@/domain/dossier";

// Résumé Contexte / Action / Résultat attendu d'un dossier (cf. CONTEXT.md).
// Pour la fiche propre à un scrutin, voir ScrutinBrief.
export function FicheDossier({ fiche }: { fiche: TypeFicheDossier }) {
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
        <span className="brief-label">Résultat attendu</span>
        {fiche.resultatAttendu}
      </div>
    </div>
  );
}
