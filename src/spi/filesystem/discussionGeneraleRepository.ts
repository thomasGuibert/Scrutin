import type {
  DiscussionGeneraleRepository,
  InterventionDiscussionGenerale,
} from "@/domain/compteRendu";
import type { ActeurGroupeRepository } from "@/domain/acteur";
// Import relatif, pas "@/..." (contrairement au reste du fichier, en type
// seulement) : ce module est aussi exécuté directement via node par
// scripts/extraire-discussion-generale.ts (cf. son commentaire), qui ne
// résout pas l'alias "@/" — même contrainte que
// scripts/extraire-explications-vote.ts.
import {
  DOSSIER_DONNEES_PAR_DEFAUT,
  MOTIF_FICHIER_PAR_DEFAUT,
  MOTIF_SOMMAIRE1_INTITULE,
  indexerComptesRendusParDate,
  nettoyerTexte,
  scoreCorrespondance,
} from "./compteRenduRepository.ts";

// Contrairement à Explications de vote (bloc <sommaire2> bien délimité,
// juste avant le vote, cf. compteRenduRepository.ts), le <sommaire1> d'un
// compte rendu réel n'est qu'un sommaire/index du document — il ne
// délimite PAS le contenu réel (<paragraphe>) qui le concerne, disséminé
// plus loin dans le fichier sans balise de fin propre (vérifié sur un cas
// réel : tenter de borner l'extraction entre deux positions de <sommaire1>
// coupe le fichier bien avant la fin réelle des échanges — cf. issue #87).
//
// On se contente donc de vérifier qu'AU MOINS UN <sommaire1> du fichier
// correspond au dossier recherché (même heuristique de score que
// getExplicationsVote), puis on scanne l'intégralité du fichier pour toute
// intervention nommée avec un id d'acteur résolvable. Un compte rendu
// (fichier .xml individuel dans les archives compteRendu*.zip) couvre en
// pratique un nombre restreint de sujets — le risque de capter, en plus,
// des échanges sans rapport traités dans le même fichier est accepté :
// ce module fournit une matière première à trier manuellement, pas un
// résultat garanti exhaustif ni garanti pur comme Explications de vote.
const MOTIF_PARAGRAPHE_ORATEUR =
  /<paragraphe\b[^>]*>\s*<orateurs>\s*<orateur>\s*<nom>([^<]*)<\/nom>\s*<id>(\d*)<\/id>[\s\S]*?<\/orateur>\s*<\/orateurs>\s*<texte[^>]*>([\s\S]*?)<\/texte>\s*<\/paragraphe>/g;

// Le meilleur score de correspondance entre dossierTitre et n'importe quel
// intitulé de <sommaire1> du fichier — pas la position, seulement une
// mesure de pertinence du fichier dans son ensemble pour ce dossier.
function meilleurScoreFichier(xml: string, dossierTitre: string): number {
  let meilleur = 0;
  for (const match of xml.matchAll(MOTIF_SOMMAIRE1_INTITULE)) {
    const score = scoreCorrespondance(dossierTitre, nettoyerTexte(match[1]));
    if (score > meilleur) {
      meilleur = score;
    }
  }
  return meilleur;
}

// Même heuristique de désambiguïsation que
// FilesystemCompteRenduRepository.getExplicationsVote (score minimal 2,
// jamais d'égalité retenue) — appliquée par FICHIER (un fichier = une
// séance ou portion de séance), pas par section interne.
const SCORE_MINIMAL = 2;

// Extrait les interventions nommées attribuables à un Groupe parlementaire
// du/des fichier(s) les plus pertinents pour un dossier donné à une date
// donnée (issue #87, ADR-0003) — source complémentaire à Explications de
// vote (compteRenduRepository.ts) pour les scrutins décisifs qui n'ont
// aucun bloc "Explications de vote" exploitable.
export class FilesystemDiscussionGeneraleRepository
  implements DiscussionGeneraleRepository
{
  private indexParDate: Map<string, string[]> | null = null;

  constructor(
    private readonly acteurGroupeRepository: ActeurGroupeRepository,
    private readonly dossierDonnees: string = DOSSIER_DONNEES_PAR_DEFAUT,
    private readonly motifFichier: RegExp = MOTIF_FICHIER_PAR_DEFAUT
  ) {}

  private getIndexParDate(): Map<string, string[]> {
    if (!this.indexParDate) {
      this.indexParDate = indexerComptesRendusParDate(
        this.dossierDonnees,
        this.motifFichier
      );
    }
    return this.indexParDate;
  }

  async getInterventions(
    dateSeance: string,
    dossierTitre: string
  ): Promise<InterventionDiscussionGenerale[] | null> {
    const fichiersDuJour = this.getIndexParDate().get(dateSeance) ?? [];
    if (fichiersDuJour.length === 0) {
      return null;
    }

    const scores = fichiersDuJour.map((xml) => ({
      xml,
      score: meilleurScoreFichier(xml, dossierTitre),
    }));
    scores.sort((a, b) => b.score - a.score);

    const meilleur = scores[0];
    if (!meilleur || meilleur.score < SCORE_MINIMAL) {
      return null;
    }
    if (scores.length > 1 && scores[1].score === meilleur.score) {
      return null;
    }

    const interventions: InterventionDiscussionGenerale[] = [];
    for (const match of meilleur.xml.matchAll(MOTIF_PARAGRAPHE_ORATEUR)) {
      const [, nom, idActeur, texteBrut] = match;
      // Orateur sans id numérique (ex. "Un député du groupe LFI-NFP",
      // anonymisé côté SYCERON) : pas rattachable à un groupe via
      // ActeurGroupeRepository, écarté plutôt que mal attribué.
      if (!idActeur) {
        continue;
      }
      const groupe = this.acteurGroupeRepository.groupeAuMoment(
        idActeur,
        dateSeance
      );
      if (!groupe) {
        continue;
      }
      const texte = nettoyerTexte(texteBrut);
      if (texte.length === 0) {
        continue;
      }
      interventions.push({ groupe, orateur: nom.trim(), texte });
    }

    return interventions.length > 0 ? interventions : null;
  }
}
