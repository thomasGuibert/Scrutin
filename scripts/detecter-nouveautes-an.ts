// Compare les archives fraîchement (re)téléchargées par
// scripts/recuperer-donnees-an.ts à la version encore commitée sur HEAD, et
// rapporte les scrutins nouveaux/modifiés qui restent à curer — avec, pour
// chacun, les raisons de doute détectables automatiquement (#126, points 3
// et 7).
//
// À lancer après scripts/recuperer-donnees-an.ts, avant toute curation :
// cf. docs/agents/pipeline-quotidien-an.md (étape 3).
//
// Usage :
//   node --experimental-transform-types scripts/detecter-nouveautes-an.ts
//   (ou : npm run an:detecter-nouveautes)
//
// Sortie : un rapport JSON sur stdout (cf. type RapportNouveautes).

import AdmZip from "adm-zip";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { scrutinsDecisifs, type Scrutin } from "../src/domain/scrutin.ts";
import { normaliserDossierRef } from "../src/spi/filesystem/scrutinRepository.ts";
import { comparerArchives, raisonsDeDoute } from "./lib/detecterNouveautesAN.ts";

const DONNEES_DIR = "data/raw/an/17";
const SCRUTINS_ZIP = path.join(DONNEES_DIR, "Scrutins.json.zip");
const DOSSIERS_ZIP = path.join(DONNEES_DIR, "Dossiers_Legislatifs.json.zip");

// La version encore commitée sur HEAD, avant écrasement par
// scripts/recuperer-donnees-an.ts (qui a déjà réécrit le fichier de travail
// au moment où ce script tourne) — `git show` lit l'objet de l'index/HEAD
// sans toucher au fichier sur disque. `null` si le fichier n'existait pas
// encore sur HEAD (premier run).
function ancienneVersionCommitee(cheminRelatif: string): Buffer | null {
  try {
    return execFileSync("git", ["show", `HEAD:${cheminRelatif}`], {
      maxBuffer: 1024 * 1024 * 200,
    });
  } catch {
    return null;
  }
}

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
    numero: string;
    sort: { code: string };
    objet: { dossierLegislatif: { dossierRef: string } | null };
  };
};

type RawDossierFile = {
  dossierParlementaire: {
    uid: string;
    titreDossier: { titre: string } | null;
    procedureParlementaire: { libelle: string } | null;
  };
};

function estResultatConnu(code: string): code is "adopté" | "rejeté" {
  return code === "adopté" || code === "rejeté";
}

// Reconstruit juste assez d'un Scrutin pour interroger scrutinsDecisifs
// (titre/numero/resultat) — même approche minimale que l'audit de #33/#42
// (src/spi/filesystem/auditDossiersManquants.test.ts), pas une réutilisation
// du parsing complet de FilesystemScrutinRepository (decompte/positions par
// groupe, non nécessaires ici).
function versCandidatDecisif(raw: RawScrutinFile["scrutin"]): Scrutin | null {
  if (!estResultatConnu(raw.sort.code)) {
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
    resultat: raw.sort.code,
  };
}

type ScrutinAAnalyser = {
  uid: string;
  titre: string;
  dossierRef: string | null;
  decisif: boolean;
  raisonsDeDoute: string[];
};

function libelleProcedure(
  dossiersZip: AdmZip,
  dossierRef: string | null
): string | null {
  if (!dossierRef) {
    return null;
  }
  const entry = dossiersZip.getEntry(
    `json/dossierParlementaire/${dossierRef}.json`
  );
  if (!entry) {
    return null;
  }
  const raw = JSON.parse(entry.getData().toString("utf-8")) as RawDossierFile;
  return raw.dossierParlementaire.procedureParlementaire?.libelle ?? null;
}

function analyserScrutins(
  nomsEntrees: string[],
  scrutinsZip: AdmZip,
  dossiersZip: AdmZip
): ScrutinAAnalyser[] {
  return nomsEntrees.map((nomEntree) => {
    const entry = scrutinsZip.getEntry(nomEntree)!;
    const raw = JSON.parse(entry.getData().toString("utf-8")) as RawScrutinFile;
    const dossierRef = normaliserDossierRef(
      raw.scrutin.uid,
      raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null
    );
    const candidat = versCandidatDecisif(raw.scrutin);

    return {
      uid: raw.scrutin.uid,
      titre: raw.scrutin.titre,
      dossierRef,
      decisif: candidat !== null && scrutinsDecisifs([candidat]).length > 0,
      raisonsDeDoute: raisonsDeDoute({
        dossierRef,
        libelleProcedure: libelleProcedure(dossiersZip, dossierRef),
      }),
    };
  });
}

type RapportNouveautes = {
  scrutins: {
    nouveaux: ScrutinAAnalyser[];
    modifies: ScrutinAAnalyser[];
  };
  dossiers: {
    nouveaux: string[];
    modifies: string[];
  };
};

function main() {
  const nouvelleScrutinsZip = new AdmZip(readFileSync(SCRUTINS_ZIP));
  const nouvelleDossiersZip = new AdmZip(readFileSync(DOSSIERS_ZIP));

  const diffScrutins = comparerArchives(
    ancienneVersionCommitee(SCRUTINS_ZIP),
    readFileSync(SCRUTINS_ZIP)
  );
  const diffDossiers = comparerArchives(
    ancienneVersionCommitee(DOSSIERS_ZIP),
    readFileSync(DOSSIERS_ZIP)
  );

  const rapport: RapportNouveautes = {
    scrutins: {
      nouveaux: analyserScrutins(
        diffScrutins.nouvelles,
        nouvelleScrutinsZip,
        nouvelleDossiersZip
      ),
      modifies: analyserScrutins(
        diffScrutins.modifiees,
        nouvelleScrutinsZip,
        nouvelleDossiersZip
      ),
    },
    dossiers: {
      nouveaux: diffDossiers.nouvelles,
      modifies: diffDossiers.modifiees,
    },
  };

  console.log(JSON.stringify(rapport, null, 2));
}

main();
