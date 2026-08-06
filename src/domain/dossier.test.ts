import { describe, expect, it } from "vitest";
import { lienDossierAN } from "@/domain/dossier";

describe("lienDossierAN", () => {
  it("construit l'URL de la fiche officielle à partir du dossierRef et de la législature qu'il encode", () => {
    expect(lienDossierAN("DLR5L17N53980")).toBe(
      "https://www.assemblee-nationale.fr/dyn/17/dossiers/DLR5L17N53980"
    );
  });

  it("s'adapte à une autre législature encodée dans le dossierRef", () => {
    expect(lienDossierAN("DLR5L16N49868")).toBe(
      "https://www.assemblee-nationale.fr/dyn/16/dossiers/DLR5L16N49868"
    );
  });

  it("retombe sur la législature 17 si le format du dossierRef est inattendu", () => {
    expect(lienDossierAN("REF-INCONNUE")).toBe(
      "https://www.assemblee-nationale.fr/dyn/17/dossiers/REF-INCONNUE"
    );
  });
});
