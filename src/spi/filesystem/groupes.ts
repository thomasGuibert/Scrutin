import type { Groupe, GroupeRepository } from "@/domain/groupes";

// Ordre de l'hémicycle, de la gauche vers la droite.
const GROUPES: Groupe[] = [
  {
    organeRef: "PO845413",
    nom: "La France insoumise - Nouveau Front Populaire",
    abreviation: "LFI-NFP",
    ordreHemicycle: 0,
  },
  {
    organeRef: "PO845514",
    nom: "Gauche Démocrate et Républicaine",
    abreviation: "GDR",
    ordreHemicycle: 1,
  },
  {
    organeRef: "PO845439",
    nom: "Écologiste et Social",
    abreviation: "EcoS",
    ordreHemicycle: 2,
  },
  {
    organeRef: "PO845419",
    nom: "Socialistes et apparentés",
    abreviation: "SOC",
    ordreHemicycle: 3,
  },
  {
    organeRef: "PO845485",
    nom: "Libertés, Indépendants, Outre-mer et Territoires",
    abreviation: "LIOT",
    ordreHemicycle: 4,
  },
  {
    organeRef: "PO845454",
    nom: "Les Démocrates",
    abreviation: "Dem",
    ordreHemicycle: 5,
  },
  {
    organeRef: "PO845470",
    nom: "Horizons & Indépendants",
    abreviation: "HOR",
    ordreHemicycle: 6,
  },
  {
    organeRef: "PO845407",
    nom: "Ensemble pour la République",
    abreviation: "EPR",
    ordreHemicycle: 7,
  },
  {
    organeRef: "PO845425",
    nom: "Droite Républicaine",
    abreviation: "DR",
    ordreHemicycle: 8,
  },
  {
    organeRef: "PO872880",
    nom: "Union des droites pour la République",
    abreviation: "UDR",
    ordreHemicycle: 9,
  },
  {
    organeRef: "PO845401",
    nom: "Rassemblement National",
    abreviation: "RN",
    ordreHemicycle: 10,
  },
  {
    organeRef: "PO840056",
    nom: "Non inscrits",
    abreviation: "NI",
    ordreHemicycle: 11,
  },
];

export class FilesystemGroupeRepository implements GroupeRepository {
  trouverGroupe(organeRef: string): Groupe | undefined {
    return GROUPES.find((groupe) => groupe.organeRef === organeRef);
  }
}
