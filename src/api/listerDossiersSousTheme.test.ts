import { describe, expect, it, vi } from "vitest";
import { createListerDossiersSousTheme } from "@/api/listerDossiersSousTheme";
import type { Dossier, DossierRepository } from "@/domain/dossier";

class FakeDossierRepository implements DossierRepository {
  constructor(private readonly dossiers: Dossier[]) {}

  async getByRef(): Promise<Dossier | null> {
    throw new Error("not used in this test");
  }

  async getBySousTheme(slug: string): Promise<Dossier[]> {
    return this.dossiers.filter((dossier) => dossier.sousTheme === slug);
  }

  async getByTagImpact(tag: string): Promise<Dossier[]> {
    return this.dossiers.filter((dossier) => dossier.tagsImpact.includes(tag));
  }
}

function unDossier(
  dossierRef: string,
  sousTheme: string,
  tagsImpact: string[] = []
): Dossier {
  return {
    dossierRef,
    titre: `Titre ${dossierRef}`,
    sousTheme,
    tagsImpact,
    ficheDossier: { contexte: "C", action: "A", resultatAttendu: "R" },
  };
}

const AGREGATION_FACTICE = vi
  .fn()
  .mockImplementation(async (dossierRefs: string[]) => [
    {
      groupe: { organeRef: "PO1", nom: "G1", abreviation: "G1" },
      decompte: { pour: 1, contre: 0, abstentions: 0 },
      position: "Pour",
      dossierRefs,
    },
  ]);

describe("listerDossiersSousTheme", () => {
  it("associe à chaque dossier du sous-thème sa Position agrégée", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierB = unDossier("DLR5L17B", "cible");
    const dossierRepository = new FakeDossierRepository([dossierA, dossierB]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat).toHaveLength(2);
    expect(resultat[0].dossier).toEqual(dossierA);
    expect(resultat[0].viaTag).toBeNull();
    expect(resultat[0].comparaison[0].position).toBe("Pour");
  });

  it("retourne une liste vide quand aucun dossier n'est classé dans ce sous-thème", async () => {
    const dossierRepository = new FakeDossierRepository([]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE
    );

    const resultat = await listerDossiersSousTheme("vide");

    expect(resultat).toEqual([]);
  });

  it("ajoute les dossiers d'un autre sous-thème qui partagent un Tag d'impact, sans changer leur sous-thème d'appartenance", async () => {
    const dossierPrincipal = unDossier("DLR5L17A", "cible", ["Laïcité"]);
    const dossierRecoupe = unDossier("DLR5L17B", "ailleurs", ["Laïcité"]);
    const dossierRepository = new FakeDossierRepository([
      dossierPrincipal,
      dossierRecoupe,
    ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat).toHaveLength(2);
    const entreePrincipale = resultat.find(
      (r) => r.dossier.dossierRef === "DLR5L17A"
    );
    const entreeRecoupee = resultat.find(
      (r) => r.dossier.dossierRef === "DLR5L17B"
    );
    expect(entreePrincipale?.viaTag).toBeNull();
    expect(entreeRecoupee?.viaTag).toBe("Laïcité");
    // le dossier recoupé garde son propre sous-thème d'appartenance
    expect(entreeRecoupee?.dossier.sousTheme).toBe("ailleurs");
  });

  it("ne duplique pas un dossier déjà présent par ailleurs, ne recoupe pas un dossier du même sous-thème avec lui-même", async () => {
    const dossierA = unDossier("DLR5L17A", "cible", ["Tag"]);
    const dossierB = unDossier("DLR5L17B", "cible", ["Tag"]);
    const dossierRepository = new FakeDossierRepository([dossierA, dossierB]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat.map((r) => r.dossier.dossierRef).sort()).toEqual([
      "DLR5L17A",
      "DLR5L17B",
    ]);
  });
});
