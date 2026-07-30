import type { ScrutinRepository } from "@/domain/scrutin";

export function createListerScrutinsDossier(repository: ScrutinRepository) {
  return function listerScrutinsDossier(dossierRef: string) {
    return repository.getByDossierRef(dossierRef);
  };
}
