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
  },
});
