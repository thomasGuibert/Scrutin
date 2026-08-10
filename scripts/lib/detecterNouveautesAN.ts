// Logique pure de détection des nouveautés et des cas de doute du pipeline
// quotidien AN (cf. issue #126, points 3 et 7) — séparée du script CLI
// (scripts/detecter-nouveautes-an.ts) pour rester testable sans dépendre du
// système de fichiers ni de git.

import AdmZip from "adm-zip";

export type ComparaisonArchives = {
  nouvelles: string[];
  modifiees: string[];
};

function listerFichiers(zip: AdmZip): Map<string, Buffer> {
  const entrees = new Map<string, Buffer>();
  for (const entry of zip.getEntries()) {
    if (!entry.isDirectory) {
      entrees.set(entry.entryName, entry.getData());
    }
  }
  return entrees;
}

// Compare deux versions d'une même archive (ex. Scrutins.json.zip encore sur
// HEAD vs. celui qui vient d'être retéléchargé) entrée par entrée — un ajout
// ou un changement de contenu signale un scrutin/dossier nouveau ou modifié
// depuis le dernier run (#126, point 3 : comparaison par uid/dossierRef via
// le nom du fichier json/<uid>.json, jamais un diff brut de l'archive
// entière, qui serait toujours "différent" au moindre horodatage interne).
export function comparerArchives(
  ancienneVersion: Buffer | null,
  nouvelleVersion: Buffer
): ComparaisonArchives {
  const ancien = ancienneVersion ? listerFichiers(new AdmZip(ancienneVersion)) : new Map();
  const nouveau = listerFichiers(new AdmZip(nouvelleVersion));

  const nouvelles: string[] = [];
  const modifiees: string[] = [];

  for (const [nomEntree, contenu] of nouveau) {
    const ancienContenu = ancien.get(nomEntree);
    if (!ancienContenu) {
      nouvelles.push(nomEntree);
    } else if (!ancienContenu.equals(contenu)) {
      modifiees.push(nomEntree);
    }
  }

  return { nouvelles, modifiees };
}

export type RaisonDeDoute =
  | "dossierRef-absent"
  | "plf-plfss"
  | "vote-de-conscience"
  | "sous-theme-incertain";

// Libellés de procédure parlementaire (dossierParlementaire.procedureParlementaire.libelle
// dans Dossiers_Legislatifs.json.zip) identifiant sans ambiguïté un PLF/PLFSS
// — vérifié sur les 3028 dossiers de la 17e législature (2026-08-10) :
// couvre aussi bien le PLF/PLFSS "de l'année" que ses rectificatives (dont
// les "lois de finances de fin de gestion", qui portent ce même libellé) et
// les lois de règlement. Détecté sur ce champ structuré plutôt que sur le
// titre : plus fiable qu'une regex sur un texte libre (#126, point 4 —
// exclusion PLF/PLFSS de l'enrichissement narratif, cf. #130).
const LIBELLES_PROCEDURE_PLF_PLFSS = new Set([
  "Projet de loi de finances de l'année",
  "Projet de loi de finances rectificative",
  "Projet de loi de financement de la sécurité sociale",
  "Projet de loi relative aux résultats de la gestion et portant approbation des comptes",
]);

export function estPlfOuPlfss(libelleProcedure: string | null): boolean {
  return libelleProcedure !== null && LIBELLES_PROCEDURE_PLF_PLFSS.has(libelleProcedure);
}

// Dossiers connus comme "votes de conscience" (liberté de vote au sein des
// groupes) — pas détectable depuis le titre ou la procédure AN, donc liste
// tenue à la main comme DOSSIER_REF_OVERRIDE
// (src/spi/filesystem/dossierRefOverride.ts). Amorcée avec le seul cas
// rencontré à ce jour (cf. scripts/extraire-explications-vote.ts,
// ALIAS_TITRE_DOSSIER) ; à compléter au fil des runs quotidiens qui en
// détectent de nouveaux (#126, point 7 — la PR de doute sert justement à
// confirmer/étendre cette liste, pas à automatiser sa détection).
export const DOSSIERS_VOTE_DE_CONSCIENCE = new Set<string>([
  "DLR5L17N51670", // Fin de vie / Droit à l'aide à mourir
]);

export function estVoteDeConscience(dossierRef: string | null): boolean {
  return dossierRef !== null && DOSSIERS_VOTE_DE_CONSCIENCE.has(dossierRef);
}

export type CandidatDoute = {
  dossierRef: string | null;
  libelleProcedure: string | null;
};

// Les 3 déclencheurs de doute (#126, point 7) qui se prêtent à une
// évaluation automatique à partir de la seule donnée brute — le 4e
// ("nouveau dossier ne correspondant clairement à aucun sous-thème
// existant") exige un jugement de classification thématique que seule la
// session de curation peut porter ; il n'est donc jamais renvoyé ici et
// reste à la charge du runbook (docs/agents/pipeline-quotidien-an.md).
export function raisonsDeDoute(candidat: CandidatDoute): RaisonDeDoute[] {
  const raisons: RaisonDeDoute[] = [];

  if (candidat.dossierRef === null) {
    raisons.push("dossierRef-absent");
  }
  if (estPlfOuPlfss(candidat.libelleProcedure)) {
    raisons.push("plf-plfss");
  }
  if (estVoteDeConscience(candidat.dossierRef)) {
    raisons.push("vote-de-conscience");
  }

  return raisons;
}
