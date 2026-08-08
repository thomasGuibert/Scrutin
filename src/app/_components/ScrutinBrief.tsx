import Link from "next/link";
import { ExplicationsVoteTable } from "@/app/_components/ExplicationsVoteTable";
import type {
  FicheScrutin,
  FicheScrutinEffetAttendu,
  FicheScrutinExplicationsVote,
  FicheScrutinPasDeDonnees,
} from "@/domain/scrutin";

// Fiche Contexte / Action / Résultat propre à un scrutin (cf. FicheDossier)
// — quatre formes possibles :
// - "Résultat" + Contexte/Action en texte : cas générique.
// - "Résultat attendu" (seul, sans tableau) : effet visé par le contenu
//   réel d'un amendement (genererFicheScrutinEnrichie, issue #46).
// - "dossierRef" : pas de donnée propre à ce scrutin — état explicite avec
//   lien vers la Fiche du dossier, plutôt qu'une copie de son contenu
//   (issue #84).
// - "explicationsParGroupe" : Explications de vote curées (issue #57) —
//   Contexte/Action/Résultat attendu de la Fiche dossier, PLUS le tableau
//   des positions inséré juste après (issue #85, ADR-0003 : les deux
//   variantes se combinent, elles ne s'excluent plus), puis le Résultat
//   réel du scrutin en dernier.
export function ScrutinBrief({
  fiche,
}: {
  fiche:
    | FicheScrutin
    | FicheScrutinPasDeDonnees
    | FicheScrutinEffetAttendu
    | FicheScrutinExplicationsVote;
}) {
  if ("dossierRef" in fiche) {
    return (
      <div className="dossier-brief">
        <p className="branch-placeholder brief-pas-de-donnees">
          {fiche.message} Consultez la{" "}
          <Link href={`/dossier/${fiche.dossierRef}`}>
            fiche du dossier « {fiche.dossierTitre} »
          </Link>
          .
        </p>
        <div className="brief-resultat">
          <span className="brief-label">Résultat</span>
          {fiche.resultat}
        </div>
      </div>
    );
  }

  if ("explicationsParGroupe" in fiche) {
    return (
      <div className="dossier-brief brief-block">
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
        <ExplicationsVoteTable explicationsParGroupe={fiche.explicationsParGroupe} />
        <div className="brief-resultat">
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
