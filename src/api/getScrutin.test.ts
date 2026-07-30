import { describe, expect, it } from "vitest";
import { createGetScrutin } from "@/api/getScrutin";
import type { Scrutin, ScrutinRepository } from "@/domain/scrutin";

class FakeScrutinRepository implements ScrutinRepository {
  constructor(private readonly scrutins: Record<string, Scrutin>) {}

  async getByUid(uid: string): Promise<Scrutin | null> {
    return this.scrutins[uid] ?? null;
  }
}

describe("getScrutin", () => {
  it("returns the scrutin the repository holds for that uid", async () => {
    const repository = new FakeScrutinRepository({
      VTANR5L17V1: { uid: "VTANR5L17V1", titre: "Un titre de scrutin" },
    });
    const getScrutin = createGetScrutin(repository);

    const scrutin = await getScrutin("VTANR5L17V1");

    expect(scrutin).toEqual({ uid: "VTANR5L17V1", titre: "Un titre de scrutin" });
  });

  it("returns null when the repository has no such scrutin", async () => {
    const repository = new FakeScrutinRepository({});
    const getScrutin = createGetScrutin(repository);

    const scrutin = await getScrutin("VTANR5L17V999999");

    expect(scrutin).toBeNull();
  });
});
