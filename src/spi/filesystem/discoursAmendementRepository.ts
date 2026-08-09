import AdmZip from "adm-zip";
import path from "node:path";
import type { DiscoursAmendementRepository } from "@/domain/compteRendu";
import type { Scrutin } from "@/domain/scrutin";
import {
  DOSSIER_DONNEES_PAR_DEFAUT,
  MOTIF_FICHIER_PAR_DEFAUT,
  indexerComptesRendusParDate,
  nettoyerTexte,
} from "@/spi/filesystem/compteRenduRepository";

// Reprend le motif de désignation numéro/article d'extraireAmendement
// (domain/scrutin.ts), en gardant en plus la préposition (à/après/de) —
// nécessaire ici pour reconstruire le même format d'article que l'attribut
// `art` du compte rendu SYCERON (ex. "après_ 6" pour un amendement déposé
// après un article, jamais juste "6" — cf. normaliserArticleTitre). Dupliqué
// plutôt qu'importé : extraireAmendement ne renvoie pas la préposition,
// dont seul ce module a besoin.
const MOTIF_NUMERO_AMENDEMENT =
  /n°\s*(\d+)(?:\s+rectifié)?\s+de\s+(.+?)\s+(?:à\s|après\s|et\s|de\s+suppression\b)/i;
const MOTIF_ARTICLE_AVEC_PREPOSITION =
  /(à|après|de)\s+l['’]article\s+([^(.]+?)(?:\s*\(|\s+de\s+la\b|\s+du\b|\.|$)/i;

function normaliserArticleTitre(preposition: string, articleBrut: string): string {
  let article = articleBrut
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\s+/g, " ");
  // Seul "premier" diffère entre le titre du scrutin ("l'article premier")
  // et l'attribut `art` du compte rendu ("1er") — vérifié sur les données
  // réelles ; les articles suivants sont déjà numériques des deux côtés.
  article = article.replace(/^premier\b/, "1er");
  return preposition.toLowerCase() === "après" ? `après_ ${article}` : article;
}

function normaliserArticleXml(articleBrut: string): string {
  return articleBrut.trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, " ");
}

type Paragraphe = { orateur: string | null; texte: string };

// Un segment = toutes les interventions consécutives rattachées par
// SYCERON au même amendement (même triplet numéro/article/document) — la
// clé de recherche ne garde que numéro+article (plusieurs textes sans
// rapport peuvent réutiliser la même paire, cf. bibardNumero ci-dessous
// pour la désambiguïsation par dossier).
type Segment = {
  bibardNumero: string | null;
  date: string;
  paragraphes: Paragraphe[];
};

const MOTIF_PARAGRAPHE = /<paragraphe\b([^>]*)>([\s\S]*?)<\/paragraphe>/g;
const MOTIF_NOM = /<nom>([^<]*)<\/nom>/;
const MOTIF_TEXTE = /<texte\b[^>]*>([\s\S]*?)<\/texte>/;

function attribut(attrs: string, nom: string): string | null {
  const match = attrs.match(new RegExp(`\\b${nom}="([^"]*)"`));
  const valeur = match ? match[1].trim() : "";
  return valeur.length > 0 ? valeur : null;
}

// Le "bibard" (numéro de document officiel associé, ex. " (n[[o]] 1043
// rectifié)") ne sert qu'à comparer un même numéro contre
// getNumerosDocument ci-dessous — seule la partie numérique compte.
function extraireNumeroDocument(bibard: string | null): string | null {
  if (!bibard) {
    return null;
  }
  const match = bibard.match(/(\d+)/);
  return match ? String(Number(match[1])) : null;
}

// Indexe tous les segments d'un fichier de compte rendu (une séance) dans
// l'index partagé, sous la clé "numéro::article". Un même triplet
// numéro/article/document peut se répéter sur plusieurs `<paragraphe>`
// consécutifs (une intervention par prise de parole) : un nouveau segment
// ne démarre que lorsque ce triplet change, jamais à chaque attribut `adt`
// non vide rencontré — sans quoi un même amendement se retrouverait
// fragmenté en autant de segments que d'interventions. Les paragraphes
// procéduraux qui suivent sans `adt` (avis de la commission/du
// gouvernement, mise aux voix...) rejoignent le segment ouvert : on les
// filtre plus tard dans extraireDiscoursAuteur, pas ici.
function indexerSegments(
  xml: string,
  date: string,
  index: Map<string, Segment[]>
): void {
  let segmentCourant: Segment | null = null;
  let cleCourante: string | null = null;

  for (const match of xml.matchAll(MOTIF_PARAGRAPHE)) {
    const [, attrs, interieur] = match;
    const adt = attribut(attrs, "adt");

    if (adt) {
      const art = attribut(attrs, "art");
      const bibard = attribut(attrs, "bibard");
      const cleTriplet = `${adt}::${art ?? ""}::${bibard ?? ""}`;

      if (cleTriplet !== cleCourante) {
        const cleRecherche = `${adt}::${art ? normaliserArticleXml(art) : ""}`;
        segmentCourant = {
          bibardNumero: extraireNumeroDocument(bibard),
          date,
          paragraphes: [],
        };
        const liste = index.get(cleRecherche) ?? [];
        liste.push(segmentCourant);
        index.set(cleRecherche, liste);
        cleCourante = cleTriplet;
      }
    }

    if (segmentCourant) {
      const nomMatch = interieur.match(MOTIF_NOM);
      const texteMatch = interieur.match(MOTIF_TEXTE);
      if (texteMatch) {
        segmentCourant.paragraphes.push({
          orateur: nomMatch ? nomMatch[1].trim() : null,
          texte: nettoyerTexte(texteMatch[1]),
        });
      }
    }
  }
}

// Une défense trop courte ("Il est défendu.", vérifié sur des cas réels)
// n'apporte rien de plus que la ligne d'attribution déjà affichée par
// ailleurs — écartée plutôt que gardée telle quelle. Seuil arbitraire mais
// large : aucun faux rejet trouvé sur les cas réels vérifiés au-dessus.
const LONGUEUR_MINIMALE_DISCOURS = 40;

// Le premier paragraphe d'un segment est toujours l'annonce du
// président/présidente ("La parole est à X, pour soutenir l'amendement
// n°..."), jamais le contenu de fond — seuls les paragraphes immédiatement
// suivants prononcés par le même orateur (l'auteur·ice de l'amendement)
// sont gardés, jusqu'à ce qu'un autre orateur prenne la parole (avis de la
// commission, du gouvernement, interruption...).
function extraireDiscoursAuteur(paragraphes: Paragraphe[]): string | null {
  if (paragraphes.length < 2) {
    return null;
  }
  const orateurAuteur = paragraphes[1].orateur;
  if (!orateurAuteur) {
    return null;
  }

  const texteAuteur: string[] = [];
  for (
    let i = 1;
    i < paragraphes.length && paragraphes[i].orateur === orateurAuteur;
    i++
  ) {
    texteAuteur.push(paragraphes[i].texte);
  }

  const discours = texteAuteur.join("\n\n").trim();
  return discours.length >= LONGUEUR_MINIMALE_DISCOURS ? discours : null;
}

const DOSSIERS_LEGISLATIFS_NOM_FICHIER = "Dossiers_Legislatifs.json.zip";

type ActeLegislatifRaw = {
  texteAssocie?: string;
  actesLegislatifs?: {
    acteLegislatif: ActeLegislatifRaw | ActeLegislatifRaw[];
  } | null;
};

type RawDossierLegislatif = {
  dossierParlementaire: {
    actesLegislatifs: { acteLegislatif: ActeLegislatifRaw | ActeLegislatifRaw[] };
  };
};

// Les numéros de document officiel (ex. "PRJLANR5L17B2630" -> "2630")
// associés à un dossier, à n'importe quelle étape de sa navette — sert à
// vérifier qu'un segment retrouvé par numéro+article appartient bien à CE
// dossier (cf. bibardNumero) plutôt qu'à un autre texte qui réutilise par
// coïncidence la même paire numéro d'amendement/article (vérifié sur un cas
// réel : l'amendement n°21 à l'article 1er existe à la fois dans un texte
// sur les bourses étudiantes et dans un texte sur l'exploration
// d'hydrocarbures, discutés à quelques semaines d'écart).
function collecterNumerosDocument(
  node: ActeLegislatifRaw | ActeLegislatifRaw[] | null | undefined,
  out: Set<string>
): void {
  if (!node) {
    return;
  }
  if (Array.isArray(node)) {
    for (const enfant of node) {
      collecterNumerosDocument(enfant, out);
    }
    return;
  }
  if (typeof node.texteAssocie === "string") {
    const match = node.texteAssocie.match(/B(\d+)$/);
    if (match) {
      out.add(String(Number(match[1])));
    }
  }
  collecterNumerosDocument(node.actesLegislatifs?.acteLegislatif, out);
}

// Retrouve le discours par lequel l'auteur·ice défend en séance un
// amendement précis (issue #94), en s'appuyant sur les attributs
// adt/art/bibard que SYCERON pose sur chaque `<paragraphe>` du compte
// rendu au moment où cet amendement est appelé — jamais une recherche
// textuelle approximative. Désambiguïsation en 2 temps : d'abord le
// numéro de document officiel du dossier (bibard, cf.
// collecterNumerosDocument), puis si plusieurs candidats subsistent malgré
// tout (plusieurs lectures du même texte), la date exacte du scrutin.
// Repli sur null dans tous les cas où subsiste un doute — jamais un
// contexte approximatif ou celui d'un autre texte.
export class FilesystemDiscoursAmendementRepository
  implements DiscoursAmendementRepository
{
  private segmentsParCle: Map<string, Segment[]> | null = null;
  private dossiersLegislatifsZip: AdmZip | null | undefined;
  private readonly numerosDocumentParDossier = new Map<string, Set<string>>();

  constructor(
    private readonly dossierDonnees: string = DOSSIER_DONNEES_PAR_DEFAUT,
    private readonly motifFichier: RegExp = MOTIF_FICHIER_PAR_DEFAUT
  ) {}

  // Indexé une seule fois par instance (cf. compteRenduRepository.ts, même
  // choix), pas rescanné à chaque scrutin demandé.
  private getSegments(): Map<string, Segment[]> {
    if (!this.segmentsParCle) {
      const index = new Map<string, Segment[]>();
      const parDate = indexerComptesRendusParDate(
        this.dossierDonnees,
        this.motifFichier
      );
      for (const [date, xmls] of parDate) {
        for (const xml of xmls) {
          indexerSegments(xml, date, index);
        }
      }
      this.segmentsParCle = index;
    }
    return this.segmentsParCle;
  }

  private getDossiersLegislatifsZip(): AdmZip | null {
    if (this.dossiersLegislatifsZip === undefined) {
      try {
        this.dossiersLegislatifsZip = new AdmZip(
          path.join(this.dossierDonnees, DOSSIERS_LEGISLATIFS_NOM_FICHIER)
        );
      } catch {
        this.dossiersLegislatifsZip = null;
      }
    }
    return this.dossiersLegislatifsZip;
  }

  private getNumerosDocument(dossierRef: string): Set<string> {
    const enCache = this.numerosDocumentParDossier.get(dossierRef);
    if (enCache) {
      return enCache;
    }

    const numeros = new Set<string>();
    const entry = this.getDossiersLegislatifsZip()?.getEntry(
      `json/dossierParlementaire/${dossierRef}.json`
    );
    if (entry) {
      const raw = JSON.parse(
        entry.getData().toString("utf-8")
      ) as RawDossierLegislatif;
      collecterNumerosDocument(
        raw.dossierParlementaire?.actesLegislatifs?.acteLegislatif,
        numeros
      );
    }

    this.numerosDocumentParDossier.set(dossierRef, numeros);
    return numeros;
  }

  async getByScrutin(scrutin: Scrutin): Promise<string | null> {
    if (!scrutin.dossierRef) {
      return null;
    }

    const numeroMatch = scrutin.titre.match(MOTIF_NUMERO_AMENDEMENT);
    if (!numeroMatch) {
      return null;
    }
    const articleMatch = scrutin.titre.match(MOTIF_ARTICLE_AVEC_PREPOSITION);
    if (!articleMatch) {
      return null;
    }

    const numero = numeroMatch[1];
    const article = normaliserArticleTitre(articleMatch[1], articleMatch[2]);

    const segments = this.getSegments().get(`${numero}::${article}`) ?? [];
    if (segments.length === 0) {
      return null;
    }

    const numerosDocument = this.getNumerosDocument(scrutin.dossierRef);
    const candidats = segments.filter(
      (segment) =>
        segment.bibardNumero !== null && numerosDocument.has(segment.bibardNumero)
    );
    if (candidats.length === 0) {
      return null;
    }

    let choisi: Segment;
    if (candidats.length === 1) {
      choisi = candidats[0];
    } else {
      // Plusieurs lectures du même texte peuvent réutiliser le même
      // numéro d'amendement et le même article — départagées par la date
      // exacte du scrutin, jamais retenues au hasard (même principe que
      // FilesystemAmendementRepository.choisirCandidat).
      const exacts = candidats.filter((segment) => segment.date === scrutin.date);
      if (exacts.length !== 1) {
        return null;
      }
      choisi = exacts[0];
    }

    return extraireDiscoursAuteur(choisi.paragraphes);
  }
}
