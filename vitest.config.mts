import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    exclude: [
      "**/node_modules/**",
      ".claude/worktrees/**",
      // Audits contre les archives réelles (des milliers d'entrées) plutôt
      // que des fixtures — trop lents pour le `npm test` par défaut, cf.
      // vitest.audit.config.mts (`npm run audit:dossiers`/`audit:fiches`).
      "**/audit*.test.ts",
    ],
  },
});
