import { describe, expect, it } from "vitest";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";

describe("FilesystemGroupeRepository", () => {
  it("retourne le groupe réel pour un organeRef connu", () => {
    const repository = new FilesystemGroupeRepository();

    expect(repository.trouverGroupe("PO845425")).toEqual({
      organeRef: "PO845425",
      nom: "Droite Républicaine",
      abreviation: "DR",
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
    });
  });
});
