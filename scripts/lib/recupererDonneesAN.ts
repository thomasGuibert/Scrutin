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
// scripts/extraire-amendements.ts. Non vérifiables en direct depuis cette
// session (data.assemblee-nationale.fr est bloqué par la politique réseau
// de cet environnement, cf. discussion #126) — à corriger ici si le run
// quotidien constate un 404/redirection vers le catalogue.
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

export const telechargerViaFetch: Telechargeur = async (url) => {
  const reponse = await fetch(url);
  if (!reponse.ok) {
    throw new Error(
      `Échec du téléchargement de ${url} : HTTP ${reponse.status}`
    );
  }
  return Buffer.from(await reponse.arrayBuffer());
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
