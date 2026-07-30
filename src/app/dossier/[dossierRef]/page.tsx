import Link from "next/link";
import { notFound } from "next/navigation";
import { createGetDossier } from "@/api/getDossier";
import { FilesystemDossierRepository } from "@/spi/filesystem/dossierRepository";

const getDossier = createGetDossier(new FilesystemDossierRepository());

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

      <Link className="back-link" href="/">
        ← Retour
      </Link>
    </main>
  );
}
