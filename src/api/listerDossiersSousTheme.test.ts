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

const LISTER_SCRUTINS_FACTICE = vi.fn().mockResolvedValue([]);
const UN_SCRUTIN_FACTICE = vi
  .fn()
  .mockResolvedValue([
    { uid: "V1", titre: "l'article premier de la loi.", numero: 1 },
  ]);

describe("listerDossiersSousTheme", () => {
  it("associe à chaque dossier du sous-thème sa Position agrégée ; des scrutins d'article seuls ne comptent comme aucune lecture (dossier encore en cours d'examen)", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierB = unDossier("DLR5L17B", "cible");
    const dossierRepository = new FakeDossierRepository([dossierA, dossierB]);
    const listerScrutinsDossier = vi.fn().mockResolvedValue([
      { uid: "V1", titre: "l'article premier de la loi.", numero: 1 },
      { uid: "V2", titre: "l'article 2 de la loi.", numero: 2 },
    ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      listerScrutinsDossier
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat).toHaveLength(2);
    expect(resultat[0].dossier).toEqual(dossierA);
    expect(resultat[0].viaTag).toBeNull();
    expect(resultat[0].comparaison[0].position).toBe("Pour");
    expect(resultat[0].nombreLectures).toBe(0);
    expect(resultat[0].scrutinDecisifUnique).toBeNull();
    expect(resultat[0].resultat).toBeNull();
  });

  it("expose le résultat (adopté/rejeté) et l'uid du Scrutin décisif unique du dossier", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierRepository = new FakeDossierRepository([dossierA]);
    const listerScrutinsDossier = vi.fn().mockResolvedValue([
      {
        uid: "V1",
        titre: "l'ensemble de la proposition de loi (première lecture).",
        numero: 1,
        resultat: "adopté",
      },
    ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      listerScrutinsDossier
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat[0].resultat).toBe("adopté");
    expect(resultat[0].nombreLectures).toBe(1);
    expect(resultat[0].scrutinDecisifUnique).toBe("V1");
  });

  it("expose la période (du premier au dernier scrutin du dossier)", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierRepository = new FakeDossierRepository([dossierA]);
    const listerScrutinsDossier = vi.fn().mockResolvedValue([
      {
        uid: "V1",
        titre: "l'article premier de la loi.",
        numero: 1,
        date: "2025-01-15",
      },
      {
        uid: "V2",
        titre: "l'ensemble de la proposition de loi (première lecture).",
        numero: 2,
        date: "2025-06-02",
      },
    ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      listerScrutinsDossier
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat[0].periode).toBe("du 15/01/2025 au 02/06/2025");
    expect(resultat[0].datesScrutins).toEqual(["2025-01-15", "2025-06-02"]);
  });

  it("ne propose pas de Scrutin décisif unique quand le dossier a connu plusieurs lectures", async () => {
    const dossierA = unDossier("DLR5L17A", "cible");
    const dossierRepository = new FakeDossierRepository([dossierA]);
    const listerScrutinsDossier = vi.fn().mockResolvedValue([
      {
        uid: "V1",
        titre: "l'ensemble de la proposition de loi (première lecture).",
        numero: 1,
        resultat: "rejeté",
      },
      {
        uid: "V2",
        titre: "l'ensemble de la proposition de loi (nouvelle lecture).",
        numero: 2,
        resultat: "adopté",
      },
    ]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      listerScrutinsDossier
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat[0].nombreLectures).toBe(2);
    expect(resultat[0].scrutinDecisifUnique).toBeNull();
    // le résultat définitif reste celui du scrutin décisif le plus récent
    expect(resultat[0].resultat).toBe("adopté");
  });

  it("n'affiche pas un dossier sans scrutin (encore en cours d'examen)", async () => {
    const dossierSansScrutin = unDossier("DLR5L17A", "cible");
    const dossierAvecScrutin = unDossier("DLR5L17B", "cible");
    const dossierRepository = new FakeDossierRepository([
      dossierSansScrutin,
      dossierAvecScrutin,
    ]);
    const listerScrutinsDossier = vi
      .fn()
      .mockImplementation(async (dossierRef: string) =>
        dossierRef === "DLR5L17B"
          ? [{ uid: "V1", titre: "l'article premier de la loi.", numero: 1 }]
          : []
      );
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      listerScrutinsDossier
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat.map((r) => r.dossier.dossierRef)).toEqual(["DLR5L17B"]);
  });

  it("retourne une liste vide quand aucun dossier n'est classé dans ce sous-thème", async () => {
    const dossierRepository = new FakeDossierRepository([]);
    const listerDossiersSousTheme = createListerDossiersSousTheme(
      dossierRepository,
      AGREGATION_FACTICE,
      LISTER_SCRUTINS_FACTICE
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
      AGREGATION_FACTICE,
      UN_SCRUTIN_FACTICE
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
      AGREGATION_FACTICE,
      UN_SCRUTIN_FACTICE
    );

    const resultat = await listerDossiersSousTheme("cible");

    expect(resultat.map((r) => r.dossier.dossierRef).sort()).toEqual([
      "DLR5L17A",
      "DLR5L17B",
    ]);
  });
});
