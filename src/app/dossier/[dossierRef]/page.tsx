import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { createAgregerPositionsDossier } from "@/api/agregerPositionsDossier";
import { createGetDossier } from "@/api/getDossier";
import { createListerScrutinsDossier } from "@/api/listerScrutinsDossier";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const scrutinRepository = new FilesystemScrutinRepository();
const getDossier = createGetDossier(new FilesystemDossierRepository());
const listerScrutinsDossier = createListerScrutinsDossier(scrutinRepository);
const agregerPositionsDossier = createAgregerPositionsDossier(
  scrutinRepository,
  new FilesystemGroupeRepository()
);

export function generateStaticParams() {
  return [{ dossierRef: "DLR5L17N52767" }];
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ dossierRef: string }>;
}) {
  const { dossierRef } = await params;
  const dossier = await getDossier(dossierRef);

  if (!dossier) {
    notFound();
  }

  const [comparaison, scrutins] = await Promise.all([
    agregerPositionsDossier(dossierRef),
    listerScrutinsDossier(dossierRef),
  ]);

  return (
    <main>
      <h1 className="page-title">{dossier.titre}</h1>

      <div className="dossier-brief">
        <div>
          <span className="brief-label">Contexte</span>
          {dossier.ficheDossier.contexte}
        </div>
        <div>
          <span className="brief-label">Action</span>
          {dossier.ficheDossier.action}
        </div>
        <div>
          <span className="brief-label">Résultat attendu</span>
          {dossier.ficheDossier.resultatAttendu}
        </div>
      </div>

      <ComparaisonGroupes
        titre="Position par groupe, sur l'ensemble des scrutins du dossier"
        comparaison={comparaison}
      />

      <p className="cmp-title">
        {scrutins.length} scrutin{scrutins.length > 1 ? "s" : ""} de ce
        dossier
      </p>
      <ul>
        {scrutins.map((scrutin) => (
          <li key={scrutin.uid}>
            <Link href={`/scrutin/${scrutin.uid}`}>{scrutin.titre}</Link>
          </li>
        ))}
      </ul>

      <Link className="back-link" href="/">
        ← Retour
      </Link>
    </main>
  );
}
