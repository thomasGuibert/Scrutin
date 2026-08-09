import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createComparerGroupes } from "@/api/comparerGroupes";
import { createGenererFicheScrutinEnrichie } from "@/api/genererFicheScrutinEnrichie";
import { FilesystemAmendementRepository } from "@/spi/filesystem/amendementRepository";
import { FilesystemDiscoursAmendementRepository } from "@/spi/filesystem/discoursAmendementRepository";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemExplicationsVoteRepository } from "@/spi/filesystem/explicationsVoteRepository";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
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

// Budget d'un champ texte de la Fiche — inchangé depuis #46. Le tableau des
// Explications de vote (issue #59) n'est plus une chaîne concaténée par
// groupe (l'ancien risque qui avait fait relever ce plafond, cf. #57) mais
// un tableau structuré vérifié séparément ci-dessous : chaque résumé garde
// donc le même budget qu'un champ classique.
const LONGUEUR_CHAMP_MAX = 820;

function contientHtmlOuEntites(valeur: string): boolean {
  return /<[a-z]|&#\d|&#x[0-9a-f]|&nbsp;|&amp;/i.test(valeur);
}

function verifierTexte(
  libelle: string,
  valeur: string,
  problemes: string[]
): void {
  if (!valeur || valeur.trim().length === 0) {
    problemes.push(`${libelle} vide`);
  }
  if (contientHtmlOuEntites(valeur)) {
    problemes.push(`${libelle} contient du HTML/entités non décodées`);
  }
  if (valeur.length > LONGUEUR_CHAMP_MAX) {
    problemes.push(
      `${libelle} fait ${valeur.length} caractères (> ${LONGUEUR_CHAMP_MAX})`
    );
  }
}

function dossierRefsClasses(): string[] {
  return fs
    .readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
}

describe("audit des Fiches Scrutin sur tous les dossiers classés (#46)", () => {
  it("génère une Fiche valide pour chaque scrutin : jamais d'exception, jamais vide, jamais de HTML/entités non décodées, jamais > 820 caractères par champ", async () => {
    const scrutinRepository = new FilesystemScrutinRepository();
    const amendementRepository = new FilesystemAmendementRepository();
    const explicationsVoteRepository = new FilesystemExplicationsVoteRepository();
    const discoursAmendementRepository = new FilesystemDiscoursAmendementRepository();
    const groupeRepository = new FilesystemGroupeRepository();
    const taxonomyRepository = new DeclaredTaxonomyRepository();
    const dossierRepository = new FilesystemDossierRepository({
      taxonomyRepository,
    });
    const genererFiche = createGenererFicheScrutinEnrichie(
      amendementRepository,
      explicationsVoteRepository,
      createComparerGroupes(groupeRepository),
      discoursAmendementRepository
    );

    const problemes: string[] = [];

    for (const dossierRef of dossierRefsClasses()) {
      const dossier = await dossierRepository.getByRef(dossierRef);
      const scrutins = await scrutinRepository.getByDossierRef(dossierRef);

      for (const scrutin of scrutins) {
        let fiche;
        try {
          fiche = await genererFiche(scrutin, dossier, scrutins);
        } catch (e) {
          problemes.push(`${scrutin.uid} (${dossierRef}) : exception ${e}`);
          continue;
        }

        const prefixe = `${scrutin.uid} (${dossierRef})`;

        if ("explicationsParGroupe" in fiche) {
          verifierTexte(`${prefixe} : contexte`, fiche.contexte, problemes);
          verifierTexte(`${prefixe} : action`, fiche.action, problemes);
          verifierTexte(`${prefixe} : resultatAttendu`, fiche.resultatAttendu, problemes);
          verifierTexte(`${prefixe} : resultat`, fiche.resultat, problemes);

          if (fiche.explicationsParGroupe.length === 0) {
            problemes.push(`${prefixe} : explicationsParGroupe vide`);
          }

          for (const ligne of fiche.explicationsParGroupe) {
            const libelleLigne = `${prefixe} : explication ${ligne.groupe.abreviation}`;
            if (ligne.resume !== null) {
              verifierTexte(libelleLigne, ligne.resume, problemes);
            }
          }
          continue;
        }

        for (const [champ, valeur] of Object.entries(fiche)) {
          verifierTexte(`${prefixe} : ${champ}`, valeur, problemes);
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
