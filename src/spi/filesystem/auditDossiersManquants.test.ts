import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { trouverScrutinDecisif, type Scrutin } from "@/domain/scrutin";
import { normaliserDossierRef } from "@/spi/filesystem/scrutinRepository";

// Rejoue la méthode d'audit de #33/#42 sur l'archive réelle en cours
// (data/raw/an/17/Scrutins.json.zip), plutôt que sur une fixture — c'est le
// script/test de non-régression demandé par #33 ("échoue si de nouveaux
// dossiers à vote décisif apparaissent sans être présents dans
// content/dossiers/"), à ré-exécuter à chaque mise à jour de data/raw/an/.
// Volontairement exclu du `npm test` par défaut (cf. vitest.config.mts) :
// il scanne les 8000+ scrutins de l'archive complète, contrairement aux
// autres tests filesystem qui utilisent de petites fixtures. À lancer avec
// `npx vitest run src/spi/filesystem/auditDossiersManquants.test.ts`.

const SCRUTINS_ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Scrutins.json.zip"
);
const CONTENT_DOSSIERS_DIR = path.join(process.cwd(), "content/dossiers");

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
    numero: string;
    sort: { code: string };
    objet: { dossierLegislatif: { dossierRef: string } | null };
  };
};

function toDecisifCandidat(raw: RawScrutinFile["scrutin"]): Scrutin | null {
  const resultat = raw.sort.code;
  if (resultat !== "adopté" && resultat !== "rejeté") {
    return null;
  }
  return {
    uid: raw.uid,
    titre: raw.titre,
    date: "",
    numero: Number(raw.numero),
    dossierRef: normaliserDossierRef(
      raw.uid,
      raw.objet.dossierLegislatif?.dossierRef ?? null
    ),
    decompte: { pour: 0, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat,
  };
}

function chargerScrutinsDecisifs(): Scrutin[] {
  const zip = new AdmZip(SCRUTINS_ZIP_PATH);
  const decisifs: Scrutin[] = [];

  for (const entry of zip.getEntries()) {
    if (!entry.entryName.startsWith("json/") || entry.isDirectory) {
      continue;
    }
    const raw = JSON.parse(entry.getData().toString("utf-8")) as RawScrutinFile;
    const candidat = toDecisifCandidat(raw.scrutin);
    if (candidat && trouverScrutinDecisif([candidat])) {
      decisifs.push(candidat);
    }
  }

  return decisifs;
}

function dossierRefClasse(dossierRef: string): boolean {
  return fs.existsSync(path.join(CONTENT_DOSSIERS_DIR, `${dossierRef}.md`));
}

describe("audit de complétude des dossiers avec vote décisif (#33/#42)", () => {
  it("tout scrutin décisif dont le dossierRef est connu (brut ou curation manuelle) a une fiche content/dossiers/", () => {
    const decisifs = chargerScrutinsDecisifs();

    const manquants = decisifs
      .filter((s) => s.dossierRef !== null)
      .filter((s) => !dossierRefClasse(s.dossierRef!))
      .map((s) => `${s.dossierRef} (scrutin ${s.uid} : "${s.titre}")`);

    expect(
      manquants,
      manquants.length > 0
        ? `${manquants.length} dossierRef connus avec vote décisif n'ont pas de fiche content/dossiers/ :\n${manquants.join("\n")}`
        : undefined
    ).toEqual([]);
  });

  it("liste (sans échouer) les scrutins décisifs sans dossierRef résolu, à trier manuellement comme #41/#42", () => {
    const decisifs = chargerScrutinsDecisifs();

    const sansDossierRef = decisifs.filter((s) => s.dossierRef === null);

    if (sansDossierRef.length > 0) {
      console.warn(
        `${sansDossierRef.length} scrutin(s) décisif(s) sans dossierRef résolu (cas ambigus à trier manuellement, cf. #41) :\n` +
          sansDossierRef
            .map((s) => `  ${s.uid} (${s.resultat}) : "${s.titre}"`)
            .join("\n")
      );
    }

    // Volontairement non bloquant : résoudre ces cas exige une lecture
    // manuelle du texte (cf. méthode de #41), pas un algorithme fiable.
    expect(sansDossierRef).toBeInstanceOf(Array);
  });
});
