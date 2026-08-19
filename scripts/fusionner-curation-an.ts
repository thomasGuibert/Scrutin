// Régénère ExplicationsVote-dossiers-classifies.json.zip et
// DiscussionGenerale-dossiers-classifies.json.zip dans un répertoire à part,
// puis fusionne dans les archives commitées sans jamais écraser une entrée
// existante (cf. scripts/lib/fusionnerCurationAN.ts pour le pourquoi —
// piège vérifié le 2026-08-18, #126).
//
// Remplace, pour l'usage quotidien automatisé, un enchaînement direct de
// `npm run curer:explications-vote` / `curer:discussion-generale` : ces deux
// commandes restent valables pour une régénération manuelle supervisée
// (leur sortie est alors à relire à la main avant commit), mais ne doivent
// jamais être lancées sans supervision dans le pipeline quotidien.
//
// Usage :
//   node --experimental-transform-types scripts/fusionner-curation-an.ts
//   (ou : npm run an:fusionner-curation)

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fusionnerArchives } from "./lib/fusionnerCurationAN.ts";

const DONNEES_DIR = path.join(process.cwd(), "data/raw/an/17");

type Cible = {
  nom: string;
  script: string;
  cheminCommite: string;
};

const CIBLES: Cible[] = [
  {
    nom: "Explications de vote",
    script: "scripts/extraire-explications-vote.ts",
    cheminCommite: path.join(DONNEES_DIR, "ExplicationsVote-dossiers-classifies.json.zip"),
  },
  {
    nom: "Discussion générale",
    script: "scripts/extraire-discussion-generale.ts",
    cheminCommite: path.join(DONNEES_DIR, "DiscussionGenerale-dossiers-classifies.json.zip"),
  },
];

function main() {
  const scratchDir = mkdtempSync(path.join(tmpdir(), "an-fusion-curation-"));

  try {
    for (const cible of CIBLES) {
      const cheminScratch = path.join(scratchDir, path.basename(cible.cheminCommite));

      execFileSync(
        "node",
        ["--experimental-transform-types", cible.script, cheminScratch],
        { stdio: "inherit" }
      );

      const ancien = readFileSync(cible.cheminCommite);
      const regenere = readFileSync(cheminScratch);

      const { zip, rapport } = fusionnerArchives(ancien, regenere);
      const totalAjouts = rapport.dossiersAjoutes.length + rapport.scrutinsAjoutes.length;

      if (totalAjouts > 0) {
        zip.writeZip(cible.cheminCommite);
      }

      console.log(`\n=== ${cible.nom} ===`);
      console.log(`Dossiers entièrement nouveaux : ${rapport.dossiersAjoutes.length}`);
      for (const d of rapport.dossiersAjoutes) console.log(`  + ${d}`);
      console.log(`Scrutins ajoutés dans des dossiers déjà connus : ${rapport.scrutinsAjoutes.length}`);
      for (const s of rapport.scrutinsAjoutes) console.log(`  + ${s.dossierRef} / ${s.scrutinUid}`);
      console.log(
        totalAjouts > 0
          ? `Archive mise à jour : ${cible.cheminCommite}`
          : "Aucune nouveauté — archive commitée inchangée."
      );
    }
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main();
