import AdmZip from "adm-zip";
import { readdirSync } from "node:fs";
import path from "node:path";
import type { CompteRenduRepository, ExplicationVote } from "@/domain/compteRendu";

export const DOSSIER_DONNEES_PAR_DEFAUT = path.join(process.cwd(), "data/raw/an/17");
export const MOTIF_FICHIER_PAR_DEFAUT = /^compteRendu.*\.zip$/;

// Les formes de titre de bloc "Vote sur ..." observées dans les comptes
// rendus pour un vote sur le texte entier (cf. estVoteSurLeTexteEntier,
// domain/scrutin.ts — même liste, vocabulaire différent côté SYCERON). Une
// proposition de résolution (article unique côté export AN, cf.
// estVoteSurArticleUnique) porte tantôt "Vote sur l'article unique", tantôt
// "Vote sur la proposition de résolution" — les deux formulations désignent
// le même vote décisif, vérifié sur les 14 occurrences de la seconde forme
// (toutes des propositions de résolution, aucune autre nature de vote,
// cf. issue #96).
const INTITULE_VOTE_TEXTE_ENTIER =
  /^Vote sur l['’](ensemble|article unique)|^Vote sur le texte lui-même|^Vote sur la proposition de résolution/i;

type Candidat = {
  intituleSommaire1: string;
  blocExplications: string;
};

// "les" et "personnes" manquaient ici (trouvés sur des cas réels, cf.
// issue #62) : deux dossiers sans rapport de fond, discutés le même jour,
// partagent très souvent l'un de ces deux mots ("les" par pure fréquence
// grammaticale ; "personnes" parce que de nombreux textes de réparation/
// reconnaissance parlent de "personnes condamnées", quel que soit le
// motif de la condamnation — vérifié sur un cas réel où un texte sur les
// réparations liées à l'avortement héritait ainsi du texte d'un tout autre
// dossier sur les réparations liées à l'homosexualité). Mots vides, comme
// "le"/"la"/"l'" déjà présents — voir aussi le seuil minimal dans
// getExplicationsVote, qui complète ce filtrage.
const MOTS_VIDES = new Set([
  "de", "la", "le", "les", "du", "des", "à", "a", "et", "un", "une", "l", "d",
  "au", "aux", "sur", "en", "pour", "dans", "par", "ce", "cette", "que", "qui",
  "son", "ses", "leur", "leurs", "personnes",
]);

// Comparaison volontairement simple (comptage de mots significatifs
// partagés, sans lemmatisation) — suffisant pour départager quelques
// dossiers discutés le même jour, pas un moteur de recherche. Voir
// getExplicationsVote pour le seuil qui écarte les correspondances trop
// faibles ou ambiguës. Exportée : réutilisée telle quelle par
// discussionGeneraleRepository.ts (même heuristique de correspondance
// titre dossier / intitulé sommaire1, cf. issue #87).
export function motsSignificatifs(texte: string): Set<string> {
  return new Set(
    texte
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot))
  );
}

export function scoreCorrespondance(titreDossier: string, titreSommaire1: string): number {
  const motsDossier = motsSignificatifs(titreDossier);
  const motsSommaire = motsSignificatifs(titreSommaire1);
  let communs = 0;
  for (const mot of motsDossier) {
    if (motsSommaire.has(mot)) {
      communs++;
    }
  }
  return communs;
}

// Retire les balises de mise en forme XML (italique, exposant, saut de
// ligne...) d'un fragment <texte> tout en gardant leur contenu textuel —
// même principe que htmlVersTexte (amendementRepository.ts), adapté à ce
// format : pas d'entités numériques doublement échappées ici (le XML source
// est déjà en UTF-8 littéral), juste les entités XML standard à décoder par
// prudence.
export function nettoyerTexte(xml: string): string {
  return xml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Un fichier compte rendu = une séance entière : plusieurs sujets discutés
// (chacun un <sommaire1>), et pour chacun, éventuellement un bloc
// "Explications de vote" immédiatement suivi d'un bloc "Vote sur ..." (cf.
// domain/compteRendu.ts). Repéré en 2 motifs séparés plutôt qu'un seul motif
// combiné avec un groupe répété contenant un ".*?" (`(?:<para...>[\s\S]*?
// </para>\s*)*`) : ce genre de motif est sujet au backtracking
// catastrophique dès que le contenu réel s'écarte un peu de la forme
// attendue (vérifié en pratique — plusieurs minutes, voire un blocage,
// sur un fichier réel de ~700 Ko). Pas de parseur XML dans ce projet (cf.
// amendementRepository.ts, même choix pour du JSON/HTML), mais un motif
// combiné n'était pas nécessaire ici : chaque sous-motif ci-dessous ne
// contient qu'un seul ".*?" isolé, jamais répété — sans risque équivalent.
// "Explications? de vote" — le singulier existe bel et bien côté SYCERON
// (14 occurrences sur l'ensemble des archives, vérifié le 2026-08-09,
// cf. issue #96) pour des scrutins avec un nombre restreint d'orateur·ices,
// sans distinction de sens avec le pluriel habituel.
const MOTIF_BLOC_EXPLICATIONS_VOTE =
  /<sommaire2>\s*<titreStruct[^>]*>\s*<intitule>Explications? de vote[^<]*<\/intitule>\s*<\/titreStruct>([\s\S]*?)<\/sommaire2>/g;

// Recherché seulement juste après un bloc Explications de vote (cf.
// trouverCandidats) — une fenêtre de quelques centaines de caractères
// suffit très largement pour ne pas retomber dans le même écueil sur un
// balayage plein document.
//
// Le groupe capturant va jusqu'à `</intitule>`, pas seulement jusqu'à la
// première balise (`[^<]*`) : quand 2 textes sont votés le même jour, leurs
// "Vote sur l'ensemble" respectifs sont distingués par un suffixe entre
// parenthèses mis en italique juste après "l'ensemble" (ex. "Vote sur
// l'ensemble<italique> (accompagnement et soins palliatifs)</italique>") —
// avec `[^<]*`, la capture s'arrêtait net à cette balise et le test
// INTITULE_VOTE_TEXTE_ENTIER ci-dessous ne voyait jamais que la chaîne vide,
// faisant disparaître tout le bloc Explications de vote associé (cas réel :
// le vote sur le texte "Droit à l'aide à mourir" du 25 février 2026, voté le
// même jour que "Accompagnement et soins palliatifs" avec des Explications
// de vote communes aux deux textes). Le test ci-dessous n'ancre qu'en début
// de chaîne (`^Vote sur l'ensemble`), donc peu importe qu'elle contienne
// aussi la suite balisée du suffixe.
const LONGUEUR_FENETRE_SOMMAIRE2_SUIVANT = 500;
const MOTIF_INTITULE_SOMMAIRE2_SUIVANT =
  /^\s*<sommaire2>\s*<titreStruct[^>]*>\s*<intitule>([\s\S]*?)<\/intitule>/;

export const MOTIF_SOMMAIRE1_INTITULE = /<sommaire1\b[^>]*>\s*<titreStruct[^>]*>\s*<intitule>([\s\S]*?)<\/intitule>/g;

function extraireTexteIntitule(fragmentXml: string): string {
  // Un intitule peut contenir des balises inline (ex. <exposant>e</exposant>
  // pour "XVIIe") — on ne garde que le texte, comme pour un <texte>.
  return nettoyerTexte(fragmentXml);
}

// Le titre du sujet discuté (<sommaire1>) le plus proche AVANT la position
// donnée dans le document — sert à savoir de quel dossier parle une paire
// Explications de vote/Vote (ou, dans discussionGeneraleRepository.ts, une
// section Discussion générale) trouvée plus loin dans le fichier. Exportée
// pour la même raison que scoreCorrespondance ci-dessus (issue #87).
export function trouverIntituleSommaire1Precedent(
  xml: string,
  position: number
): string | null {
  let dernier: string | null = null;
  for (const match of xml.matchAll(MOTIF_SOMMAIRE1_INTITULE)) {
    if (match.index === undefined || match.index >= position) {
      break;
    }
    dernier = extraireTexteIntitule(match[1]);
  }
  return dernier;
}

function trouverCandidats(xml: string): Candidat[] {
  const candidats: Candidat[] = [];

  for (const match of xml.matchAll(MOTIF_BLOC_EXPLICATIONS_VOTE)) {
    const blocExplications = match[1];
    const finBloc = (match.index ?? 0) + match[0].length;
    const fenetre = xml.slice(finBloc, finBloc + LONGUEUR_FENETRE_SOMMAIRE2_SUIVANT);

    const suite = fenetre.match(MOTIF_INTITULE_SOMMAIRE2_SUIVANT);
    if (!suite) {
      continue;
    }
    const intituleVote = suite[1];
    if (!INTITULE_VOTE_TEXTE_ENTIER.test(intituleVote.trim())) {
      continue;
    }

    const intituleSommaire1 = trouverIntituleSommaire1Precedent(
      xml,
      match.index ?? 0
    );
    if (!intituleSommaire1) {
      continue;
    }

    candidats.push({ intituleSommaire1, blocExplications });
  }

  return candidats;
}

const MOTIF_PARA_ORATEUR = /<para\b[^>]*\bid_syceron="(\d+)"[^>]*>([^<]*)<\/para>/g;

function parserOrateurs(
  blocExplications: string
): { idSyceron: string; orateur: string; groupe: string }[] {
  const resultat: { idSyceron: string; orateur: string; groupe: string }[] = [];

  for (const match of blocExplications.matchAll(MOTIF_PARA_ORATEUR)) {
    const [, idSyceron, contenu] = match;
    // "M. Yoann Gillet (RN)" — un rapporteur/ministre sans groupe entre
    // parenthèses (ex. "M. le ministre") n'est pas une Position de Groupe
    // parlementaire au sens de CONTEXT.md, donc écarté plutôt que mal
    // attribué à un faux groupe.
    const attribution = contenu.trim().match(/^(.*)\(([^()]+)\)\s*$/);
    if (!attribution) {
      continue;
    }
    resultat.push({
      idSyceron,
      orateur: attribution[1].trim(),
      groupe: attribution[2].trim(),
    });
  }

  return resultat;
}

function trouverTexteParagraphe(xml: string, idSyceron: string): string | null {
  const motif = new RegExp(
    `<paragraphe\\b[^>]*\\bid_syceron="${idSyceron}"[^>]*>([\\s\\S]*?)<\\/paragraphe>`
  );
  const match = xml.match(motif);
  if (!match) {
    return null;
  }

  const texteMatch = match[1].match(/<texte\b[^>]*>([\s\S]*?)<\/texte>/);
  if (!texteMatch) {
    return null;
  }

  const texte = nettoyerTexte(texteMatch[1]);
  return texte.length > 0 ? texte : null;
}

export function dateSeanceVersISO(xml: string): string | null {
  const match = xml.match(/<dateSeance>(\d{8})/);
  if (!match) {
    return null;
  }
  const [, brut] = match;
  return `${brut.slice(0, 4)}-${brut.slice(4, 6)}-${brut.slice(6, 8)}`;
}

// Les archives (data/raw/an/17/compteRendu*.zip — plusieurs lots au fil du
// temps, cf. issue #52) indexées par date de séance — exportée pour être
// réutilisée par discussionGeneraleRepository.ts (issue #87), qui a besoin
// du même index sans dupliquer la lecture des .zip.
export function indexerComptesRendusParDate(
  dossierDonnees: string,
  motifFichier: RegExp
): Map<string, string[]> {
  const index = new Map<string, string[]>();

  let fichiers: string[] = [];
  try {
    fichiers = readdirSync(dossierDonnees).filter((f) => motifFichier.test(f));
  } catch {
    fichiers = [];
  }

  for (const fichier of fichiers) {
    const zip = new AdmZip(path.join(dossierDonnees, fichier));
    for (const entry of zip.getEntries()) {
      if (entry.isDirectory || !entry.entryName.endsWith(".xml")) {
        continue;
      }
      const xml = entry.getData().toString("utf-8");
      const date = dateSeanceVersISO(xml);
      if (!date) {
        continue;
      }
      const liste = index.get(date) ?? [];
      liste.push(xml);
      index.set(date, liste);
    }
  }

  return index;
}

export class FilesystemCompteRenduRepository implements CompteRenduRepository {
  private indexParDate: Map<string, string[]> | null = null;

  constructor(
    private readonly dossierDonnees: string = DOSSIER_DONNEES_PAR_DEFAUT,
    private readonly motifFichier: RegExp = MOTIF_FICHIER_PAR_DEFAUT
  ) {}

  // Indexées une seule fois par instance, pas rescannées à chaque
  // recherche (cf. indexerComptesRendusParDate).
  private getIndexParDate(): Map<string, string[]> {
    if (!this.indexParDate) {
      this.indexParDate = indexerComptesRendusParDate(
        this.dossierDonnees,
        this.motifFichier
      );
    }

    return this.indexParDate;
  }

  async getExplicationsVote(
    dateSeance: string,
    dossierTitre: string
  ): Promise<ExplicationVote[] | null> {
    const fichiersDuJour = this.getIndexParDate().get(dateSeance) ?? [];
    if (fichiersDuJour.length === 0) {
      return null;
    }

    const candidats = fichiersDuJour.flatMap((xml) =>
      trouverCandidats(xml).map((candidat) => ({ ...candidat, xml }))
    );
    if (candidats.length === 0) {
      return null;
    }

    // Sur une même date, plusieurs sujets peuvent avoir un vote sur le
    // texte entier (2 séances, ou plusieurs textes en une séance) — retenu
    // seulement si un candidat se détache nettement des autres (score
    // strictement supérieur), jamais en cas d'égalité : mieux vaut ne rien
    // reprendre que d'attribuer à tort les propos d'un autre dossier.
    //
    // Score minimal de 2, pas 1 (cf. issue #62) : un seul mot partagé s'est
    // avéré systématiquement fortuit sur les cas réels trouvés (aucune
    // correspondance légitime à score 1 sur l'ensemble du corpus vérifié :
    // toutes portaient sur des dossiers sans rapport de fond, discutés le
    // même jour) — un score de 2 reste une heuristique, pas une preuve,
    // mais aucun faux positif n'y a été trouvé après vérification manuelle
    // exhaustive de tous les candidats retenus à ce score sur ce corpus.
    const SCORE_MINIMAL = 2;

    const scores = candidats.map((candidat) => ({
      candidat,
      score: scoreCorrespondance(dossierTitre, candidat.intituleSommaire1),
    }));
    scores.sort((a, b) => b.score - a.score);

    const meilleur = scores[0];
    if (!meilleur || meilleur.score < SCORE_MINIMAL) {
      return null;
    }
    if (scores.length > 1 && scores[1].score === meilleur.score) {
      return null;
    }

    const orateurs = parserOrateurs(meilleur.candidat.blocExplications);
    if (orateurs.length === 0) {
      return null;
    }

    const explications: ExplicationVote[] = [];
    for (const { idSyceron, orateur, groupe } of orateurs) {
      const texte = trouverTexteParagraphe(meilleur.candidat.xml, idSyceron);
      if (texte) {
        explications.push({ groupe, orateur, texte });
      }
    }

    return explications.length > 0 ? explications : null;
  }
}
