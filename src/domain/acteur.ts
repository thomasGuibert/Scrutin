// Retrouve le Groupe parlementaire d'un·e député·e à une date donnée —
// nécessaire pour attribuer un groupe aux interventions de Discussion
// générale (issue #87, ADR-0003), qui ne portent pas le sigle entre
// parenthèses dans le texte contrairement aux Explications de vote
// (cf. domain/compteRendu.ts).
//
// "À une date donnée", pas "le groupe actuel" : la composition des groupes
// change en cours de législature (ex. création de l'UDR fin 2024) — un·e
// même député·e peut avoir appartenu à des groupes différents à des
// moments différents.
export interface ActeurGroupeRepository {
  // Sigle du groupe parlementaire (ex. "RN", cf. domain/groupes.ts) auquel
  // l'acteur identifié par idActeur appartenait à dateISO — null si
  // l'acteur est inconnu du référentiel, ou n'avait aucun mandat de groupe
  // parlementaire actif à cette date (ex. ministre non-parlementaire,
  // ancien·ne député·e).
  groupeAuMoment(idActeur: string, dateISO: string): string | null;
}
