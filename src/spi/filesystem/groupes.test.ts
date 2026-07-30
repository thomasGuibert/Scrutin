import { describe, expect, it } from "vitest";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";

describe("FilesystemGroupeRepository", () => {
  it("retourne le groupe réel pour un organeRef connu", () => {
    const repository = new FilesystemGroupeRepository();

    expect(repository.trouverGroupe("PO845425")).toEqual({
      organeRef: "PO845425",
      nom: "Droite Républicaine",
      abreviation: "DR",
      ordreHemicycle: 8,
    });
  });

  it("retourne undefined pour un organeRef inconnu", () => {
    const repository = new FilesystemGroupeRepository();

    expect(repository.trouverGroupe("PO000000")).toBeUndefined();
  });

  it("connaît les 11 groupes parlementaires et les Non-inscrits (12e ligne)", () => {
    const repository = new FilesystemGroupeRepository();

    expect(repository.trouverGroupe("PO840056")).toEqual({
      organeRef: "PO840056",
      nom: "Non inscrits",
      abreviation: "NI",
      ordreHemicycle: 11,
    });
  });

  it("place LFI-NFP le plus à gauche et Non-inscrits le plus à droite", () => {
    const repository = new FilesystemGroupeRepository();

    expect(repository.trouverGroupe("PO845413")?.ordreHemicycle).toBe(0);
    expect(repository.trouverGroupe("PO840056")?.ordreHemicycle).toBe(11);
  });
});
