import type { FicheDossier as TypeFicheDossier } from "@/domain/dossier";

// Résumé Contexte / Action / Résultat attendu d'un dossier (cf. CONTEXT.md).
// Réutilisé tel quel sur la page dossier et sur la page scrutin, pour que le
// scrutin garde ce repère même quand on y arrive sans passer par son dossier.
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
