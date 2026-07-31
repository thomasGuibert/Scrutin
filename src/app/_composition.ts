// Composition root : câble les adaptateurs spi/filesystem aux fonctions
// api, une seule fois. Les routes (app/**/page.tsx) importent d'ici plutôt
// que de reconstruire ce graphe de dépendances chacune de leur côté.
import { createAgregerPositionsDossiers } from "@/api/agregerPositionsDossiers";
import { createAgregerPositionsSousThemes } from "@/api/agregerPositionsSousThemes";
import { createComparerGroupes } from "@/api/comparerGroupes";
import { createGetDossier } from "@/api/getDossier";
import { createGetScrutin } from "@/api/getScrutin";
import { createListerDossiersSousTheme } from "@/api/listerDossiersSousTheme";
import { createListerScrutinsDossier } from "@/api/listerScrutinsDossier";
import { createListerThemesTries } from "@/api/listerThemesTries";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";
import { DeclaredTaxonomyRepository } from "@/spi/filesystem/taxonomie";

export const taxonomyRepository = new DeclaredTaxonomyRepository();
export const scrutinRepository = new FilesystemScrutinRepository();
export const groupeRepository = new FilesystemGroupeRepository();
export const dossierRepository = new FilesystemDossierRepository({
  taxonomyRepository,
});

export const getScrutin = createGetScrutin(scrutinRepository);
export const getDossier = createGetDossier(dossierRepository);
export const comparerGroupes = createComparerGroupes(groupeRepository);
export const listerScrutinsDossier =
  createListerScrutinsDossier(scrutinRepository);
export const agregerPositionsDossiers = createAgregerPositionsDossiers(
  scrutinRepository,
  groupeRepository
);
export const agregerPositionsSousThemes = createAgregerPositionsSousThemes(
  dossierRepository,
  agregerPositionsDossiers
);
export const listerDossiersSousTheme = createListerDossiersSousTheme(
  dossierRepository,
  agregerPositionsDossiers
);
export const listerThemesTries = createListerThemesTries(
  taxonomyRepository,
  dossierRepository
);
