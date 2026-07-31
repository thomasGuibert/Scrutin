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

  it("retrouve un sous-thème housekeeping/technique rattaché directement à un thème racine", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverSousTheme("housekeeping-technique")).toEqual({
      slug: "housekeeping-technique",
      nom: "Housekeeping / technique",
      type: "housekeeping",
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
    expect(theme?.branches.map((b) => b.slug)).toEqual([
      "ecole",
      "culture-patrimoine",
    ]);
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
      "acces-ecole",
    ]);
  });

  it("retrouve la branche Culture & patrimoine avec son sous-thème", () => {
    const repository = new DeclaredTaxonomyRepository();

    const resultat = repository.trouverBranche("culture-patrimoine");

    expect(resultat?.theme.slug).toBe("education-culture");
    expect(resultat?.branche.sousThemes.map((s) => s.slug)).toEqual([
      "patrimoine-transmission",
    ]);
  });

  it("retourne undefined pour une branche inconnue", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(repository.trouverBranche("slug-inconnu")).toBeUndefined();
  });

  it("retrouve le contexte d'un sous-thème rattaché à une branche", () => {
    const repository = new DeclaredTaxonomyRepository();

    const contexte = repository.trouverContexteSousTheme("role-civique");

    expect(contexte?.theme.slug).toBe("education-culture");
    expect(contexte?.branche?.slug).toBe("ecole");
    expect(contexte?.sousTheme.slug).toBe("role-civique");
  });

  it("retrouve le contexte d'un sous-thème rattaché directement à un thème racine, sans branche", () => {
    const repository = new DeclaredTaxonomyRepository();

    const contexte = repository.trouverContexteSousTheme(
      "reparation-memorielle"
    );

    expect(contexte?.theme.slug).toBe("souverainete");
    expect(contexte?.branche).toBeNull();
    expect(contexte?.sousTheme.slug).toBe("reparation-memorielle");
  });

  it("retourne undefined pour le contexte d'un sous-thème inconnu", () => {
    const repository = new DeclaredTaxonomyRepository();

    expect(
      repository.trouverContexteSousTheme("slug-inconnu")
    ).toBeUndefined();
  });

  it("liste tous les thèmes racines déclarés, chacun avec sa description", () => {
    const repository = new DeclaredTaxonomyRepository();

    const themes = repository.listerThemes();

    expect(themes.map((t) => t.slug).sort()).toEqual([
      "education-culture",
      "souverainete",
    ]);
    expect(themes.every((t) => t.description.length > 0)).toBe(true);
  });
});
