export type Scrutin = {
  uid: string;
  titre: string;
};

export interface ScrutinRepository {
  getByUid(uid: string): Promise<Scrutin | null>;
}
