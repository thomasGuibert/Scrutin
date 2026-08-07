import AdmZip from "adm-zip";
import path from "node:path";
import type { ActeurGroupeRepository } from "@/domain/acteur";

const ZIP_PATH_PAR_DEFAUT = path.join(
  process.cwd(),
  "data/raw/an/17/AMO10_deputes_actifs_mandats_actifs_organes.json.zip"
);

// Mêmes 12 organeRef que domain/groupes.ts (Groupe.organeRef), dupliqué ici
// plutôt qu'importé : GroupeRepository ne fait pas le sens inverse
// (organeRef -> sigle), et FilesystemGroupeRepository construit ses Groupe
// complets (nom, ordreHemicycle) pour un usage différent (affichage) — ici
// on ne veut qu'un sigle court pour attribuer une intervention de
// Discussion générale à un groupe (cf. domain/acteur.ts, issue #87).
const SIGLE_PAR_ORGANEREF: Record<string, string> = {
  PO845413: "LFI-NFP",
  PO845514: "GDR",
  PO845439: "EcoS",
  PO845419: "SOC",
  PO845485: "LIOT",
  PO845454: "Dem",
  PO845470: "HOR",
  PO845407: "EPR",
  PO845425: "DR",
  PO872880: "UDR",
  PO845401: "RN",
  PO840056: "NI",
};

type MandatBrut = {
  typeOrgane?: string;
  dateDebut?: string;
  dateFin?: string | null;
  organes?: { organeRef?: string };
};

type MandatGroupe = {
  dateDebut: string;
  dateFin: string | null;
  organeRef: string;
};

// Le référentiel officiel des député·e·s (AMO10, cf. README.md du dossier
// data/raw/an/17) donne pour chaque acteur la liste de tous ses mandats
// (commission, délégation, groupe parlementaire...) — seul le mandat de
// type "GP" (Groupe Parlementaire) intéresse ce repository, et seulement
// celui actif à une date donnée : un·e même député·e peut avoir appartenu
// à des groupes différents en cours de législature (ex. création de
// l'UDR fin 2024 — vérifié sur des cas réels lors de l'exploration #87).
export class FilesystemActeurGroupeRepository implements ActeurGroupeRepository {
  private index: Map<string, MandatGroupe[]> | null = null;

  constructor(private readonly zipPath: string = ZIP_PATH_PAR_DEFAUT) {}

  private getIndex(): Map<string, MandatGroupe[]> {
    if (!this.index) {
      const index = new Map<string, MandatGroupe[]>();
      let zip: AdmZip;
      try {
        zip = new AdmZip(this.zipPath);
      } catch {
        this.index = index;
        return index;
      }

      for (const entry of zip.getEntries()) {
        if (entry.isDirectory || !entry.entryName.startsWith("json/acteur/PA")) {
          continue;
        }

        let data: { acteur?: { uid?: { "#text"?: string }; mandats?: { mandat?: MandatBrut | MandatBrut[] } } };
        try {
          data = JSON.parse(entry.getData().toString("utf-8"));
        } catch {
          continue;
        }

        const uid = data.acteur?.uid?.["#text"];
        if (!uid) {
          continue;
        }
        const idActeur = uid.replace(/^PA/, "");

        const mandatsBrut = data.acteur?.mandats?.mandat;
        const mandats: MandatBrut[] = Array.isArray(mandatsBrut)
          ? mandatsBrut
          : mandatsBrut
            ? [mandatsBrut]
            : [];

        const mandatsGroupe: MandatGroupe[] = [];
        for (const mandat of mandats) {
          const organeRef = mandat.organes?.organeRef;
          if (
            mandat.typeOrgane !== "GP" ||
            !mandat.dateDebut ||
            !organeRef ||
            !(organeRef in SIGLE_PAR_ORGANEREF)
          ) {
            continue;
          }
          mandatsGroupe.push({
            dateDebut: mandat.dateDebut,
            dateFin: mandat.dateFin ?? null,
            organeRef,
          });
        }

        if (mandatsGroupe.length > 0) {
          index.set(idActeur, mandatsGroupe);
        }
      }

      this.index = index;
    }

    return this.index;
  }

  groupeAuMoment(idActeur: string, dateISO: string): string | null {
    const mandats = this.getIndex().get(idActeur);
    if (!mandats) {
      return null;
    }

    for (const mandat of mandats) {
      const fin = mandat.dateFin ?? "9999-12-31";
      if (dateISO >= mandat.dateDebut && dateISO <= fin) {
        return SIGLE_PAR_ORGANEREF[mandat.organeRef] ?? null;
      }
    }

    return null;
  }
}
