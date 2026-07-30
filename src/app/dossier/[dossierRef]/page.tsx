import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparaisonGroupes } from "@/app/_components/ComparaisonGroupes";
import { createAgregerPositionsDossier } from "@/api/agregerPositionsDossier";
import { createGetDossier } from "@/api/getDossier";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";
import { FilesystemGroupeRepository } from "@/spi/filesystem/groupes";
import { FilesystemScrutinRepository } from "@/spi/filesystem/scrutinRepository";

const getDossier = createGetDossier(new FilesystemDossierRepository());
const agregerPositionsDossier = createAgregerPositionsDossier(
  new FilesystemScrutinRepository(),
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

  const comparaison = await agregerPositionsDossier(dossierRef);

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

      <Link className="back-link" href="/">
        ← Retour
      </Link>
    </main>
  );
}
