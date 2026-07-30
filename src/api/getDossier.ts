import type { DossierRepository } from "@/domain/dossier";

export function createGetDossier(repository: DossierRepository) {
  return function getDossier(dossierRef: string) {
    return repository.getByRef(dossierRef);
  };
}
