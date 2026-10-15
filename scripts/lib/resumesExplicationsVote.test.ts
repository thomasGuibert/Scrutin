import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { appliquerResumes, listerResumesManquants } from "./resumesExplicationsVote.ts";

function construireZip(dossiers: Array<{ dossierRef: string; scrutins: Record<string, unknown> }>): Buffer {
  const zip = new AdmZip();
  for (const contenu of dossiers) {
    zip.addFile(`json/${contenu.dossierRef}.json`, Buffer.from(JSON.stringify(contenu, null, 2), "utf-8"));
  }
  return zip.toBuffer();
}

const archive = construireZip([
  {
    dossierRef: "A",
    scrutins: {
      V1: [
        { groupe: "RN", orateur: "M. X", texte: "Discours RN", resume: "Déjà résumé." },
        { groupe: "LFI-NFP", orateur: "Mme Y", texte: "Discours LFI" },
      ],
    },
  },
]);

describe("listerResumesManquants", () => {
  it("liste les seules interventions sans résumé", () => {
    expect(listerResumesManquants(archive)).toEqual([
      { dossierRef: "A", scrutin: "V1", groupe: "LFI-NFP", orateur: "Mme Y", texte: "Discours LFI" },
    ]);
  });
});

describe("appliquerResumes", () => {
  it("ajoute le résumé sans toucher aux autres interventions", () => {
    const resultat = appliquerResumes(archive, [
      { dossierRef: "A", scrutin: "V1", groupe: "LFI-NFP", resume: "Nouveau résumé." },
    ]);

    const contenu = JSON.parse(new AdmZip(resultat).getEntry("json/A.json")!.getData().toString("utf-8"));
    expect(contenu.scrutins.V1.map((i: { resume?: string }) => i.resume)).toEqual([
      "Déjà résumé.",
      "Nouveau résumé.",
    ]);
    expect(listerResumesManquants(resultat)).toEqual([]);
  });

  it("refuse de remplacer un résumé existant", () => {
    expect(() =>
      appliquerResumes(archive, [{ dossierRef: "A", scrutin: "V1", groupe: "RN", resume: "Autre." }])
    ).toThrow("Résumé déjà présent");
  });

  it("refuse une intervention introuvable", () => {
    expect(() =>
      appliquerResumes(archive, [{ dossierRef: "A", scrutin: "V2", groupe: "RN", resume: "Autre." }])
    ).toThrow("Intervention introuvable");
  });
});
