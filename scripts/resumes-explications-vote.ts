// Étape 4quater du pipeline quotidien (docs/agents/pipeline-quotidien-an.md) :
// liste les Explications de vote sans résumé, puis applique les résumés
// rédigés par la session — cf. scripts/lib/resumesExplicationsVote.ts.
//
// Usage :
//   npm run an:resumes -- --manquants            (JSON sur stdout)
//   npm run an:resumes -- <resumes.json>         ([{ dossierRef, scrutin, groupe, resume }])

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  appliquerResumes,
  listerResumesManquants,
  type ResumeRedige,
} from "./lib/resumesExplicationsVote.ts";

const ARCHIVE = path.join(
  process.cwd(),
  "data/raw/an/17/ExplicationsVote-dossiers-classifies.json.zip"
);

function main() {
  const argument = process.argv[2];
  if (!argument) {
    console.error("Usage : npm run an:resumes -- --manquants | <resumes.json>");
    process.exit(1);
  }

  const archive = readFileSync(ARCHIVE);

  if (argument === "--manquants") {
    console.log(JSON.stringify(listerResumesManquants(archive), null, 2));
    return;
  }

  const resumes = JSON.parse(readFileSync(argument, "utf-8")) as ResumeRedige[];
  writeFileSync(ARCHIVE, appliquerResumes(archive, resumes));
  console.log(`${resumes.length} résumé(s) appliqué(s) à ${ARCHIVE}`);
  console.log(`Encore sans résumé : ${listerResumesManquants(readFileSync(ARCHIVE)).length}`);
}

main();
