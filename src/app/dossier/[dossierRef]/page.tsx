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
      <h1>{dossier.titre}</h1>

      <h2>Contexte</h2>
      <p>{dossier.ficheDossier.contexte}</p>

      <h2>Action</h2>
      <p>{dossier.ficheDossier.action}</p>

      <h2>Résultat attendu</h2>
      <p>{dossier.ficheDossier.resultatAttendu}</p>
    </main>
  );
}
