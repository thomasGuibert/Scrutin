import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  recupererSource,
  recupererToutesLesSources,
  type SourceAN,
} from "./recupererDonneesAN.ts";

describe("recupererSource (#126, point 2 : pas de commit no-op)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "an-recuperer-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function source(cheminLocal: string): SourceAN {
    return { nom: "Test", url: "https://example.invalid/test.zip", cheminLocal };
  }

  it("écrit le fichier local et signale un changement quand il n'existait pas encore", async () => {
    const cheminLocal = path.join(dir, "test.zip");

    const resultat = await recupererSource(source(cheminLocal), async () =>
      Buffer.from("contenu-v1")
    );

    expect(resultat.modifie).toBe(true);
    expect(readFileSync(cheminLocal, "utf-8")).toBe("contenu-v1");
  });

  it("ne réécrit pas et signale l'absence de changement quand le contenu téléchargé est identique", async () => {
    const cheminLocal = path.join(dir, "test.zip");
    writeFileSync(cheminLocal, "contenu-inchange");

    const resultat = await recupererSource(source(cheminLocal), async () =>
      Buffer.from("contenu-inchange")
    );

    expect(resultat.modifie).toBe(false);
    expect(readFileSync(cheminLocal, "utf-8")).toBe("contenu-inchange");
  });

  it("réécrit et signale un changement quand le contenu téléchargé diffère de l'existant", async () => {
    const cheminLocal = path.join(dir, "test.zip");
    writeFileSync(cheminLocal, "ancien-contenu");

    const resultat = await recupererSource(source(cheminLocal), async () =>
      Buffer.from("nouveau-contenu")
    );

    expect(resultat.modifie).toBe(true);
    expect(readFileSync(cheminLocal, "utf-8")).toBe("nouveau-contenu");
  });
});

describe("recupererToutesLesSources", () => {
  it("récupère chaque source indépendamment et agrège les résultats", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "an-recuperer-toutes-"));
    try {
      const sources: SourceAN[] = [
        { nom: "A", url: "https://example.invalid/a.zip", cheminLocal: path.join(dir, "a.zip") },
        { nom: "B", url: "https://example.invalid/b.zip", cheminLocal: path.join(dir, "b.zip") },
      ];
      writeFileSync(sources[0].cheminLocal, "a-inchange");

      const resultats = await recupererToutesLesSources(sources, async (url) =>
        Buffer.from(url.endsWith("a.zip") ? "a-inchange" : "b-nouveau")
      );

      expect(resultats).toEqual([
        { nom: "A", cheminLocal: sources[0].cheminLocal, modifie: false },
        { nom: "B", cheminLocal: sources[1].cheminLocal, modifie: true },
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
