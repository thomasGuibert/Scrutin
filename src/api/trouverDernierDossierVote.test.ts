import { describe, expect, it } from "vitest";
import { createTrouverDernierDossierVote } from "@/api/trouverDernierDossierVote";
import type { Dossier, DossierRepository } from "@/domain/dossier";
import type { Scrutin } from "@/domain/scrutin";

class FakeDossierRepository implements DossierRepository {
  constructor(private readonly dossiers: Dossier[]) {}

  async getAll(): Promise<Dossier[]> {
    return this.dossiers;
  }

  async getByRef(): Promise<Dossier | null> {
    throw new Error("not used in this test");
  }

  async getBySousTheme(): Promise<Dossier[]> {
    throw new Error("not used in this test");
  }

  async getByTagImpact(): Promise<Dossier[]> {
    throw new Error("not used in this test");
  }
}

function dossier(dossierRef: string): Dossier {
  return {
    dossierRef,
    titre: `Dossier ${dossierRef}`,
    sousTheme: "sous-theme-test",
    tagsImpact: [],
    ficheDossier: { contexte: "", action: "", resultatAttendu: "" },
  };
}

function scrutin(numero: number, titre: string): Scrutin {
  return {
    uid: `VTANR5L17V${numero}`,
    titre,
    date: "2026-01-01",
    numero,
    dossierRef: null,
    decompte: { pour: 1, contre: 0, abstentions: 0 },
    positionsParGroupe: [],
    resultat: "adopté",
  };
}

const ENSEMBLE = "l'ensemble de la proposition de loi visant à tester (première lecture).";
const AMENDEMENT = "l'amendement n° 12 de M. Test à l'article 2 de la proposition de loi visant à tester (première lecture).";

describe("trouverDernierDossierVote", () => {
  it("retient le dossier dont le scrutin décisif est le plus récent, en ignorant les dossiers sans scrutin décisif", async () => {
    const scrutinsParDossier: Record<string, Scrutin[]> = {
      ANCIEN: [scrutin(100, ENSEMBLE)],
      RECENT: [scrutin(200, ENSEMBLE), scrutin(210, AMENDEMENT)],
      EN_COURS: [scrutin(300, AMENDEMENT)],
    };
    const trouver = createTrouverDernierDossierVote(
      new FakeDossierRepository([dossier("ANCIEN"), dossier("RECENT"), dossier("EN_COURS")]),
      async (ref) => scrutinsParDossier[ref] ?? []
    );

    const resultat = await trouver();

    expect(resultat?.dossier.dossierRef).toBe("RECENT");
    expect(resultat?.scrutinDecisif.numero).toBe(200);
  });

  it("retourne null quand aucun dossier n'a de scrutin décisif", async () => {
    const trouver = createTrouverDernierDossierVote(
      new FakeDossierRepository([dossier("EN_COURS")]),
      async () => [scrutin(300, AMENDEMENT)]
    );

    expect(await trouver()).toBeNull();
  });
});
