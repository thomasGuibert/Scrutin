// Précalcule les Explications de vote (cf. domain/compteRendu.ts, issue #52)
// de tous les dossiers classés (content/dossiers/*.md), pour chacun de
// leurs scrutins "vote sur le texte entier" (ensemble/article unique/vote
// direct) — plutôt que de rescanner les archives compteRendu*.zip à la
// volée à chaque appel (issue #54).
//
// Rejouable à chaque nouveau lot de comptes rendus déposé dans
// data/raw/an/17/compteRendu*.zip, ou à chaque nouveau lot de dossiers
// classés — même politique que scripts/extraire-amendements.ts.
//
// Usage :
//   node --experimental-transform-types scripts/extraire-explications-vote.ts
//   (ou : npm run curer:explications-vote)

import AdmZip from "adm-zip";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { estVoteSurLeTexteEntier } from "../src/domain/scrutin.ts";
import { FilesystemCompteRenduRepository } from "../src/spi/filesystem/compteRenduRepository.ts";
import { FilesystemScrutinRepository } from "../src/spi/filesystem/scrutinRepository.ts";

const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");
const OUTPUT_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/ExplicationsVote-dossiers-classifies.json.zip"
);

function dossierRefsClasses(): string[] {
  return readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
}

// Lit directement le frontmatter plutôt que FilesystemDossierRepository :
// ce repository importe DeclaredTaxonomyRepository via l'alias "@/", non
// résolu par une exécution node directe (seulement par le bundler Next.js/
// Vitest) — même contrainte que extraire-amendements.ts, qui évite déjà
// cet import pour la même raison.
function lireTitreDossier(dossierRef: string): string | null {
  const chemin = path.join(CONTENT_DOSSIERS_DIR, `${dossierRef}.md`);
  const { data } = matter(readFileSync(chemin, "utf-8"));
  return typeof data.titre === "string" ? data.titre : null;
}

async function main() {
  const dossierRefs = dossierRefsClasses();
  console.log(`${dossierRefs.length} dossiers classés.`);

  const scrutinRepository = new FilesystemScrutinRepository();
  const compteRenduRepository = new FilesystemCompteRenduRepository();

  const outputZip = new AdmZip();

  let scrutinsVoteTexteEntier = 0;
  let scrutinsAvecExplications = 0;
  let dossiersAvecAuMoinsUnScrutinCouvert = 0;

  for (const dossierRef of dossierRefs) {
    const titreDossier = lireTitreDossier(dossierRef);
    const scrutins = await scrutinRepository.getByDossierRef(dossierRef);
    if (!titreDossier) {
      continue;
    }

    const votesTexteEntier = scrutins.filter((s) => estVoteSurLeTexteEntier(s.titre));
    if (votesTexteEntier.length === 0) {
      continue;
    }

    const parScrutin: Record<string, unknown> = {};

    for (const scrutin of votesTexteEntier) {
      scrutinsVoteTexteEntier++;
      const explications = await compteRenduRepository.getExplicationsVote(
        scrutin.date,
        titreDossier
      );
      if (explications) {
        scrutinsAvecExplications++;
        parScrutin[scrutin.uid] = explications;
      }
    }

    if (Object.keys(parScrutin).length > 0) {
      dossiersAvecAuMoinsUnScrutinCouvert++;
      const contenu = JSON.stringify({ dossierRef, scrutins: parScrutin }, null, 2);
      outputZip.addFile(`json/${dossierRef}.json`, Buffer.from(contenu, "utf-8"));
    }
  }

  outputZip.writeZip(OUTPUT_PATH);

  console.log(`Scrutins "vote sur le texte entier" examinés : ${scrutinsVoteTexteEntier}`);
  console.log(`Scrutins avec Explications de vote trouvées : ${scrutinsAvecExplications}`);
  console.log(`Dossiers avec au moins un scrutin couvert : ${dossiersAvecAuMoinsUnScrutinCouvert}`);
  console.log(`Archive écrite : ${OUTPUT_PATH}`);
}

main();
