import type { ScrutinRepository } from "@/domain/scrutin";

export function createGetScrutin(repository: ScrutinRepository) {
  return function getScrutin(uid: string) {
    return repository.getByUid(uid);
  };
}
