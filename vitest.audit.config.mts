import path from "node:path";
import { defineConfig } from "vitest/config";

// Config dédiée au script d'audit de complétude (cf. #33/#42) : scanne
// l'archive réelle data/raw/an/17/Scrutins.json.zip (8000+ entrées), donc
// volontairement séparée du `npm test` par défaut pour ne pas ralentir la
// boucle de développement courante. Lancer avec `npm run audit:dossiers`.
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
    include: ["**/auditDossiersManquants.test.ts"],
    exclude: ["**/node_modules/**", ".claude/worktrees/**"],
  },
});
