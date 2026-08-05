import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createGenererFicheScrutinEnrichie } from "@/api/genererFicheScrutinEnrichie";
import { FilesystemAmendementRepository } from "@/spi/filesystem/amendementRepository";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";

// Rejoue genererFicheScrutinEnrichie sur tous les scrutins de tous les
// dossiers déjà classés (content/dossiers/), contre les vraies archives
// (data/raw/an/17/) — pas des fixtures. Trouvé et corrigé grâce à cet audit
// (issue #46) : un dateSort/contenuAuteur "nil" côté AN (amendement jamais
// tranché) faisait planter la désambiguïsation, et des entités doublement
// échappées ("&amp;nbsp;") laissaient du HTML brut dans la Fiche.
// Volontairement exclu du `npm test` par défaut (cf. vitest.audit.config
// .mts) : à lancer avec `npm run audit:fiches`, notamment après une
// nouvelle curation (#45) ou un nouveau lot de dossiers classés.

const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");

function dossierRefsClasses(): string[] {
  return fs
    .readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
}

describe("audit des Fiches Scrutin sur tous les dossiers classés (#46)", () => {
  it("génère une Fiche valide pour chaque scrutin : jamais d'exception, jamais vide, jamais de HTML/entités non décodées, jamais > 820 caractères", async () => {
    const scrutinRepository = new FilesystemScrutinRepository();
    const amendementRepository = new FilesystemAmendementRepository();
    const taxonomyRepository = new DeclaredTaxonomyRepository();
    const dossierRepository = new FilesystemDossierRepository({
      taxonomyRepository,
    });
    const genererFiche = createGenererFicheScrutinEnrichie(amendementRepository);

    const problemes: string[] = [];

    for (const dossierRef of dossierRefsClasses()) {
      const dossier = await dossierRepository.getByRef(dossierRef);
      const scrutins = await scrutinRepository.getByDossierRef(dossierRef);

      for (const scrutin of scrutins) {
        let fiche;
        try {
          fiche = await genererFiche(scrutin, dossier);
        } catch (e) {
          problemes.push(`${scrutin.uid} (${dossierRef}) : exception ${e}`);
          continue;
        }

        for (const [champ, valeur] of Object.entries(fiche)) {
          if (!valeur || valeur.trim().length === 0) {
            problemes.push(`${scrutin.uid} (${dossierRef}) : ${champ} vide`);
          }
          if (/<[a-z]|&#\d|&#x[0-9a-f]|&nbsp;|&amp;/i.test(valeur)) {
            problemes.push(
              `${scrutin.uid} (${dossierRef}) : ${champ} contient du HTML/entités non décodées`
            );
          }
          if (valeur.length > 820) {
            problemes.push(
              `${scrutin.uid} (${dossierRef}) : ${champ} fait ${valeur.length} caractères (> 820)`
            );
          }
        }
      }
    }

    expect(
      problemes,
      problemes.length > 0
        ? `${problemes.length} problème(s) détecté(s) :\n${problemes.slice(0, 50).join("\n")}`
        : undefined
    ).toEqual([]);
  });
});
