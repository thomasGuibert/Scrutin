import { ExplicationsVoteTable } from "@/app/_components/ExplicationsVoteTable";
import type {
  FicheScrutin,
  FicheScrutinEffetAttendu,
  FicheScrutinExplicationsVote,
} from "@/domain/scrutin";

// Fiche Contexte / Action / Résultat propre à un scrutin (cf. FicheDossier)
// — trois formes possibles, jamais combinées : le champ présent sur `fiche`
// détermine laquelle afficher.
// - "Résultat" + Contexte/Action en texte : cas générique.
// - "Résultat attendu" : effet visé par le contenu réel d'un amendement
//   (genererFicheScrutinEnrichie, issue #46).
// - "explicationsParGroupe" : Explications de vote curées (issue #57),
//   affichées en tableau plutôt qu'en texte (issue #59) — pas de champ
//   Action séparé, la phrase de tête (contexteIntro) en tient lieu.
export function ScrutinBrief({
  fiche,
}: {
  fiche: FicheScrutin | FicheScrutinEffetAttendu | FicheScrutinExplicationsVote;
}) {
  if ("explicationsParGroupe" in fiche) {
    return (
      <div className="brief-block">
        <span className="brief-label">Contexte</span>
        <p className="brief-lead">{fiche.contexteIntro}</p>
        <ExplicationsVoteTable explicationsParGroupe={fiche.explicationsParGroupe} />
        <div className="dossier-brief brief-resultat">
          <span className="brief-label">Résultat</span>
          {fiche.resultat}
        </div>
      </div>
    );
  }

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
