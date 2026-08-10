// Retélécharge depuis data.assemblee-nationale.fr les jeux de données bruts
// déjà présents dans data/raw/an/17/ (Scrutins, Dossiers législatifs,
// Acteurs/mandats/organes) et n'écrase un fichier local que si son contenu a
// réellement changé — pas de commit no-op quotidien (cf. issue #126).
//
// Point d'entrée du pipeline quotidien (cf. docs/agents/pipeline-quotidien-an.md,
// étape 2) : à lancer avant scripts/detecter-nouveautes-an.ts, qui compare
// alors le fichier local qui vient d'être (ré)écrit ici à la version encore
// commitée sur HEAD.
//
// Usage :
//   node --experimental-transform-types scripts/recuperer-donnees-an.ts
//   (ou : npm run an:recuperer)

import { recupererToutesLesSources } from "./lib/recupererDonneesAN.ts";

async function main() {
  const resultats = await recupererToutesLesSources();

  for (const resultat of resultats) {
    console.log(
      `${resultat.nom} : ${resultat.modifie ? "modifié" : "inchangé"} (${resultat.cheminLocal})`
    );
  }

  const modifies = resultats.filter((r) => r.modifie);
  console.log(
    modifies.length > 0
      ? `${modifies.length}/${resultats.length} source(s) modifiée(s).`
      : "Aucune source modifiée — rien à committer."
  );
}

main();
