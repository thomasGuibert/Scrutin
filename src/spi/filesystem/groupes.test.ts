import { describe, expect, it } from "vitest";
import { GROUPES, trouverGroupe } from "@/spi/filesystem/groupes";

describe("GROUPES", () => {
  it("contient les 11 groupes parlementaires et les Non-inscrits (12e ligne)", () => {
    expect(GROUPES).toHaveLength(12);
  });
});

describe("trouverGroupe", () => {
  it("retourne le groupe réel pour un organeRef connu", () => {
    expect(trouverGroupe("PO845425")).toEqual({
      organeRef: "PO845425",
      nom: "Droite Républicaine",
      abreviation: "DR",
    });
  });

  it("retourne undefined pour un organeRef inconnu", () => {
    expect(trouverGroupe("PO000000")).toBeUndefined();
  });
});
