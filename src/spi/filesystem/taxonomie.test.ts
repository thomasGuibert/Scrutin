import { describe, expect, it } from "vitest";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";

describe("DeclaredTaxonomyRepository", () => {
  it("retrouve un sous-thème réel déclaré, quel que soit le thème racine qui le porte", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("reparation-memorielle")).toEqual({
      slug: "reparation-memorielle",
      nom: "Réparation et reconnaissance mémorielle",
      type: "consensuel",
      branche: null,
    });
  });

  it("retourne undefined pour un slug de sous-thème inconnu", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("slug-inconnu")).toBeUndefined();
  });
});
