import path from "node:path";
import { defineConfig } from "vitest/config";

// Config partagée par les tests d'audit (cf. #33/#42, #46) : scannent les
// archives réelles de data/raw/an/17/ (des milliers d'entrées), donc
// volontairement séparés du `npm test` par défaut pour ne pas ralentir la
// boucle de développement courante. Chaque audit se lance individuellement
// (`npm run audit:dossiers`, `npm run audit:fiches`) en passant son fichier
// en argument positionnel — l'`include` ci-dessous ne fait que reconnaître
// les fichiers `audit*.test.ts` comme appartenant à cette config partagée.
// Duplique (plutôt que réutilise) le petit bloc resolve.alias de
// vitest.config.mts : importer ce fichier depuis l'autre échoue au
// typecheck (`allowImportingTsExtensions` non activé), et ce doublon
// minime est jugé préférable à activer cette option pour ce seul besoin.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["**/audit*.test.ts"],
    exclude: ["**/node_modules/**", ".claude/worktrees/**"],
    // Le timeout par défaut de Vitest (5000ms) est dépassé par
    // auditFichesScrutin.test.ts (~5.8s à ce jour, cf. issue #126 —
    // constaté en doute lors d'un run du pipeline quotidien, indépendant
    // des données du jour) : ce test rejoue genererFicheScrutinEnrichie
    // sur *chaque* scrutin de *chaque* dossier classé, un volume qui ne
    // fait que croître à mesure que content/dossiers/ grossit. Une marge
    // large plutôt qu'un ajustement au plus juste, pour ne pas avoir à
    // relever ce plafond à chaque nouveau lot de curation.
    testTimeout: 60_000,
  },
});
