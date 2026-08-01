import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

// Vérifie, pour chaque scrutin des dossiers déjà classés, que le
// dossierRef que nous lui attribuons (brut ou curation manuelle,
// DOSSIER_REF_OVERRIDE) correspond au dossierRef canonique déclaré par
// l'AN elle-même — reconstruit en indexant les voteRefs présents dans les
// actes "Décision" de Dossiers_Legislatifs.json.zip (3000+ dossiers).
//
// A trouvé 5 rattachements erronés en vérification initiale (issue :
// signalement d'un doublon "Nationalisation d'ArcelorMittal France" sur
// /sous-theme/nationalisations-marche) : dans 4 cas, un dossier antérieur
// jamais allé au vote avait été curé par erreur de rapprochement par
// titre à la place du vrai redépôt voté ; le 5e était une reprise
// inter-législatures (texte retitré en cours de navette). Tous corrigés.
//
// Volontairement exclu du `npm test` par défaut (cf. vitest.audit.config
// .mts) : parcourt l'archive complète des dossiers (3000+ entrées). À
// lancer avec `npm run audit:rattachements`, notamment après un nouveau
// lot de curation DOSSIER_REF_OVERRIDE.

const DOSSIERS_ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Dossiers_Legislatifs.json.zip"
);
const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");

type ActeLegislatif = {
  "@xsi:type"?: string;
  voteRefs?: { voteRef?: string | string[] } | null;
  actesLegislatifs?: { acteLegislatif?: ActeLegislatif | ActeLegislatif[] } | null;
};

function toArray<T>(valeur: T | T[] | undefined | null): T[] {
  if (valeur == null) return [];
  return Array.isArray(valeur) ? valeur : [valeur];
}

function collecterVoteRefs(acte: ActeLegislatif, out: string[]) {
  for (const v of toArray(acte.voteRefs?.voteRef)) {
    out.push(v);
  }
  for (const enfant of toArray(acte.actesLegislatifs?.acteLegislatif)) {
    collecterVoteRefs(enfant, out);
  }
}

// Un même voteRef peut légitimement apparaître sous deux dossiers distincts
// dans la source AN elle-même (ex. texte organique + texte ordinaire votés
// ensemble) — on garde le premier rencontré et on ne signale que les
// désaccords avec NOS rattachements, pas les ambiguïtés internes à la
// source.
function construireIndexCanonique(): Map<string, string> {
  const zip = new AdmZip(DOSSIERS_ZIP_PATH);
  const index = new Map<string, string>();

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !entry.entryName.startsWith("json/dossierParlementaire/")) {
      continue;
    }

    let raw: { dossierParlementaire?: { uid?: string; actesLegislatifs?: unknown } };
    try {
      raw = JSON.parse(entry.getData().toString("utf-8"));
    } catch {
      continue;
    }
    const d = raw.dossierParlementaire;
    if (!d?.uid) continue;

    const voteRefs: string[] = [];
    for (const acte of toArray(
      (d.actesLegislatifs as { acteLegislatif?: ActeLegislatif | ActeLegislatif[] })
        ?.acteLegislatif
    )) {
      collecterVoteRefs(acte, voteRefs);
    }
    for (const v of voteRefs) {
      if (!index.has(v)) {
        index.set(v, d.uid);
      }
    }
  }

  return index;
}

function dossierRefsClasses(): string[] {
  return fs
    .readdirSync(CONTENT_DOSSIERS_DIR)
    .filter((fichier) => fichier.endsWith(".md"))
    .map((fichier) => fichier.replace(/\.md$/, ""));
}

describe("audit des rattachements scrutin -> dossier sur les dossiers classés", () => {
  it("chaque scrutin d'un dossier classé est rattaché au dossierRef canonique déclaré par l'AN, quand celle-ci en déclare un", async () => {
    const indexCanonique = construireIndexCanonique();
    const scrutinRepository = new FilesystemScrutinRepository();

    const desaccords: string[] = [];

    for (const dossierRef of dossierRefsClasses()) {
      const scrutins = await scrutinRepository.getByDossierRef(dossierRef);
      for (const scrutin of scrutins) {
        const canonique = indexCanonique.get(scrutin.uid);
        if (canonique && canonique !== dossierRef) {
          desaccords.push(
            `${scrutin.uid} : rattaché à ${dossierRef}, mais l'AN le référence dans ${canonique} — "${scrutin.titre.slice(0, 90)}"`
          );
        }
      }
    }

    expect(
      desaccords,
      desaccords.length > 0
        ? `${desaccords.length} désaccord(s) avec l'index canonique AN :\n${desaccords.join("\n")}`
        : undefined
    ).toEqual([]);
  });
});
