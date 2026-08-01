import type { FicheScrutin, FicheScrutinEffetAttendu } from "@/domain/scrutin";

// Fiche Contexte / Action / Résultat propre à un scrutin (cf. FicheDossier)
// — deux formes possibles pour le troisième volet : "Résultat" (issue déjà
// connue du vote, cas générique) ou "Résultat attendu" (effet visé par le
// contenu réel d'un amendement, quand disponible — cf.
// genererFicheScrutinEnrichie et FicheScrutinEffetAttendu, issue #46).
// Jamais les deux à la fois : le champ présent sur `fiche` détermine quel
// libellé afficher.
export function ScrutinBrief({
  fiche,
}: {
  fiche: FicheScrutin | FicheScrutinEffetAttendu;
}) {
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
        {"resultatAttendu" in fiche ? (
          <>
            <span className="brief-label">Résultat attendu</span>
            {fiche.resultatAttendu}
          </>
        ) : (
          <>
            <span className="brief-label">Résultat</span>
            {fiche.resultat}
          </>
        )}
      </div>
    </div>
  );
}
