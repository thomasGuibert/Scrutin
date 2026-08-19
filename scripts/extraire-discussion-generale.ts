// Précalcule les interventions de Discussion générale (cf.
// domain/compteRendu.ts, issue #87, ADR-0003) pour tous les dossiers
// classés (content/dossiers/*.md) dont AU MOINS UN scrutin "vote sur le
// texte entier" n'a PAS déjà d'Explications de vote curées dans
// ExplicationsVote-dossiers-classifies.json.zip — matière première brute
// à trier manuellement, pas des résumés (cf. issue #87 : le tri éditorial
// reste un travail séparé, par lots).
//
// Rejouable à chaque nouveau lot de comptes rendus ou de dossiers classés,
// même politique que scripts/extraire-explications-vote.ts.
//
// Usage :
//   node --experimental-transform-types scripts/extraire-discussion-generale.ts [chemin-sortie]
//   (ou : npm run curer:discussion-generale)
//
// Le chemin de sortie optionnel écrit vers un fichier à part plutôt que
// d'écraser l'archive commitée — mêmes raisons que
// scripts/extraire-explications-vote.ts, utilisé par
// scripts/fusionner-curation-an.ts. La lecture d'ExplicationsVote (pour
// savoir quels scrutins sont déjà couverts, cf. en-tête ci-dessus) continue
// de se faire sur l'archive commitée, jamais sur une sortie à part.

import AdmZip from "adm-zip";
import matter from "gray-matter";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { estVoteSurLeTexteEntier } from "../src/domain/scrutin.ts";
import { FilesystemActeurGroupeRepository } from "../src/spi/filesystem/acteurGroupeRepository.ts";
import { FilesystemDiscussionGeneraleRepository } from "../src/spi/filesystem/discussionGeneraleRepository.ts";
import { FilesystemExplicationsVoteRepository } from "../src/spi/filesystem/explicationsVoteRepository.ts";
import { FilesystemScrutinRepository } from "../src/spi/filesystem/scrutinRepository.ts";

const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");
const OUTPUT_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "data/raw/an/17/DiscussionGenerale-dossiers-classifies.json.zip");

function dossierRefsClasses(): string[] {
  return readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
}

// Même contrainte que extraire-explications-vote.ts : lecture directe du
// frontmatter, "@/" non résolu par une exécution node directe.
function lireTitreDossier(dossierRef: string): string | null {
  const chemin = path.join(CONTENT_DOSSIERS_DIR, `${dossierRef}.md`);
  const { data } = matter(readFileSync(chemin, "utf-8"));
  return typeof data.titre === "string" ? data.titre : null;
}

async function main() {
  const dossierRefs = dossierRefsClasses();
  console.log(`${dossierRefs.length} dossiers classés.`);

  const scrutinRepository = new FilesystemScrutinRepository();
  const explicationsVoteRepository = new FilesystemExplicationsVoteRepository();
  const acteurGroupeRepository = new FilesystemActeurGroupeRepository();
  const discussionGeneraleRepository = new FilesystemDiscussionGeneraleRepository(
    acteurGroupeRepository
  );

  const outputZip = new AdmZip();

  let scrutinsExamines = 0;
  let scrutinsDejaCouvertsParEV = 0;
  let scrutinsAvecDiscussionGenerale = 0;
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
      scrutinsExamines++;

      // Déjà couvert par Explications de vote (issue #52) : pas besoin de
      // Discussion générale, source secondaire (ADR-0003 — "en complément,
      // jamais en remplacement").
      const explicationsExistantes = await explicationsVoteRepository.getByScrutin(
        dossierRef,
        scrutin.uid
      );
      if (explicationsExistantes) {
        scrutinsDejaCouvertsParEV++;
        continue;
      }

      const interventions = await discussionGeneraleRepository.getInterventions(
        scrutin.date,
        titreDossier
      );
      if (interventions) {
        scrutinsAvecDiscussionGenerale++;
        parScrutin[scrutin.uid] = interventions;
      }
    }

    if (Object.keys(parScrutin).length > 0) {
      dossiersAvecAuMoinsUnScrutinCouvert++;
      const contenu = JSON.stringify({ dossierRef, scrutins: parScrutin }, null, 2);
      outputZip.addFile(`json/${dossierRef}.json`, Buffer.from(contenu, "utf-8"));
    }
  }

  outputZip.writeZip(OUTPUT_PATH);

  console.log(`Scrutins "vote sur le texte entier" examinés : ${scrutinsExamines}`);
  console.log(`Déjà couverts par Explications de vote : ${scrutinsDejaCouvertsParEV}`);
  console.log(
    `Scrutins avec interventions de Discussion générale trouvées : ${scrutinsAvecDiscussionGenerale}`
  );
  console.log(`Dossiers avec au moins un scrutin couvert : ${dossiersAvecAuMoinsUnScrutinCouvert}`);
  console.log(`Archive écrite : ${OUTPUT_PATH}`);
}

main();
