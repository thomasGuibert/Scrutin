import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import {
  comparerArchives,
  estPlfOuPlfss,
  estVoteDeConscience,
  raisonsDeDoute,
} from "./detecterNouveautesAN.ts";

function construireZip(entrees: Record<string, string>): Buffer {
  const zip = new AdmZip();
  for (const [nom, contenu] of Object.entries(entrees)) {
    zip.addFile(nom, Buffer.from(contenu, "utf-8"));
  }
  return zip.toBuffer();
}

describe("comparerArchives (#126, point 3 : détection du nouveau)", () => {
  it("signale toutes les entrées comme nouvelles quand il n'y a pas d'ancienne version", () => {
    const nouvelle = construireZip({ "json/A.json": "{}", "json/B.json": "{}" });

    const comparaison = comparerArchives(null, nouvelle);

    expect(comparaison.nouvelles.sort()).toEqual(["json/A.json", "json/B.json"]);
    expect(comparaison.modifiees).toEqual([]);
  });

  it("distingue une entrée nouvelle d'une entrée modifiée", () => {
    const ancienne = construireZip({
      "json/A.json": '{"v":1}',
      "json/B.json": '{"v":1}',
    });
    const nouvelle = construireZip({
      "json/A.json": '{"v":1}', // inchangée
      "json/B.json": '{"v":2}', // modifiée
      "json/C.json": '{"v":1}', // nouvelle
    });

    const comparaison = comparerArchives(ancienne, nouvelle);

    expect(comparaison.nouvelles).toEqual(["json/C.json"]);
    expect(comparaison.modifiees).toEqual(["json/B.json"]);
  });

  it("ne signale rien quand les deux archives sont identiques", () => {
    const contenu = construireZip({ "json/A.json": '{"v":1}' });

    const comparaison = comparerArchives(contenu, contenu);

    expect(comparaison).toEqual({ nouvelles: [], modifiees: [] });
  });

  it("ne signale pas comme nouveau/modifié un fichier retiré de la nouvelle archive", () => {
    const ancienne = construireZip({ "json/A.json": "{}", "json/B.json": "{}" });
    const nouvelle = construireZip({ "json/A.json": "{}" });

    const comparaison = comparerArchives(ancienne, nouvelle);

    expect(comparaison).toEqual({ nouvelles: [], modifiees: [] });
  });
});

describe("estPlfOuPlfss (#126, point 7 / #130)", () => {
  it.each([
    "Projet de loi de finances de l'année",
    "Projet de loi de finances rectificative",
    "Projet de loi de financement de la sécurité sociale",
    "Projet de loi relative aux résultats de la gestion et portant approbation des comptes",
  ])("reconnaît le libellé de procédure %s", (libelle) => {
    expect(estPlfOuPlfss(libelle)).toBe(true);
  });

  it("ne reconnaît pas un libellé de procédure classique", () => {
    expect(estPlfOuPlfss("Projet de loi ordinaire")).toBe(false);
  });

  it("ne reconnaît pas l'absence de libellé", () => {
    expect(estPlfOuPlfss(null)).toBe(false);
  });
});

describe("estVoteDeConscience", () => {
  it("reconnaît un dossierRef de la liste connue", () => {
    expect(estVoteDeConscience("DLR5L17N51670")).toBe(true);
  });

  it("ne reconnaît pas un dossierRef hors liste, ni l'absence de dossierRef", () => {
    expect(estVoteDeConscience("DLR5L17N99999")).toBe(false);
    expect(estVoteDeConscience(null)).toBe(false);
  });
});

describe("raisonsDeDoute", () => {
  it("ne renvoie aucune raison pour un dossier classique déjà rattaché", () => {
    expect(
      raisonsDeDoute({ dossierRef: "DLR5L17N99999", libelleProcedure: "Projet de loi ordinaire" })
    ).toEqual([]);
  });

  it("cumule plusieurs raisons quand elles s'appliquent toutes", () => {
    expect(
      raisonsDeDoute({ dossierRef: "DLR5L17N51670", libelleProcedure: "Projet de loi ordinaire" })
    ).toEqual(["vote-de-conscience"]);

    expect(
      raisonsDeDoute({ dossierRef: null, libelleProcedure: "Projet de loi de finances de l'année" })
    ).toEqual(["dossierRef-absent", "plf-plfss"]);
  });
});
