import type { ScrutinRepository } from "@/domain/scrutin";

export function createListerScrutinsDossier(repository: ScrutinRepository) {
  return async function listerScrutinsDossier(dossierRef: string) {
    const scrutins = await repository.getByDossierRef(dossierRef);

    // Ordre chronologique : reflète la lecture du dossier (première lecture,
    // deuxième lecture, vote solennel...), pas l'ordre de l'archive source.
    // Le numéro de scrutin départage les scrutins du même jour — l'export AN
    // ne fournit pas d'heure plus précise que la date.
    return [...scrutins].sort(
      (a, b) => a.date.localeCompare(b.date) || a.numero - b.numero
    );
  };
}
