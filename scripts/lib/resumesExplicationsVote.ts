// Résumés (`resume`) des Explications de vote rédigés par le pipeline
// quotidien (Étape 4quater, docs/agents/pipeline-quotidien-an.md) : tant
// qu'un seul groupe d'un scrutin n'a pas de résumé, la Fiche Scrutin
// n'affiche pas le tableau par groupe (explicationsVoteCurees). Le texte
// des résumés est rédigé par la session du pipeline ; ce module ne fait que
// lister ce qui manque et l'appliquer à l'archive, sans jamais remplacer un
// résumé existant (curation manuelle, #57).

import AdmZip from "adm-zip";

type Intervention = {
  groupe: string;
  orateur: string;
  texte: string;
  resume?: string;
};

type ContenuDossier = {
  dossierRef: string;
  scrutins: Record<string, Intervention[]>;
};

export type ResumeManquant = {
  dossierRef: string;
  scrutin: string;
  groupe: string;
  orateur: string;
  texte: string;
};

export type ResumeRedige = {
  dossierRef: string;
  scrutin: string;
  groupe: string;
  resume: string;
};

function lireDossiers(zip: AdmZip): Array<{ entryName: string; contenu: ContenuDossier }> {
  return zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && entry.entryName.endsWith(".json"))
    .map((entry) => ({
      entryName: entry.entryName,
      contenu: JSON.parse(entry.getData().toString("utf-8")) as ContenuDossier,
    }));
}

export function listerResumesManquants(archive: Buffer): ResumeManquant[] {
  const manquants: ResumeManquant[] = [];
  for (const { contenu } of lireDossiers(new AdmZip(archive))) {
    for (const [scrutin, interventions] of Object.entries(contenu.scrutins)) {
      for (const { groupe, orateur, texte, resume } of interventions) {
        if (!resume) {
          manquants.push({ dossierRef: contenu.dossierRef, scrutin, groupe, orateur, texte });
        }
      }
    }
  }
  return manquants;
}

// Renvoie l'archive avec les résumés appliqués. Échoue (sans rien écrire)
// si un résumé vise une intervention introuvable ou déjà résumée : mieux
// vaut un run en doute qu'un résumé posé sur le mauvais groupe.
export function appliquerResumes(archive: Buffer, resumes: ResumeRedige[]): Buffer {
  const zip = new AdmZip(archive);
  const dossiers = new Map(
    lireDossiers(zip).map((dossier) => [dossier.contenu.dossierRef, dossier])
  );
  const modifies = new Set<string>();

  for (const { dossierRef, scrutin, groupe, resume } of resumes) {
    const dossier = dossiers.get(dossierRef);
    const intervention = dossier?.contenu.scrutins[scrutin]?.find(
      (candidate) => candidate.groupe === groupe
    );
    if (!dossier || !intervention) {
      throw new Error(`Intervention introuvable : ${dossierRef} ${scrutin} ${groupe}`);
    }
    if (intervention.resume) {
      throw new Error(`Résumé déjà présent : ${dossierRef} ${scrutin} ${groupe}`);
    }
    if (!resume.trim()) {
      throw new Error(`Résumé vide : ${dossierRef} ${scrutin} ${groupe}`);
    }
    intervention.resume = resume.trim();
    modifies.add(dossierRef);
  }

  for (const dossierRef of modifies) {
    const { entryName, contenu } = dossiers.get(dossierRef)!;
    zip.updateFile(entryName, Buffer.from(JSON.stringify(contenu, null, 2), "utf-8"));
  }
  return zip.toBuffer();
}
