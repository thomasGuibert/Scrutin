// Fusion sûre d'une archive de curation régénérée (ExplicationsVote ou
// DiscussionGenerale) dans l'archive commitée — sans jamais écraser une
// entrée déjà présente.
//
// Nécessaire car les scripts scripts/extraire-explications-vote.ts et
// scripts/extraire-discussion-generale.ts ne détectent que les
// correspondances mécaniques (titre/date) ; une bonne partie du contenu
// commité vient de curation éditoriale manuelle par lots (historique git :
// "Curation lot N (#95)"). Un rejeu à blanc écrasant directement l'archive
// commitée régénère un résultat *plus pauvre* que l'existant (vérifié le
// 2026-08-18 : 127 dossiers couverts contre 197 pour ExplicationsVote — cf.
// data/raw/an/17/README.md) et effacerait ce travail de curation.
//
// Règle : un dossier absent de l'archive commitée est ajouté tel quel ; un
// scrutin absent des `scrutins` d'un dossier déjà connu est ajouté ; tout
// le reste (déjà curé) reste identique au byte près (jamais reparsé/
// réécrit) — utilisé par scripts/fusionner-curation-an.ts (#126).

import AdmZip from "adm-zip";

type ContenuDossier = {
  dossierRef: string;
  scrutins: Record<string, unknown>;
};

export type RapportFusion = {
  dossiersAjoutes: string[];
  scrutinsAjoutes: Array<{ dossierRef: string; scrutinUid: string }>;
};

function nomVersDossierRef(entryName: string): string | null {
  const match = entryName.match(/^json\/(.+)\.json$/);
  return match ? match[1] : null;
}

// Fusionne `nouveauBuffer` (sortie fraîchement régénérée) dans
// `ancienBuffer` (archive commitée) et renvoie le zip fusionné, prêt à
// écrire tel quel. Ne modifie jamais une entrée déjà présente dans
// `ancienBuffer` — vérifié par une assertion d'égalité avant d'inclure
// quoi que ce soit dans le zip résultat.
export function fusionnerArchives(
  ancienBuffer: Buffer,
  nouveauBuffer: Buffer
): { zip: AdmZip; rapport: RapportFusion } {
  const ancienZip = new AdmZip(ancienBuffer);
  const nouveauZip = new AdmZip(nouveauBuffer);

  const dossiersAjoutes: string[] = [];
  const scrutinsAjoutes: Array<{ dossierRef: string; scrutinUid: string }> = [];

  const ancienEntries = new Map(
    ancienZip.getEntries().map((entry) => [entry.entryName, entry])
  );

  const zipFusionne = new AdmZip();
  for (const entry of ancienZip.getEntries()) {
    if (!entry.isDirectory) {
      zipFusionne.addFile(entry.entryName, entry.getData());
    }
  }

  for (const nouvelleEntree of nouveauZip.getEntries()) {
    if (nouvelleEntree.isDirectory) {
      continue;
    }
    const dossierRef = nomVersDossierRef(nouvelleEntree.entryName);
    if (!dossierRef) {
      continue;
    }

    const ancienneEntree = ancienEntries.get(nouvelleEntree.entryName);

    if (!ancienneEntree) {
      // Dossier entièrement nouveau : ajouté tel quel (mêmes octets que
      // produits par le script d'extraction).
      zipFusionne.addFile(nouvelleEntree.entryName, nouvelleEntree.getData());
      dossiersAjoutes.push(dossierRef);
      continue;
    }

    const ancienContenu = JSON.parse(
      ancienneEntree.getData().toString("utf-8")
    ) as ContenuDossier;
    const nouveauContenu = JSON.parse(
      nouvelleEntree.getData().toString("utf-8")
    ) as ContenuDossier;

    let modifie = false;
    for (const [uid, valeur] of Object.entries(nouveauContenu.scrutins ?? {})) {
      if (!(uid in ancienContenu.scrutins)) {
        ancienContenu.scrutins[uid] = valeur;
        modifie = true;
        scrutinsAjoutes.push({ dossierRef, scrutinUid: uid });
      }
    }

    if (modifie) {
      zipFusionne.updateFile(
        nouvelleEntree.entryName,
        Buffer.from(JSON.stringify(ancienContenu, null, 2), "utf-8")
      );
    }
  }

  return { zip: zipFusionne, rapport: { dossiersAjoutes, scrutinsAjoutes } };
}
