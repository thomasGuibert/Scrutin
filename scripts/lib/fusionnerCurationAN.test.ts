import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { fusionnerArchives } from "./fusionnerCurationAN.ts";

function construireZip(dossiers: Record<string, { dossierRef: string; scrutins: Record<string, unknown> }>): Buffer {
  const zip = new AdmZip();
  for (const [dossierRef, contenu] of Object.entries(dossiers)) {
    zip.addFile(`json/${dossierRef}.json`, Buffer.from(JSON.stringify(contenu, null, 2), "utf-8"));
  }
  return zip.toBuffer();
}

function lireDossier(zip: AdmZip, dossierRef: string): { dossierRef: string; scrutins: Record<string, unknown> } {
  const entry = zip.getEntry(`json/${dossierRef}.json`);
  if (!entry) throw new Error(`Entrée absente : ${dossierRef}`);
  return JSON.parse(entry.getData().toString("utf-8"));
}

describe("fusionnerArchives (#126 — jamais écraser la curation manuelle existante)", () => {
  it("ajoute un dossier entièrement absent de l'archive commitée", () => {
    const ancien = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
    });
    const nouveau = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
      B: { dossierRef: "B", scrutins: { V2: "détecté mécaniquement" } },
    });

    const { zip, rapport } = fusionnerArchives(ancien, nouveau);

    expect(rapport.dossiersAjoutes).toEqual(["B"]);
    expect(rapport.scrutinsAjoutes).toEqual([]);
    expect(lireDossier(zip, "B").scrutins).toEqual({ V2: "détecté mécaniquement" });
  });

  it("ajoute un scrutin absent dans un dossier déjà connu, sans toucher aux autres scrutins", () => {
    const ancien = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
    });
    const nouveau = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "version mécanique, différente", V2: "nouveau" } },
    });

    const { zip, rapport } = fusionnerArchives(ancien, nouveau);

    expect(rapport.dossiersAjoutes).toEqual([]);
    expect(rapport.scrutinsAjoutes).toEqual([{ dossierRef: "A", scrutinUid: "V2" }]);
    expect(lireDossier(zip, "A").scrutins).toEqual({
      V1: "curé à la main", // jamais écrasé par la version mécanique
      V2: "nouveau",
    });
  });

  it("ne touche à rien quand la régénération ne trouve aucune nouveauté", () => {
    const ancien = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
    });
    const nouveau = construireZip({
      A: { dossierRef: "A", scrutins: {} }, // rien retrouvé mécaniquement
    });

    const { zip, rapport } = fusionnerArchives(ancien, nouveau);

    expect(rapport).toEqual({ dossiersAjoutes: [], scrutinsAjoutes: [] });
    expect(lireDossier(zip, "A").scrutins).toEqual({ V1: "curé à la main" });
  });

  it("préserve un dossier de l'archive commitée absent de la régénération", () => {
    const ancien = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
      Z: { dossierRef: "Z", scrutins: { V9: "dossier non reclassé par ce run" } },
    });
    const nouveau = construireZip({
      A: { dossierRef: "A", scrutins: { V1: "curé à la main" } },
    });

    const { zip, rapport } = fusionnerArchives(ancien, nouveau);

    expect(rapport).toEqual({ dossiersAjoutes: [], scrutinsAjoutes: [] });
    expect(lireDossier(zip, "Z").scrutins).toEqual({ V9: "dossier non reclassé par ce run" });
  });
});
