import type { Groupe, GroupeRepository } from "@/domain/groupes";

const GROUPES: Groupe[] = [
  { organeRef: "PO845401", nom: "Rassemblement National", abreviation: "RN" },
  {
    organeRef: "PO845407",
    nom: "Ensemble pour la République",
    abreviation: "EPR",
  },
  {
    organeRef: "PO845413",
    nom: "La France insoumise - Nouveau Front Populaire",
    abreviation: "LFI-NFP",
  },
  { organeRef: "PO845419", nom: "Socialistes et apparentés", abreviation: "SOC" },
  { organeRef: "PO845425", nom: "Droite Républicaine", abreviation: "DR" },
  { organeRef: "PO845439", nom: "Écologiste et Social", abreviation: "EcoS" },
  { organeRef: "PO845454", nom: "Les Démocrates", abreviation: "Dem" },
  {
    organeRef: "PO845470",
    nom: "Horizons & Indépendants",
    abreviation: "HOR",
  },
  {
    organeRef: "PO845485",
    nom: "Libertés, Indépendants, Outre-mer et Territoires",
    abreviation: "LIOT",
  },
  {
    organeRef: "PO845514",
    nom: "Gauche Démocrate et Républicaine",
    abreviation: "GDR",
  },
  {
    organeRef: "PO872880",
    nom: "Union des droites pour la République",
    abreviation: "UDR",
  },
  { organeRef: "PO840056", nom: "Non inscrits", abreviation: "NI" },
];

export class FilesystemGroupeRepository implements GroupeRepository {
  trouverGroupe(organeRef: string): Groupe | undefined {
    return GROUPES.find((groupe) => groupe.organeRef === organeRef);
  }
}
