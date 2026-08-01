export type DecompteScrutin = {
  pour: number;
  contre: number;
  abstentions: number;
};

export type PositionGroupe = {
  organeRef: string;
  decompte: DecompteScrutin;
  effectif: number;
};

// Sort institutionnel du scrutin tel qu'annoncé par l'Assemblée nationale
// (champ "sort" de l'export AN) — toujours l'un des deux, jamais un tiers état.
export type ResultatScrutin = "adopté" | "rejeté";

export type Scrutin = {
  uid: string;
  titre: string;
  date: string;
  // Numéro de scrutin de la législature, croissant dans l'ordre chronologique
  // exact — sert de départage entre scrutins du même jour (cf. date), la
  // seule granularité que l'export AN fournit pour l'heure du scrutin.
  numero: number;
  dossierRef: string | null;
  decompte: DecompteScrutin;
  positionsParGroupe: PositionGroupe[];
  resultat: ResultatScrutin;
};

export interface ScrutinRepository {
  getByUid(uid: string): Promise<Scrutin | null>;
  getByDossierRef(dossierRef: string): Promise<Scrutin[]>;
}

const TYPES_TEXTE_LEGISLATIF = [
  "projet de loi organique",
  "proposition de loi organique",
  "projet de loi constitutionnelle",
  "proposition de loi constitutionnelle",
  "projet de loi",
  "proposition de loi",
];

// Le titre brut AN répète in extenso le titre du dossier législatif dans sa
// propre description ("... de la proposition de loi visant à garantir [...]
// (première lecture)") — déjà visible via le fil d'Ariane et la fiche du
// dossier. On ne garde que le type de texte (utile : distingue notamment un
// projet d'une proposition, une loi organique d'une loi ordinaire), pas sa
// description complète.
function retirerDescriptionDossier(titre: string): string {
  const minuscule = titre.toLowerCase();

  for (const type of TYPES_TEXTE_LEGISLATIF) {
    const debut = minuscule.indexOf(`${type} `);
    if (debut === -1) {
      continue;
    }

    const finType = debut + type.length;
    const reste = titre.slice(finType);
    const parentheseFinale = reste.match(/\s*\([^)]*\)\.?\s*$/);
    if (!parentheseFinale) {
      continue;
    }

    const description = reste.slice(0, parentheseFinale.index).trim();
    if (!description) {
      continue;
    }

    return titre.slice(0, finType) + parentheseFinale[0];
  }

  return titre;
}

function majusculeInitiale(titre: string): string {
  return titre.length === 0 ? titre : titre[0].toUpperCase() + titre.slice(1);
}

// Titre d'affichage d'un scrutin : débarrassé de la description du dossier
// qu'il répète, et avec une majuscule initiale (le titre brut AN commence
// systématiquement en minuscule, ex. "l'amendement n° 44 ...").
export function formaterTitreScrutin(titre: string): string {
  return majusculeInitiale(retirerDescriptionDossier(titre));
}

// Le vote qui décide du sort définitif d'un dossier n'est jamais un article
// ou un amendement pris isolément, mais le vote sur "l'ensemble" du texte —
// seul intitulé de scrutin qui commence ainsi dans l'export AN.
export function estVoteSurEnsemble(titre: string): boolean {
  return /^l['’]ensemble\b/i.test(titre.trim());
}

// Un texte à article unique (fréquent pour les ratifications simples) ne
// connaît pas de vote "sur l'ensemble" distinct : son seul vote de fond porte
// directement sur cet article unique, qui vaut donc adoption du texte entier.
function estVoteSurArticleUnique(titre: string): boolean {
  return /^l['’]article unique\b/i.test(titre.trim());
}

// Certaines ratifications (accords, traités) sont votées sans article ni
// "ensemble" distinct : le titre du scrutin est directement celui du texte
// lui-même (ex. "le projet de loi autorisant l'approbation de l'accord...").
// Ne pas confondre avec un vote sur un article/amendement/sous-amendement ou
// une motion, qui rattachent toujours le type de texte plus loin dans leur
// titre ("... à l'article premier du projet de loi...") plutôt qu'au début.
function estVoteDirectSurLeTexte(titre: string): boolean {
  const minuscule = titre.trim().toLowerCase();
  return TYPES_TEXTE_LEGISLATIF.some(
    (type) =>
      minuscule.startsWith(`le ${type} `) || minuscule.startsWith(`la ${type} `)
  );
}

function estMotionDeRejetPrealable(titre: string): boolean {
  return /^la motion de rejet préalable\b/i.test(titre.trim());
}

// Une motion de rejet préalable adoptée tue le texte avant tout vote sur
// l'ensemble ou l'article unique — c'est alors elle, et elle seule, qui
// tranche le sort du dossier. Rejetée, elle ne change rien : le texte
// poursuit son parcours normal vers son propre vote décisif.
function estMotionDeRejetPrealableAdoptee(scrutin: Scrutin): boolean {
  return estMotionDeRejetPrealable(scrutin.titre) && scrutin.resultat === "adopté";
}

// Une motion de censure n'est rattachée à aucun texte de loi : le scrutin
// est lui-même l'objet entier du dossier, donc toujours décisif quel que
// soit son issue (adoptée = le Gouvernement tombe, rejetée = il se maintient).
function estMotionDeCensure(titre: string): boolean {
  return /^la motion de censure\b/i.test(titre.trim());
}

// Le scrutin qui a réellement acté ou rejeté un dossier législatif. Prend
// plusieurs formes selon l'export AN (cf. Scrutin décisif dans CONTEXT.md) :
// vote sur l'ensemble du texte, vote sur son article unique, vote direct sur
// le texte lui-même (ratifications simples), motion de rejet préalable
// adoptée, ou motion de censure (son propre objet). Jamais un vote sur un
// article non-unique, un amendement ou un sous-amendement pris isolément.
function estScrutinDecisif(scrutin: Scrutin): boolean {
  return (
    estVoteSurEnsemble(scrutin.titre) ||
    estVoteSurArticleUnique(scrutin.titre) ||
    estVoteDirectSurLeTexte(scrutin.titre) ||
    estMotionDeRejetPrealableAdoptee(scrutin) ||
    estMotionDeCensure(scrutin.titre)
  );
}

// Le scrutin décisif le plus récent (numéro le plus élevé) parmi ceux
// identifiés par estScrutinDecisif. Un dossier peut connaître plusieurs
// lectures, donc plusieurs votes décisifs ; seul le dernier reflète l'issue
// définitive. Retourne null tant qu'aucun n'a encore eu lieu (dossier
// toujours en cours d'examen, encore seulement des votes d'amendement/
// d'article/de procédure).
export function trouverScrutinDecisif(scrutins: Scrutin[]): Scrutin | null {
  const decisifs = scrutins.filter(estScrutinDecisif);
  if (decisifs.length === 0) {
    return null;
  }

  return decisifs.reduce((plusRecent, scrutin) =>
    scrutin.numero > plusRecent.numero ? scrutin : plusRecent
  );
}

// Résultat global d'un dossier législatif — celui de son scrutin décisif.
// Cas particulier : le champ resultat d'une motion de rejet préalable décrit
// l'issue de la motion elle-même ("adopté" = la motion de rejet est votée),
// pas celle du texte qu'elle vise — pour ce type de scrutin seulement,
// resultat="adopté" signifie donc que le dossier a été rejeté (le texte est
// tué avant tout vote sur l'ensemble, cf. Scrutin décisif dans CONTEXT.md).
export function determinerResultatDossier(
  scrutins: Scrutin[]
): ResultatScrutin | null {
  const decisif = trouverScrutinDecisif(scrutins);
  if (!decisif) {
    return null;
  }
  if (estMotionDeRejetPrealable(decisif.titre)) {
    return "rejeté";
  }
  return decisif.resultat;
}

// Fiche Contexte/Action/Résultat propre à un scrutin (cf. Fiche dossier dans
// CONTEXT.md, dont elle reprend la structure) — générée à partir des seules
// métadonnées déjà disponibles (titre nettoyé, dossier rattaché, décompte),
// plutôt que rédigée à la main comme la fiche d'un dossier : le volume de
// scrutins (des milliers) rend une rédaction manuelle par scrutin hors de
// portée. Contrairement à la fiche dossier, le troisième volet ("Résultat")
// décrit une issue déjà connue, jamais un effet attendu.
export type FicheScrutin = {
  contexte: string;
  action: string;
  resultat: string;
};

function pluraliser(valeur: number, mot: string): string {
  return `${valeur} ${mot}${valeur > 1 ? "s" : ""}`;
}

// Le suffixe parenthésé final du titre AN donne la lecture/l'étape du texte
// (12 variantes recensées sur les 8434 scrutins de la 17e législature).
// Formulé pour s'insérer dans "à l'issue de {stade}" — null pour les rares
// variantes non recensées (~0,2%), auquel cas la phrase reste valide sans
// mention de lecture (cf. avecStade).
const LIBELLES_LECTURE: Record<string, string> = {
  "première lecture": "sa première lecture",
  "deuxième lecture": "sa deuxième lecture",
  "nouvelle lecture": "sa nouvelle lecture",
  "lecture définitive": "sa lecture définitive",
  "seconde délibération": "sa seconde délibération",
  "texte de la commission mixte paritaire":
    "l'examen du texte issu de la commission mixte paritaire",
};

function extraireStadeLecture(titre: string): string | null {
  const match = titre.trim().match(/\(([^)]*)\)\.?\s*$/);
  if (!match) {
    return null;
  }
  return LIBELLES_LECTURE[match[1].trim().toLowerCase()] ?? null;
}

function avecStade(phrase: string, stade: string | null): string {
  return stade ? `${phrase}, à l'issue de ${stade}.` : `${phrase}.`;
}

// "la motion de rejet préalable, déposée par Mme X, de la/du <dossier>..." —
// formulation stable observée sur l'ensemble des motions de rejet préalable
// de la 17e législature.
function extraireAuteurRejetPrealable(titre: string): string | null {
  const match = titre.match(
    /^la motion de rejet préalable,\s*déposée par ([^,]+),/i
  );
  return match ? match[1].trim() : null;
}

// "la motion de censure[,] déposée en application de l'article 49[...] par
// <premier·ère signataire>[, <autres signataires>][ et N (autres) député·es
// /collègues]." — on ne retient que le·la premier·ère signataire, pas la
// liste complète.
function extraireAuteurMotionCensure(titre: string): string | null {
  const match = titre.match(/\bpar ([^,]+?)(?:,| et \d)/i);
  return match ? match[1].trim() : null;
}

export function estVoteSurAmendement(titre: string): boolean {
  return /^(?:l['’]amendement|le sous-amendement)\b/i.test(titre.trim());
}

// "l'amendement n° X [rectifié] de <auteur> {à|après|de suppression} ..." —
// l'auteur est tout ce qui suit "n° X de " jusqu'au premier marqueur de fin
// (préposition introduisant l'article, "et les amendements identiques...",
// ou "de suppression"). Cherché sans ancre de début pour couvrir aussi les
// sous-amendements ("le sous-amendement n° Y de <auteur> à l'amendement
// n° X...", où le n° pertinent pour l'auteur est le premier rencontré).
// `numero` est exposé (pas seulement utilisé pour la Fiche) pour permettre
// à un consommateur externe (ex. script de curation de l'issue #45) de
// retrouver l'amendement correspondant dans le jeu de données AN dédié.
export function extraireAmendement(
  titre: string
): { numero: string; auteur: string; article: string | null } | null {
  const auteurMatch = titre.match(
    /n°\s*(\d+)(?:\s+rectifié)?\s+de\s+(.+?)\s+(?:à\s|après\s|et\s|de\s+suppression\b)/i
  );
  if (!auteurMatch) {
    return null;
  }

  const articleMatch = titre.match(
    /(?:à|après|de)\s+l['’]article\s+([^(.]+?)(?:\s*\(|\s+de\s+la\b|\s+du\b|\.|$)/i
  );

  return {
    numero: auteurMatch[1],
    auteur: auteurMatch[2].trim(),
    article: articleMatch ? articleMatch[1].trim() : null,
  };
}

function contextePourAmendement(titre: string): string | null {
  const amendement = extraireAmendement(titre);
  if (!amendement) {
    return null;
  }

  const prefixe = /^le sous-amendement/i.test(titre.trim())
    ? "Sous-amendement"
    : "Amendement";
  const suffixeArticle = amendement.article
    ? ` à l'article ${amendement.article}`
    : "";

  return `${prefixe} de ${amendement.auteur}${suffixeArticle}.`;
}

// Contexte spécifique au type de vote plutôt qu'un copié-collé du titre du
// dossier (identique pour tous les scrutins d'un même dossier — cf. issue
// GitHub #44) : chaque type de scrutin déjà distingué par estScrutinDecisif/
// trouverScrutinDecisif ci-dessus a sa propre formulation. Tout titre non
// reconnu par ces classifications garde le comportement d'origine (repli),
// pour ne jamais casser un cas imprévu.
function contextePourTypeDeVote(titre: string): string | null {
  const stade = extraireStadeLecture(titre);

  if (estVoteSurEnsemble(titre)) {
    return avecStade("Vote sur l'ensemble du texte", stade);
  }
  if (estVoteSurArticleUnique(titre)) {
    return avecStade("Vote sur l'article unique du texte", stade);
  }
  if (estVoteDirectSurLeTexte(titre)) {
    return avecStade("Vote sur le texte lui-même", stade);
  }
  if (estMotionDeRejetPrealable(titre)) {
    const auteur = extraireAuteurRejetPrealable(titre);
    return auteur
      ? `${auteur} dépose une motion de rejet préalable visant à écarter le texte avant tout débat sur son contenu.`
      : "Une motion de rejet préalable vise à écarter le texte avant tout débat sur son contenu.";
  }
  if (estMotionDeCensure(titre)) {
    const auteur = extraireAuteurMotionCensure(titre);
    return auteur
      ? `Motion de censure déposée par ${auteur}.`
      : "Motion de censure déposée en application de l'article 49 de la Constitution.";
  }
  if (estVoteSurAmendement(titre)) {
    return contextePourAmendement(titre);
  }

  return null;
}

export function genererFicheScrutin(
  scrutin: Scrutin,
  dossierTitre: string | null
): FicheScrutin {
  const contexte =
    contextePourTypeDeVote(scrutin.titre) ??
    (dossierTitre
      ? `Ce scrutin porte sur le dossier « ${dossierTitre} ».`
      : "Ce scrutin ne se rattache à aucun dossier législatif recensé.");

  const action = formaterTitreScrutin(scrutin.titre);

  const resultat = `Ce scrutin a été ${scrutin.resultat} (${scrutin.decompte.pour} pour, ${scrutin.decompte.contre} contre, ${pluraliser(
    scrutin.decompte.abstentions,
    "abstention"
  )}).`;

  return { contexte, action, resultat };
}

export function calculerVotants(decompte: DecompteScrutin): number {
  return decompte.pour + decompte.contre + decompte.abstentions;
}

export type Position = "Pour" | "Contre" | "Divisé";

const SEUIL_DIVISE = 0.33;

export function calculerPosition(decompte: DecompteScrutin): Position {
  const votants = calculerVotants(decompte);
  const minoritaire = Math.min(decompte.pour, decompte.contre);

  // Aucun Votant (le groupe n'a pas participé) : pas de camp minoritaire à
  // mesurer, donc jamais Divisé — retombe sur la règle Pour/Contre ci-dessous.
  if (votants > 0 && minoritaire / votants > SEUIL_DIVISE) {
    return "Divisé";
  }

  return decompte.pour >= decompte.contre ? "Pour" : "Contre";
}

export function calculerTauxParticipation(
  decompte: DecompteScrutin,
  effectif: number
): number {
  return calculerVotants(decompte) / effectif;
}

export type EntreeAgregation = {
  decompte: DecompteScrutin;
  effectif: number;
};

// Moyenne des répartitions Pour/Contre/Abstention de chaque scrutin, pondérée
// par le taux de participation du groupe sur ce scrutin (cf. CONTEXT.md) —
// jamais une simple moyenne par nombre de scrutins. Un scrutin technique peu
// suivi pèse ainsi naturellement moins qu'un scrutin solennel largement suivi.
export function agregerPositions(
  entrees: EntreeAgregation[]
): DecompteScrutin {
  let poidsTotal = 0;
  let pour = 0;
  let contre = 0;
  let abstentions = 0;

  for (const { decompte, effectif } of entrees) {
    const votants = calculerVotants(decompte);
    if (votants === 0) {
      continue;
    }

    const poids = calculerTauxParticipation(decompte, effectif);
    poidsTotal += poids;
    pour += poids * (decompte.pour / votants);
    contre += poids * (decompte.contre / votants);
    abstentions += poids * (decompte.abstentions / votants);
  }

  if (poidsTotal === 0) {
    return { pour: 0, contre: 0, abstentions: 0 };
  }

  return {
    pour: pour / poidsTotal,
    contre: contre / poidsTotal,
    abstentions: abstentions / poidsTotal,
  };
}
