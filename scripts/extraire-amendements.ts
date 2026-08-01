// Filtre l'archive complète "Amendements.json.zip" de l'Assemblée nationale
// (portail data.assemblee-nationale.fr, ~296 Mo / 123 224 fichiers, non
// commitée dans ce repo) vers une archive réduite, committée dans
// data/raw/an/17/, limitée aux amendements correspondant à un scrutin
// d'amendement déjà rattaché à un dossier classé (content/dossiers/*.md).
//
// Rejouer ce script à chaque nouveau lot de dossiers classés (issue #45).
//
// Usage :
//   node --experimental-transform-types scripts/extraire-amendements.ts <chemin-vers-Amendements.json.zip>
//   (ou : npm run curer:amendements -- <chemin-vers-Amendements.json.zip>)
//
// L'archive source complète n'est pas hébergée dans ce repo — la
// télécharger au préalable depuis :
//   https://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip

import AdmZip from "adm-zip";
import { readdirSync } from "node:fs";
import path from "node:path";
import { estVoteSurAmendement, extraireAmendement } from "../src/domain/scrutin.ts";
import { FilesystemScrutinRepository } from "../src/spi/filesystem/scrutinRepository.ts";

const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");
const OUTPUT_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Amendements-scrutins-classifies.json.zip"
);

// Index dossierRef+numéro -> entrées de l'archive source, construit en un
// seul passage sur les 123k entrées (mêmes raisons de perf que l'index
// dossierRef -> scrutins de FilesystemScrutinRepository : reparcourir
// l'archive complète par scrutin recherché serait prohibitif).
function indexerParDossierEtNumero(
  sourceZip: AdmZip
): Map<string, AdmZip.IZipEntry[]> {
  const index = new Map<string, AdmZip.IZipEntry[]>();

  for (const entry of sourceZip.getEntries()) {
    if (entry.isDirectory) {
      continue;
    }

    // json/<dossierRef>/<texteLegislatifRef>/<fichier>.json
    const parts = entry.entryName.split("/");
    if (parts.length !== 4 || parts[0] !== "json") {
      continue;
    }

    const dossierRef = parts[1];
    const numeroMatch = parts[3].match(/N(\d{6})\.json$/);
    if (!numeroMatch) {
      continue;
    }

    const cle = `${dossierRef}::${numeroMatch[1]}`;
    const liste = index.get(cle) ?? [];
    liste.push(entry);
    index.set(cle, liste);
  }

  return index;
}

async function main() {
  const sourceZipPath = process.argv[2];
  if (!sourceZipPath) {
    console.error(
      "Usage: node --experimental-transform-types scripts/extraire-amendements.ts <chemin-vers-Amendements.json.zip>"
    );
    process.exit(1);
  }

  const dossierRefs = readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
  console.log(`${dossierRefs.length} dossiers classés.`);

  console.log("Lecture de l'archive source (peut prendre une minute)...");
  const sourceZip = new AdmZip(sourceZipPath);
  const index = indexerParDossierEtNumero(sourceZip);

  const scrutinRepository = new FilesystemScrutinRepository();
  const outputZip = new AdmZip();

  let scrutinsAmendement = 0;
  let scrutinsSansCorrespondance = 0;
  let entreesEcrites = 0;

  for (const dossierRef of dossierRefs) {
    const scrutins = await scrutinRepository.getByDossierRef(dossierRef);

    for (const scrutin of scrutins) {
      if (!estVoteSurAmendement(scrutin.titre)) {
        continue;
      }

      const amendement = extraireAmendement(scrutin.titre);
      if (!amendement) {
        continue;
      }
      scrutinsAmendement++;

      const cle = `${dossierRef}::${amendement.numero.padStart(6, "0")}`;
      const candidats = index.get(cle) ?? [];

      if (candidats.length === 0) {
        scrutinsSansCorrespondance++;
        continue;
      }

      for (const entry of candidats) {
        outputZip.addFile(entry.entryName, entry.getData());
        entreesEcrites++;
      }
    }
  }

  outputZip.writeZip(OUTPUT_PATH);

  console.log(`Scrutins d'amendement traités : ${scrutinsAmendement}`);
  console.log(
    `Sans correspondance dans l'archive source : ${scrutinsSansCorrespondance}`
  );
  console.log(`Entrées écrites dans l'archive filtrée : ${entreesEcrites}`);
  console.log(`Archive écrite : ${OUTPUT_PATH}`);
}

main();
