import { describe, expect, it } from "vitest";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";

describe("DeclaredTaxonomyRepository", () => {
  it("retrouve un sous-thème rattaché directement à un thème racine, sans branche", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("reparation-memorielle")).toEqual({
      slug: "reparation-memorielle",
      nom: "Réparation et reconnaissance mémorielle",
      type: "consensuel",
    });
  });

  it("retrouve un sous-thème rattaché à une branche", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("role-civique")).toEqual({
      slug: "role-civique",
      nom: "Rôle de l'école dans la formation civique et patriotique",
      type: "consensuel",
    });
  });

  it("retourne undefined pour un slug de sous-thème inconnu", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("slug-inconnu")).toBeUndefined();
  });

  it("retrouve un thème racine réel par son slug", () => {
    const repository = new DeclaredTaxonomyRepository();

    const theme = repository.trouverTheme("education-culture");

    expect(theme?.nom).toBe("Éducation & culture");
    expect(theme?.branches.map((b) => b.slug)).toEqual(["ecole"]);
  });

  it("retourne undefined pour un thème racine inconnu", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverTheme("slug-inconnu")).toBeUndefined();
  });

  it("retrouve une branche réelle par son slug, avec le thème racine qui la porte", () => {
    const repository = new DeclaredTaxonomyRepository();

    const resultat = repository.trouverBranche("ecole");

    expect(resultat?.theme.slug).toBe("education-culture");
    expect(resultat?.branche.nom).toBe("École");
    expect(resultat?.branche.sousThemes.map((s) => s.slug)).toEqual([
      "role-civique",
    ]);
  });

  it("retourne undefined pour une branche inconnue", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverBranche("slug-inconnu")).toBeUndefined();
  });
});
