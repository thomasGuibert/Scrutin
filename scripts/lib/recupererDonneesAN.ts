// Logique de récupération des jeux de données ouverts de l'AN équivalents à
// ceux déjà commités dans data/raw/an/17/ (cf. issue #126, point 2) —
// séparée du script CLI (scripts/recuperer-donnees-an.ts) pour rester
// testable sans dépendre du réseau ni du système de fichiers réel.
//
// Législature 17 uniquement (cf. #126, hors périmètre : détection de
// changement de législature).

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DONNEES_DIR = path.join(process.cwd(), "data/raw/an/17");

export type SourceAN = {
  nom: string;
  url: string;
  cheminLocal: string;
};

// URLs du portail open data officiel (data.assemblee-nationale.fr), même
// convention "repository/<législature>/<domaine>/<jeu>/<Fichier>.zip" que
// celle déjà documentée pour Amendements.json.zip dans
// scripts/extraire-amendements.ts. Vérifiées en direct le 2026-08-19 (accès
// réseau à data.assemblee-nationale.fr rétabli depuis cet environnement,
// cf. docs/notes/126-automatisation-tentatives.md et
// docs/notes/2026-08-18-rafraichissement-donnees-an.md) — à corriger ici si
// un run quotidien constate un 404/redirection vers le catalogue.
export const SOURCES: SourceAN[] = [
  {
    nom: "Scrutins",
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip",
    cheminLocal: path.join(DONNEES_DIR, "Scrutins.json.zip"),
  },
  {
    nom: "Dossiers législatifs",
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip",
    cheminLocal: path.join(
      DONNEES_DIR,
      "Dossiers_Legislatifs.json.zip"
    ),
  },
  {
    nom: "Acteurs / mandats / organes",
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip",
    cheminLocal: path.join(
      DONNEES_DIR,
      "AMO10_deputes_actifs_mandats_actifs_organes.json.zip"
    ),
  },
  {
    // Archive officielle unique couvrant tous les comptes rendus de séance
    // (601 fichiers XML au 2026-08-18) — remplace les lots manuels
    // compteRendu1.zip..compteRendu4.zip consolidés en compteRendu.zip
    // cette même session (cf. docs/notes/2026-08-18-rafraichissement-donnees-an.md).
    // Toujours reconnue telle quelle par compteRenduRepository.ts (motif
    // /^compteRendu.*\.zip$/, entrées filtrées sur l'extension .xml).
    nom: "Comptes rendus de séance",
    url: "https://data.assemblee-nationale.fr/static/openData/repository/17/vp/syceronbrut/syseron.xml.zip",
    cheminLocal: path.join(DONNEES_DIR, "compteRendu.zip"),
  },
];

export type ResultatTelechargement = {
  nom: string;
  cheminLocal: string;
  modifie: boolean;
};

function hash(contenu: Buffer): string {
  return createHash("sha256").update(contenu).digest("hex");
}

// Le vrai fetch réseau n'est exercé qu'à l'exécution du script (cf.
// telechargerViaFetch) — jamais dans les tests (recupererDonneesAN.test.ts),
// qui injectent un Telechargeur factice.
export type Telechargeur = (url: string) => Promise<Buffer>;

const TENTATIVES_MAX = 4;
const DELAI_BASE_MS = 2000;

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry avec backoff exponentiel (2s/4s/8s) : le proxy réseau de cet
// environnement a été observé fermant la connexion en cours de transfert
// sur les plus grosses archives (ex. compteRendu.zip, ~55 Mo) — de façon
// intermittente, pas systématique (rejouer suffit, cf. investigation du
// 2026-08-19 : la même URL échoue puis réussit sans changement de code).
// Même politique de retry que les instructions git push de ce dépôt.
export const telechargerViaFetch: Telechargeur = async (url) => {
  let derniereErreur: unknown;

  for (let tentative = 1; tentative <= TENTATIVES_MAX; tentative++) {
    try {
      const reponse = await fetch(url);
      if (!reponse.ok) {
        throw new Error(
          `Échec du téléchargement de ${url} : HTTP ${reponse.status}`
        );
      }
      return Buffer.from(await reponse.arrayBuffer());
    } catch (erreur) {
      derniereErreur = erreur;
      if (tentative < TENTATIVES_MAX) {
        await attendre(DELAI_BASE_MS * 2 ** (tentative - 1));
      }
    }
  }

  throw new Error(
    `Échec du téléchargement de ${url} après ${TENTATIVES_MAX} tentatives : ${derniereErreur instanceof Error ? derniereErreur.message : String(derniereErreur)}`
  );
};

// N'écrase le fichier local que si le contenu a réellement changé
// (comparaison par hash, pas par date ni taille) — pas de commit no-op
// quotidien (#126, point 2).
export async function recupererSource(
  source: SourceAN,
  telecharger: Telechargeur
): Promise<ResultatTelechargement> {
  const nouveauContenu = await telecharger(source.url);

  const ancienContenu = existsSync(source.cheminLocal)
    ? readFileSync(source.cheminLocal)
    : null;

  const modifie =
    !ancienContenu || hash(ancienContenu) !== hash(nouveauContenu);

  if (modifie) {
    writeFileSync(source.cheminLocal, nouveauContenu);
  }

  return { nom: source.nom, cheminLocal: source.cheminLocal, modifie };
}

export async function recupererToutesLesSources(
  sources: SourceAN[] = SOURCES,
  telecharger: Telechargeur = telechargerViaFetch
): Promise<ResultatTelechargement[]> {
  const resultats: ResultatTelechargement[] = [];
  for (const source of sources) {
    resultats.push(await recupererSource(source, telecharger));
  }
  return resultats;
}
