import AdmZip from "adm-zip";
import path from "node:path";
import type {
  ResultatScrutin,
  Scrutin,
  ScrutinRepository,
} from "@/domain/scrutin";

const ZIP_PATH = path.join(
  process.cwd(),
  "data/raw/an/17/Scrutins.json.zip"
);

type RawDecompte = {
  pour: string;
  contre: string;
  abstentions: string;
};

type RawGroupeVote = {
  organeRef: string;
  nombreMembresGroupe: string;
  vote: { decompteVoix: RawDecompte };
};

type RawScrutinFile = {
  scrutin: {
    uid: string;
    titre: string;
    dateScrutin: string;
    numero: string;
    sort: { code: string };
    objet: { dossierLegislatif: { dossierRef: string } | null };
    syntheseVote: { decompte: RawDecompte };
    ventilationVotes: {
      organe: { groupes: { groupe: RawGroupeVote | RawGroupeVote[] } };
    };
  };
};

function parseCount(raw: string, field: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Scrutin : décompte "${field}" invalide ("${raw}").`);
  }
  return value;
}

function parseDecompte(raw: RawDecompte) {
  return {
    pour: parseCount(raw.pour, "pour"),
    contre: parseCount(raw.contre, "contre"),
    abstentions: parseCount(raw.abstentions, "abstentions"),
  };
}

function parseResultat(code: string): ResultatScrutin {
  if (code !== "adopté" && code !== "rejeté") {
    throw new Error(`Scrutin : sort "${code}" inconnu (ni adopté, ni rejeté).`);
  }
  return code;
}

// L'export AN sérialise un élément XML répété comme un tableau,
// mais comme un objet unique quand il n'y en a qu'un seul.
function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

// organeRef historiques confirmés dans l'export AN, à faire correspondre à
// l'organeRef actuel du même groupe déclaré dans le référentiel (spi/filesystem/groupes.ts) :
// - "PO0" (14 scrutins/8434) : anomalie, le RN y apparaît sous ce code au lieu
//   de PO845401 — jamais les deux en même temps, effectif cohérent avec le RN.
// - "PO847173" (3041 scrutins, jusqu'au 2025-07-10) : ancien organeRef de l'UDR
//   avant sa nouvelle immatriculation sous PO872880 (utilisé à partir du
//   2025-09-08, sans chevauchement) — effectif stable (~15-17) des deux côtés.
const ORGANE_REF_ALIAS: Record<string, string> = {
  PO0: "PO845401",
  PO847173: "PO872880",
};
function normaliserOrganeRef(organeRef: string): string {
  return ORGANE_REF_ALIAS[organeRef] ?? organeRef;
}

// Certains scrutins portent bien sur un dossier législatif réel, mais
// l'export AN laisse leur "objet.dossierLegislatif" à null (lacune connue de
// la donnée source, pas une absence réelle de lien) — curation manuelle
// (cf. CONTEXT.md, Tag d'impact et rattachement) vérifiée par rapprochement
// de titre/date avec le dossier concerné :
// - VTANR5L17V1304 : "l'ensemble de la proposition de loi organique visant
//   à harmoniser le mode de scrutin aux élections municipales..." — seul
//   autre scrutin lié à DLR5L17N50579 dans l'export
//   est une motion procédurale (prolongation de séance), sans lien vers ce
//   vote de fond pourtant bien réel (numéro 1304, adopté).
// - Lot 1/6 de l'audit #33 (issue #34) : 21 dossiers dont tous les scrutins
//   ont "objet.dossierLegislatif" à null dans l'export AN, retrouvés par
//   rapprochement de titre (méthode de #33) entre le scrutin décisif
//   ("l'ensemble de..."/"l'article unique de...") et Dossiers_Legislatifs.json.zip.
//   Chaque entrée est annotée du fragment de titre du scrutin décisif ayant
//   servi au rapprochement, dans le même esprit de traçabilité que VTANR5L17V1304.
const DOSSIER_REF_OVERRIDE: Record<string, string> = {
  VTANR5L17V1304: "DLR5L17N50579",
  // "l'ensemble de la proposition de loi portant réparation des personnes
  // condamnées pour homosexualité entre 1945 et 1982" (2e lecture, adopté)
  VTANR5L17V4836: "DLR5L16N46127",
  // "l'ensemble de la proposition de loi... relative à l'instauration d'un
  // nombre minimum de soignants par patient hospitalisé" (1re lecture, adopté)
  VTANR5L17V600: "DLR5L16N46650",
  // "l'ensemble de la proposition de loi visant à interdire les dispositifs
  // électroniques de vapotage à usage unique" (texte CMP, adopté)
  VTANR5L17V692: "DLR5L16N46655",
  // "l'article unique de la proposition de loi visant à mettre en place un
  // registre national des cancers" (1re lecture, adopté)
  VTANR5L17V2633: "DLR5L16N47676",
  // "l'article unique de la proposition de loi créant une dérogation à la
  // participation minimale pour la maîtrise d'ouvrage pour les communes
  // rurales" (1re lecture, adopté)
  VTANR5L17V946: "DLR5L16N48701",
  // "l'article unique de la proposition de loi visant à proroger la loi
  // n° 2017-285 du 6 mars 2017 relative à l'assainissement cadastral..."
  // (1re lecture, adopté)
  VTANR5L17V654: "DLR5L16N48725",
  // "l'ensemble de la proposition de loi créant l'homicide routier et
  // visant à lutter contre la violence routière" (2e lecture, adopté)
  VTANR5L17V2217: "DLR5L16N48739",
  // "l'ensemble de la proposition de loi visant à faciliter la
  // transformation des bureaux et autres bâtiments en logements"
  // (texte CMP, adopté)
  VTANR5L17V2215: "DLR5L16N49107",
  // "l'ensemble de la proposition de loi relative au renforcement de la
  // sûreté dans les transports" (texte CMP, adopté)
  VTANR5L17V1041: "DLR5L16N49176",
  // "l'ensemble de la proposition de loi visant à réduire et à encadrer
  // les frais bancaires sur succession" (2e lecture, adopté)
  VTANR5L17V504: "DLR5L16N49258",
  // "l'ensemble de la proposition de loi portant création d'un statut de
  // l'élu local" (2e lecture, adopté)
  VTANR5L17V4691: "DLR5L16N49280",
  // "l'ensemble de la proposition de loi visant à renforcer la sécurité
  // des professionnels de santé" (texte CMP, adopté)
  VTANR5L17V2685: "DLR5L16N49299",
  // "l'ensemble de la proposition de loi visant à protéger la population
  // des risques liés aux substances per- et polyfluoroalkylées"
  // (2e lecture, adopté)
  VTANR5L17V852: "DLR5L16N49455",
  // "l'ensemble de la proposition de loi visant à endiguer la prolifération
  // du frelon asiatique et à préserver la filière apicole" (1re lecture, adopté)
  VTANR5L17V914: "DLR5L16N49472",
  // "l'ensemble du projet de loi d'orientation pour la souveraineté
  // alimentaire et agricole et le renouvellement des générations en
  // agriculture" (texte CMP, adopté)
  VTANR5L17V844: "DLR5L16N49726",
  // "l'ensemble de la proposition de loi... pour améliorer la prise en
  // charge de la sclérose latérale amyotrophique et d'autres maladies
  // évolutives graves" (1re lecture, adopté)
  VTANR5L17V740: "DLR5L16N49796",
  // "l'ensemble de la proposition de loi visant à améliorer la prise en
  // charge des soins et dispositifs spécifiques au traitement du cancer
  // du sein par l'assurance maladie" (2e lecture, adopté)
  VTANR5L17V658: "DLR5L16N49801",
  // "l'ensemble de la proposition de loi visant à permettre l'élection du
  // maire d'une commune nouvelle en cas de conseil municipal incomplet"
  // (1re lecture, adopté)
  VTANR5L17V742: "DLR5L16N49843",
  // "l'ensemble de la proposition de loi visant à assouplir la gestion des
  // compétences 'eau' et 'assainissement'" (1re lecture, adopté)
  VTANR5L17V997: "DLR5L16N49927",
  // "l'ensemble de la proposition de loi visant à sécuriser le mécanisme
  // de purge des nullités" (1re lecture, adopté)
  VTANR5L17V452: "DLR5L16N50082",
  // "l'article unique du projet de loi autorisant la ratification de la
  // convention n° 155 sur la sécurité et la santé des travailleurs, 1981"
  // (1re lecture, adopté)
  VTANR5L17V3057: "DLR5L16N50115",
  // Lot 2/6 de l'audit #33 (issue #35) : 20 dossiers, même situation que le
  // lot 1 (cf. commentaire ci-dessus).
  // "l'ensemble de la proposition de loi organique portant réforme du
  // financement de l'audiovisuel public" (1re lecture, adopté)
  VTANR5L17V451: "DLR5L17N50168",
  // "l'ensemble de la proposition de loi visant à sortir la France du
  // piège du narcotrafic" (texte CMP, adopté — le plus récent des deux
  // votes décisifs du dossier, la motion de rejet préalable en CMP ayant
  // été rejetée)
  VTANR5L17V1473: "DLR5L17N50169",
  // "l'ensemble de la proposition de loi sur le remboursement intégral des
  // fauteuils roulants par l'Assurance maladie" (1re lecture, adopté)
  VTANR5L17V516: "DLR5L17N50370",
  // "l'ensemble de la proposition de loi portant programmation nationale
  // pour l'énergie et le climat pour les années 2025 à 2035" (1re lecture,
  // rejeté) — corrige une erreur de rapprochement par titre : DLR5L17N50407
  // ("Programmation énergie-climat") n'a jamais eu de vote décisif dans son
  // propre historique AN (aucun acte "Décision"). Le vrai dossier de ce
  // scrutin, référencé explicitement par voteRefs dans
  // Dossiers_Legislatifs.json, est DLR5L16N49849 — un dossier repris de la
  // 16e législature (dépôt 2024-04-26, avant la dissolution de 2024). Note
  // pour une curation future : ce même dossier connaît ensuite une étape
  // "adoptée avec modifications" le 2025-07-08, sans voteRef exploitable
  // dans cette même source — donc potentiellement pas le mot de la fin,
  // mais aucun scrutin identifiable pour ce vote plus récent à ce jour.
  VTANR5L17V2653: "DLR5L16N49849",
  // "l'ensemble de la proposition de loi visant à créer une croix de la
  // valeur des sapeurs-pompiers volontaires et professionnels"
  // (1re lecture, adopté)
  VTANR5L17V1724: "DLR5L17N50413",
  // "l'ensemble de la proposition de loi organique visant à reporter le
  // renouvellement général des membres du congrès et des assemblées de
  // province de la Nouvelle-Calédonie afin de permettre la mise en oeuvre
  // de l'accord du 12 juillet 2025" (texte CMP, adopté) — corrige une
  // erreur de rapprochement par titre : ce scrutin est le vote décisif de
  // DLR5L17N52655 (dossier distinct et postérieur à DLR5L17N50450, dépôt
  // 2025-08-13, spécifiquement lié à l'accord du 12 juillet 2025), pas de
  // DLR5L17N50450 — confirmé par voteRefs dans Dossiers_Legislatifs.json.
  VTANR5L17V3182: "DLR5L17N52655",
  // "l'ensemble de la proposition de loi organique visant à reporter le
  // renouvellement général des membres du congrès et des assemblées de
  // province de la Nouvelle-Calédonie" (1re lecture, adopté) — vote décisif
  // propre de DLR5L17N50450 (à ne pas confondre avec VTANR5L17V3182
  // ci-dessus, décisif du dossier distinct DLR5L17N52655). Jamais lié
  // nativement (dossierLegislatif null, même lacune que #33) ni curé
  // jusqu'ici — trouvé en vérifiant DLR5L17N50450 après la correction de
  // VTANR5L17V3182, qui laissait ce dossier sans aucun scrutin réel.
  VTANR5L17V266: "DLR5L17N50450",
  // "l'ensemble de la proposition de loi visant à restaurer un système de
  // retraite plus juste en annulant les dernières réformes portant sur
  // l'âge de départ et le nombre d'annuités" (1re lecture, rejeté)
  VTANR5L17V217: "DLR5L17N50453",
  // "l'ensemble de la proposition de loi visant à harmoniser le mode de
  // scrutin aux élections municipales..." (2e lecture, adopté — à
  // distinguer de VTANR5L17V1304, déjà rattaché à DLR5L17N50579, décisif
  // de la proposition de loi organique compagnon) — corrige un rattachement
  // à DLR5L17N50578 (dossier réel mais vide, aucun acte "Décision" propre).
  // La page officielle assemblee-nationale.fr de ce texte affiche "15e ➜
  // 17e législature" : la proposition a été déposée en 2021 sous la 15e
  // législature ("Renforcement de la parité dans les fonctions électives et
  // exécutives du bloc communal", dossierRef DLR5L15N43846), puis retitrée
  // en cours de navette lors de sa reprise en 2e lecture sous la 17e —
  // confirmé par voteRefs=VTANR5L17V1303 sur la décision d'adoption du
  // 2025-04-07 de ce même dossier DLR5L15N43846.
  VTANR5L17V1303: "DLR5L15N43846",
  // "l'ensemble de la deuxième partie du projet de loi de financement de
  // la sécurité sociale pour 2025" (1re lecture, adopté — seul vote de
  // portée "l'ensemble" du dossier dans l'export, faute de vote sur
  // l'ensemble du texte complet)
  VTANR5L17V242: "DLR5L17N50588",
  // "l'ensemble de la proposition de loi visant à la création d'un centre
  // hospitalier universitaire en Corse" (1re lecture, adopté)
  VTANR5L17V502: "DLR5L17N50604",
  // "l'ensemble de la proposition de loi visant à lutter contre la
  // pédocriminalité" (1re lecture, adopté)
  VTANR5L17V1725: "DLR5L17N50627",
  // "l'ensemble de la proposition de loi visant à faire exécuter les
  // peines d'emprisonnement ferme" (1re lecture, adopté)
  VTANR5L17V1262: "DLR5L17N50631",
  // "l'ensemble de la proposition de loi visant à améliorer le traitement
  // des maladies affectant les cultures végétales à l'aide d'aéronefs
  // télépilotés" (1re lecture, adopté)
  VTANR5L17V617: "DLR5L17N50636",
  // "l'ensemble de la proposition de loi visant à protéger les personnes
  // engagées dans un projet parental des discriminations au travail"
  // (1re lecture, adopté)
  VTANR5L17V1553: "DLR5L17N50689",
  // "l'ensemble de la proposition de loi visant à renforcer l'autorité de
  // la justice à l'égard des mineurs délinquants et de leurs parents"
  // (texte CMP, adopté — le plus récent des votes décisifs du dossier,
  // retitré "renforcer" par la CMP)
  VTANR5L17V1624: "DLR5L17N50690",
  // "l'ensemble de la proposition de loi relative au mode d'élection des
  // membres du Conseil de Paris et des conseils municipaux de Lyon et de
  // Marseille" (lecture définitive, adopté)
  VTANR5L17V3018: "DLR5L17N50692",
  // "l'ensemble de la proposition de loi contre toutes les fraudes aux
  // aides publiques" (1re lecture, adopté)
  VTANR5L17V653: "DLR5L17N50715",
  // "l'ensemble de la proposition de loi relative à la lutte contre
  // l'antisémitisme dans l'enseignement supérieur" (texte CMP, adopté)
  VTANR5L17V2880: "DLR5L17N50724",
  // "l'ensemble de la proposition de loi prenant des mesures d'urgence
  // pour protéger nos enfants accueillis en crèches privées à but
  // lucratif" (1re lecture, adopté)
  VTANR5L17V612: "DLR5L17N50775",
  // "l'ensemble de la proposition de loi visant à lutter contre les
  // pannes d'ascenceur non prises en charge" (1re lecture, adopté)
  VTANR5L17V611: "DLR5L17N50777",
  // Lot 3/6 de l'audit #33 (issue #36) : 19 dossiers, même situation que les
  // lots précédents (cf. commentaires ci-dessus).
  // "l'ensemble de la proposition de loi visant à rendre accessible à tous
  // les étudiants le repas à 1 euro" (1re lecture, adopté)
  VTANR5L17V606: "DLR5L17N50778",
  // "l'ensemble de la proposition de loi visant à prendre des mesures
  // d'urgence contre la vie chère et à réguler la concentration des
  // acteurs économiques dans les territoires d'outre-mer" (1re lecture,
  // adopté — à distinguer de VTANR5L17V4755, décisif d'un dossier
  // ultérieur et distinct au périmètre plus restreint, hors de ce lot)
  VTANR5L17V596: "DLR5L17N50779",
  // "l'ensemble du projet de loi portant diverses dispositions
  // d'adaptation au droit de l'Union européenne..." (texte CMP, adopté)
  VTANR5L17V1203: "DLR5L17N50796",
  // "l'ensemble de la proposition de loi visant à lever les contraintes à
  // l'exercice du métier d'agriculteur" (texte CMP, adopté — le plus
  // récent des votes décisifs du dossier ; celui de première lecture
  // (VTANR5L17V2105) est une motion de rejet préalable de la majorité
  // elle-même, adoptée pour transmettre le texte au Sénat sans débat,
  // sans tuer le dossier qui a bien poursuivi sa navette jusqu'en CMP)
  VTANR5L17V2957: "DLR5L17N50819",
  // "l'ensemble de la proposition de loi visant à prolonger la dérogation
  // d'usage des titres restaurant pour tout produit alimentaire"
  // (1re lecture, adopté)
  VTANR5L17V455: "DLR5L17N50820",
  // "l'ensemble du projet de loi de finances de fin de gestion pour 2024"
  // (texte CMP, adopté — le plus récent des votes décisifs du dossier ;
  // le vote de la première partie en 1re lecture (VTANR5L17V445) a été
  // rejeté mais le dossier a poursuivi sa navette jusqu'en CMP)
  VTANR5L17V518: "DLR5L17N50838",
  // "l'article unique de la proposition de loi relative à la restitution
  // d'un bien culturel à la République de Côte d'Ivoire" (1re lecture,
  // adopté)
  VTANR5L17V2936: "DLR5L17N50882",
  // "l'ensemble de la proposition de loi visant à restreindre la vente de
  // protoxyde d'azote aux seuls professionnels..." (1re lecture, adopté)
  VTANR5L17V682: "DLR5L17N50911",
  // "l'ensemble de la proposition de loi relative à l'exercice de la
  // démocratie agricole" (1re lecture, adopté)
  VTANR5L17V589: "DLR5L17N50915",
  // "l'article unique du projet de loi autorisant la ratification du
  // traité sur la coopération dans le domaine de la défense entre la
  // République française et le Royaume d'Espagne" (1re lecture, adopté)
  VTANR5L17V841: "DLR5L17N50946",
  // "l'ensemble de la proposition de loi sur la profession d'infirmier"
  // (texte CMP, adopté — le plus récent des deux votes décisifs du
  // dossier)
  VTANR5L17V2278: "DLR5L17N51002",
  // "l'ensemble de la proposition de loi visant à renforcer la
  // démographie professionnelle des orthophonistes" (1re lecture, adopté)
  VTANR5L17V1265: "DLR5L17N51014",
  // "l'ensemble de la proposition de loi visant à lutter contre les
  // déserts médicaux, d'initiative transpartisane" (1re lecture, adopté) —
  // corrige une erreur de rapprochement par titre : DLR5L17N51029 (dépôt
  // 2024-12-03, même titre exact) n'a jamais eu de vote décisif dans son
  // propre historique AN. Le vrai dossier de ce scrutin, référencé
  // explicitement par voteRefs dans Dossiers_Legislatifs.json, est
  // DLR5L17N51516 — un redépôt du même texte (dépôt 2025-02-13).
  VTANR5L17V1607: "DLR5L17N51516",
  // "l'ensemble de la proposition de loi visant à renforcer les
  // conditions d'accès à la nationalité française à Mayotte" (texte CMP,
  // adopté — le plus récent des votes décisifs du dossier)
  VTANR5L17V1308: "DLR5L17N51039",
  // "l'ensemble de la proposition de loi relative au droit de vote par
  // correspondance des personnes détenues" (1re lecture, adopté)
  VTANR5L17V2244: "DLR5L17N51052",
  // "l'ensemble de la proposition de loi organique fixant le statut du
  // procureur de la République national anti-criminalité organisée"
  // (texte CMP, adopté — même dossier que la 1re lecture, retitré en
  // cours de navette ; numéro de scrutin consécutif à celui du dossier
  // compagnon DLR5L17N50169, voté à la même séance de CMP)
  VTANR5L17V1474: "DLR5L17N51078",
  // "l'ensemble du projet de loi spéciale prévue par l'article 45 de la
  // loi organique du 1er août 2001 relative aux lois de finances"
  // (1re lecture, adopté, 2024-12-16 — à distinguer de VTANR5L17V4947,
  // même intitulé mais scrutin du 2025-12-23, décisif d'un dossier
  // distinct de l'année suivante, hors de ce lot)
  VTANR5L17V525: "DLR5L17N51079",
  // "l'ensemble de la proposition de loi expérimentant l'encadrement des
  // loyers et améliorant l'habitat dans les outre-mer" (1re lecture,
  // adopté)
  VTANR5L17V2262: "DLR5L17N51115",
  // "l'ensemble de la proposition de loi permettant aux salariés de
  // participer aux collectes de sang, de plaquettes ou de plasma sur
  // leur temps de travail" (1re lecture, adopté)
  VTANR5L17V2256: "DLR5L17N51132",
  // Lot 4/6 de l'audit #33 (issue #37) : 13 dossiers, même situation que les
  // lots précédents (cf. commentaires ci-dessus).
  // "l'ensemble de la proposition de loi visant à proroger le dispositif
  // d'expérimentation favorisant l'égalité des chances pour l'accès à
  // certaines écoles de service public" (1re lecture, adopté)
  VTANR5L17V840: "DLR5L17N51161",
  // "l'ensemble de la proposition de loi organique tendant à modifier le
  // II de l'article 43 de la loi organique n° 2004-192... statut
  // d'autonomie de la Polynésie française" (1re lecture, adopté)
  VTANR5L17V4706: "DLR5L17N51173",
  // "l'ensemble de la proposition de loi instaurant un impôt plancher de
  // 2 % sur le patrimoine des ultra riches" (1re lecture, adopté)
  VTANR5L17V881: "DLR5L17N51215",
  // "l'ensemble du projet de loi d'urgence pour Mayotte" (texte CMP,
  // adopté — le plus récent des deux votes décisifs du dossier)
  VTANR5L17V790: "DLR5L17N51222",
  // "l'ensemble de la proposition de loi visant à lutter contre la
  // disparition des terres agricoles et renforcer la régulation des prix
  // du foncier agricole" (1re lecture, adopté)
  VTANR5L17V959: "DLR5L17N51312",
  // "l'ensemble de la proposition de loi modifiant la définition pénale
  // du viol et des agressions sexuelles" (texte CMP, adopté — le plus
  // récent des deux votes décisifs du dossier)
  VTANR5L17V3061: "DLR5L17N51349",
  // "l'ensemble de la proposition de loi visant à reconnaître le
  // préjudice subi par les personnes condamnées sur le fondement de la
  // législation pénalisant l'avortement..." (1re lecture, adopté)
  VTANR5L17V4839: "DLR5L17N51351",
  // "l'ensemble du projet de loi autorisant la ratification de la
  // résolution LP.3(4)... Protocole de Londres de 1996..." (texte CMP,
  // adopté — à distinguer de VTANR5L17V1333, rejeté en 1re lecture, dont
  // le titre porte sur le Protocole de Londres de "1966" et qui relève
  // donc d'un dossier distinct malgré la même référence de résolution)
  VTANR5L17V2460: "DLR5L17N51362",
  // "l'ensemble de la proposition de loi visant à faciliter le maintien
  // en rétention des personnes condamnées pour des faits d'une
  // particulière gravité et présentant de forts risques de récidive"
  // (1re lecture, adopté)
  VTANR5L17V2958: "DLR5L17N51429",
  // "l'ensemble de la proposition de loi contre les fraudes aux moyens de
  // paiement scripturaux" (1re lecture, adopté)
  VTANR5L17V1193: "DLR5L17N51434",
  // "l'ensemble de la proposition de loi relative à la protection sociale
  // complémentaire des agents publics territoriaux" (1re lecture, adopté)
  VTANR5L17V4707: "DLR5L17N51457",
  // "l'ensemble de la proposition de loi visant à convertir des centrales
  // à charbon vers des combustibles moins émetteurs en dioxyde de
  // carbone..." (1re lecture, adopté)
  VTANR5L17V1306: "DLR5L17N51485",
  // "l'ensemble de la proposition de loi portant reconnaissance de la
  // Nation envers les rapatriés d'Indochine et réparation des préjudices
  // subis par ceux-ci et leurs familles..." (1re lecture, adopté)
  VTANR5L17V2220: "DLR5L17N51499",
  // Lot 5/6 de l'audit #33 (issue #38) : 20 dossiers, même situation que les
  // lots précédents (cf. commentaires ci-dessus).
  // "l'ensemble de la proposition de loi visant à renforcer la stabilité
  // économique et la compétitivité du secteur agroalimentaire" (texte CMP,
  // adopté — le plus récent des deux votes décisifs du dossier)
  VTANR5L17V1319: "DLR5L17N51504",
  // "l'ensemble de la proposition de loi visant à renforcer le contrôle du
  // Parlement en période d'expédition des affaires courantes" (1re lecture,
  // adopté)
  VTANR5L17V1212: "DLR5L17N51510",
  // "l'ensemble de la proposition de loi visant à valoriser la réserve
  // communale de sécurité civile" (1re lecture, adopté)
  VTANR5L17V1234: "DLR5L17N51518",
  // "l'ensemble de la proposition de loi pour un démarchage téléphonique
  // consenti et une protection renforcée des consommateurs contre les
  // abus" (1re lecture, adopté)
  VTANR5L17V898: "DLR5L17N51563",
  // "l'article unique de la proposition de loi élargissant la possibilité
  // pour les collectivités territoriales et leurs groupements d'avoir
  // recours au modèle de la société portuaire..." (1re lecture, adopté)
  VTANR5L17V4697: "DLR5L17N51581",
  // "l'ensemble de la proposition de loi visant à mettre fin au devoir
  // conjugal" (1re lecture, adopté) — corrige une erreur de rapprochement
  // par titre : DLR5L17N51671 (dépôt 2025-03-11, "Mettre fin au « devoir
  // conjugal »") n'a jamais eu de vote décisif dans son propre historique
  // AN. Le vrai dossier de ce scrutin, référencé explicitement par
  // voteRefs dans Dossiers_Legislatifs.json, est DLR5L17N53279 — un
  // redépôt du même texte (dépôt 2025-12-02).
  VTANR5L17V5243: "DLR5L17N53279",
  // "l'ensemble de la proposition de loi visant à garantir l'égal accès de
  // tous à l'accompagnement et aux soins palliatifs" (2e lecture, adopté —
  // le plus récent des deux votes décisifs du dossier)
  VTANR5L17V5728: "DLR5L17N51672",
  // "l'ensemble de la proposition de loi visant à l'extension de la
  // possibilité de préemption de baux commerciaux dans les mairies aux
  // sociétés civiles immobilières" (1re lecture, adopté)
  VTANR5L17V5432: "DLR5L17N51713",
  // "l'ensemble de la proposition de loi visant à préserver les droits des
  // victimes dont la plainte est classée sans suite" (1re lecture, adopté)
  VTANR5L17V1604: "DLR5L17N51716",
  // "l'ensemble de la proposition de loi visant à améliorer la protection
  // des commerçants grâce à l'usage d'outils numériques" (1re lecture,
  // adopté — le plus récent des votes décisifs du dossier ; la motion de
  // rejet préalable (VTANR5L17V5286) a été rejetée)
  VTANR5L17V5427: "DLR5L17N51720",
  // "l'article unique de la proposition de loi autorisant la ratification
  // du Traité de coopération en matière de défense entre la République
  // française et la République de Djibouti" (1re lecture, adopté — à
  // distinguer de VTANR5L17V841, décisif du traité de défense compagnon
  // avec l'Espagne, déjà rattaché à DLR5L17N50946)
  VTANR5L17V2634: "DLR5L17N51789",
  // "l'ensemble de la proposition de loi visant à réparer les préjudices
  // causés par la transplantation de mineurs de La Réunion en France
  // hexagonale de 1962 à 1984" (1re lecture, adopté)
  VTANR5L17V5244: "DLR5L17N51845",
  // "l'ensemble de la proposition de loi visant à lutter contre la
  // mortalité infantile" (1re lecture, adopté)
  VTANR5L17V1723: "DLR5L17N51849",
  // "l'ensemble de la proposition de loi de simplification du droit de
  // l'urbanisme et du logement" (texte CMP, adopté — le plus récent des
  // deux votes décisifs du dossier)
  VTANR5L17V3056: "DLR5L17N51852",
  // "l'ensemble de la proposition de loi visant à exercer l'accès à
  // l'emploi, à pérenniser et à étendre progressivement l'expérimentation
  // « territoires zéro chômeur de longue durée »..." (1re lecture, adopté)
  VTANR5L17V5222: "DLR5L17N51962",
  // "l'ensemble de la proposition de loi visant à garantir un cadre fiscal
  // stable, juste et lisible pour nos micro-entrepreneurs et nos petites
  // entreprises" (1re lecture, adopté)
  VTANR5L17V2214: "DLR5L17N51973",
  // "l'ensemble de la proposition de loi visant à accorder le versement
  // des allocations familiales dès le premier enfant" (1re lecture,
  // adopté)
  VTANR5L17V2272: "DLR5L17N51979",
  // "l'ensemble du projet de loi organique relatif au Département-Région
  // de Mayotte" (texte CMP, adopté — le plus récent des deux votes
  // décisifs du dossier)
  VTANR5L17V2976: "DLR5L17N51984",
  // "l'ensemble du projet de loi de programmation pour la refondation de
  // Mayotte" (texte CMP, adopté — le plus récent des deux votes décisifs
  // du dossier)
  VTANR5L17V2975: "DLR5L17N51985",
  // "l'ensemble du projet de loi relatif au transfert à l'Etat des
  // personnels enseignants de l'enseignement du premier degré dans les
  // îles Wallis et Futuna" (1re lecture, adopté)
  VTANR5L17V2104: "DLR5L17N51986",
  // Lot 6/6 de l'audit #33 (issue #39, dernier lot) : 19 dossiers, même
  // situation que les lots précédents (cf. commentaires ci-dessus).
  // DLR5L17N53063 ("Lutter contre les violences sexistes et sexuelles au
  // travail") ne figure volontairement pas dans cette table : son fichier
  // content/dossiers/ existe (classé, cf. #39), mais son dossierParlementaire
  // n'a qu'un seul acte enregistré ("1ère lecture, renvoi en commission au
  // fond", 2025-10-28, aucun acte postérieur) — encore en commission, sans
  // vote décisif réel malgré l'annotation "(adopté)" de #39. Le seul
  // scrutin candidat trouvé par recoupement de titre (VTANR5L17V657,
  // "l'ensemble de la proposition de loi visant à renforcer la lutte
  // contre les violences sexuelles et sexistes") ne correspond à aucun
  // dossierParlementaire du corpus 17e législature — probablement un faux
  // positif de recoupement, pas ce dossier. À vérifier manuellement (cf.
  // méthode des cas ambigus de #41) avant tout rattachement.
  // "l'ensemble du projet de loi portant création de l'établissement
  // public du commerce et de l'industrie de Corse" (1re lecture, adopté)
  VTANR5L17V2900: "DLR5L17N52002",
  // "l'article unique de la proposition de loi appelant à élever Alfred
  // Dreyfus au grade de général de brigade" (1re lecture, adopté)
  VTANR5L17V2207: "DLR5L17N52037",
  // "l'ensemble du projet de loi portant transposition des accords
  // nationaux interprofessionnels en faveur de l'emploi des salariés
  // expérimentés..." (texte CMP, adopté — le plus récent des deux votes
  // décisifs du dossier)
  VTANR5L17V3055: "DLR5L17N52040",
  // "l'ensemble du projet de loi relatif à l'organisation des jeux
  // Olympiques et Paralympiques de 2030" (texte CMP, adopté — le plus
  // récent des votes décisifs du dossier ; les deux motions de rejet
  // préalable (VTANR5L17V4756, VTANR5L17V5295) ont été rejetées)
  VTANR5L17V5296: "DLR5L17N52100",
  // "l'ensemble de la proposition de loi visant à la nationalisation
  // d'ArcelorMittal France afin de préserver la souveraineté
  // industrielle de la France" (1re lecture, adopté) — corrige une
  // erreur de rapprochement par titre du lot 6/6 (#33) : DLR5L17N52207
  // est une proposition antérieure du même député (dépôt 2025-06-04),
  // restée bloquée en commission sans jamais aller au vote. Le vrai
  // dossier de ce scrutin est DLR5L17N52977 (dépôt 2025-10-14), dont
  // l'acte "Décision" de 1re lecture AN référence explicitement
  // voteRefs=VTANR5L17V4438 dans Dossiers_Legislatifs.json — la
  // proposition qui a réellement été débattue, adoptée en 1re lecture,
  // rejetée au Sénat, puis adoptée en 2e lecture (VTANR5L17V7380).
  VTANR5L17V4438: "DLR5L17N52977",
  // "l'article unique du projet de loi autorisant l'approbation de la
  // convention de coopération judiciaire internationale entre le
  // Gouvernement de la République française et l'Organisation des
  // Nations unies représentée par le Mécanisme d'enquête indépendant
  // pour le Myanmar" (1re lecture, adopté)
  VTANR5L17V4801: "DLR5L17N52429",
  // "l'ensemble de la proposition de loi visant à garantir la gratuité
  // des parkings des hôpitaux publics..." (1re lecture, adopté)
  VTANR5L17V5254: "DLR5L17N52744",
  // "l'ensemble de la proposition de loi visant à garantir un
  // renouvellement automatique des titres de séjour de longue durée"
  // (1re lecture, adopté)
  VTANR5L17V4754: "DLR5L17N52749",
  // "l'ensemble de la proposition de loi visant à rendre systématique
  // l'information du consommateur sur l'origine des denrées alimentaires
  // par le moyen de l'étiquetage" (1re lecture, rejeté)
  VTANR5L17V3273: "DLR5L17N52787",
  // "l'ensemble du projet de loi de financement de la sécurité sociale
  // pour 2026" (lecture définitive, adopté — le plus récent des votes
  // décisifs du dossier ; les trois motions de rejet préalable aux
  // lectures successives ont toutes été rejetées)
  VTANR5L17V4758: "DLR5L17N52922",
  // "l'ensemble de la proposition de loi relative à l'établissement de
  // l'égalité d'accès au service public postal en outre-mer" (1re
  // lecture, adopté)
  VTANR5L17V4287: "DLR5L17N52976",
  // "l'ensemble de la proposition de loi visant à protéger les mineurs
  // isolés et à lutter contre le sans-abrisme" (1re lecture, adopté)
  VTANR5L17V4723: "DLR5L17N53051",
  // "l'ensemble de la proposition de loi visant à prendre des mesures
  // d'urgence contre la vie chère en outre-mer dans le secteur des
  // services" (1re lecture, adopté — à distinguer de VTANR5L17V596,
  // décisif du dossier compagnon au périmètre plus large, déjà rattaché
  // à DLR5L17N50779)
  VTANR5L17V4755: "DLR5L17N53058",
  // "l'ensemble de la proposition de loi pour retrouver la confiance et
  // l'équilibre dans les rapports locatifs" (1re lecture, adopté)
  VTANR5L17V4745: "DLR5L17N53069",
  // "l'ensemble du projet de loi de fin de gestion pour 2025" (texte CMP,
  // adopté — le plus récent des votes décisifs du dossier ; le vote de
  // première lecture (VTANR5L17V3936) a été rejeté mais le dossier a
  // poursuivi sa navette jusqu'en CMP)
  VTANR5L17V4442: "DLR5L17N53135",
  // "l'ensemble de la proposition de loi d'expérimentation pour
  // l'instauration d'un enseignement d'éducation à l'alimentation
  // obligatoire à l'école" (1re lecture, adopté)
  VTANR5L17V5435: "DLR5L17N53171",
  // "l'ensemble de la proposition de loi visant à reconnaître les
  // victimes de l'exposition aux essais nucléaires français et à
  // améliorer leur indemnisation" (1re lecture, adopté)
  VTANR5L17V5266: "DLR5L17N53276",
  // "l'ensemble de la proposition de loi améliorant la protection des
  // personnes ciblées par les réseaux de criminalité organisée" (1re
  // lecture, adopté)
  VTANR5L17V5358: "DLR5L17N53427",
  // Issue #42, suite à #33 : la 3e forme de Scrutin décisif (motion de
  // rejet préalable *adoptée*, qui tue le texte avant tout vote sur
  // l'ensemble) n'avait pas été auditée par #33/#34-#39. 7 dossiers
  // (4 identifiés par #42 + 2 volets "comptes de la sécurité sociale"
  // 2023/2024 non distingués par #42, retrouvés en vérifiant le point
  // ouvert par #42 lui-même + 1 cas d'ambiguïté résolu, cf. Castres-Toulouse).
  // "la motion de rejet préalable... de la proposition de loi relative à
  // la réforme de l'audiovisuel public et à la souveraineté audiovisuelle"
  // (1re lecture, adoptée — motion adoptée = décisif, tue le texte)
  VTANR5L17V2873: "DLR5L16N47697",
  // "la motion de rejet préalable... de la proposition de loi organique
  // visant à reporter le renouvellement général des membres du congrès...
  // pour permettre la mise en œuvre de l'accord du 12 juillet 2025"
  // (1re lecture, adoptée — à distinguer de VTANR5L17V3182/V3181, décisifs
  // d'un dossier de report antérieur et distinct (DLR5L17N50450), motivé
  // par un accord différent)
  VTANR5L17V3060: "DLR5L17N52655",
  // "la motion de rejet préalable... du projet de loi relatif aux
  // résultats de la gestion et portant approbation des comptes de
  // l'année 2024" (1re lecture, adoptée)
  VTANR5L17V2276: "DLR5L17N51919",
  // "la motion de rejet préalable... du projet de loi portant approbation
  // des comptes de la sécurité sociale de l'année 2024" (1re lecture,
  // adoptée — volet distinct de DLR5L17N51919, sur le modèle des deux
  // dossiers déjà séparés pour 2025 (DLR5L17N54196/DLR5L17N54373) ; #42
  // ne l'avait pas identifié séparément, retrouvé en vérifiant le point
  // ouvert par #42 lui-même ("un seul dossier vs deux" pour 2023/2024))
  VTANR5L17V2277: "DLR5L17N52133",
  // "la motion de rejet préalable... du projet de loi relatif aux
  // résultats de la gestion et portant approbation des comptes de
  // l'année 2023" (1re lecture, adoptée)
  VTANR5L17V4: "DLR5L17N50172",
  // "la motion de rejet préalable... du projet de loi d'approbation des
  // comptes de la sécurité sociale de l'année 2023" (1re lecture, adoptée
  // — volet distinct de DLR5L17N50172, même raisonnement que pour 2024
  // ci-dessus)
  VTANR5L17V5: "DLR5L17N50173",
  // "la motion de rejet préalable... de la proposition de loi relative à
  // la raison impérative d'intérêt public majeur de la liaison
  // autoroutière entre Castres et Toulouse" (1re lecture, adoptée — titre
  // exact de DLR5L17N51702 ; à distinguer de DLR5L17N51817, dont le titre
  // omet "Proposition de loi relative à" et dont la procédure débute
  // directement à l'Assemblée (1ère assemblée saisie) plutôt qu'au Sénat,
  // ce qui ne correspond pas à la navette de ce scrutin)
  VTANR5L17V2208: "DLR5L17N51702",

  // Reprise de #33 (audit:dossiers, méthode inchangée — title-matching par
  // recouvrement de tokens contre Dossiers_Legislatifs.json.zip, avec score
  // de Jaccard plutôt que rapporté au plus petit ensemble : ce dernier
  // produisait de faux scores de 1.00 dès qu'un titre de dossier court et
  // générique se retrouvait entièrement inclus dans un titre de scrutin
  // plus long sur un sujet différent).
  // "l'ensemble de la première partie du projet de loi de finances de fin
  // de gestion pour 2024" (1re lecture, rejeté — même dossier que le vote
  // sur l'ensemble du texte)
  VTANR5L17V445: "DLR5L17N50838",
  // "l'ensemble de la proposition de loi visant à modifier la définition
  // pénale du viol et des agressions sexuelles" (1re lecture, adopté)
  VTANR5L17V1202: "DLR5L17N51349",
  // "l'ensemble de la proposition de loi visant à moderniser la gestion du
  // patrimoine immobilier de l'État" (1re lecture, adopté)
  VTANR5L17V5240: "DLR5L17N52746",
  // "l'ensemble du projet de loi de financement de la sécurité sociale pour
  // 2026" (nouvelle lecture, adopté)
  VTANR5L17V4696: "DLR5L17N52922",
  // "l'ensemble du projet de loi de finances de fin de gestion pour 2025"
  // (1re lecture, rejeté)
  VTANR5L17V3936: "DLR5L17N53135",
  // "l'article unique de la proposition de loi organique... portant statut
  // d'autonomie de la Polynésie française" (1re lecture, adopté)
  VTANR5L17V4704: "DLR5L17N51173",
  // "l'article unique de la proposition de loi instaurant un impôt plancher
  // de 2 % sur le patrimoine des ultra riches" (1re lecture, adopté)
  VTANR5L17V878: "DLR5L17N51215",
  // "l'ensemble de la proposition de loi visant à réformer le mode
  // d'élection des membres du Conseil de Paris et des conseils municipaux
  // de Lyon et Marseille" (1re lecture, adopté)
  VTANR5L17V1330: "DLR5L17N50692",
  // même dossier que ci-dessus (nouvelle lecture, adopté)
  VTANR5L17V2954: "DLR5L17N50692",
  // "l'ensemble de la proposition de loi visant à améliorer l'accès au
  // logement des travailleurs des services publics" (1re lecture, adopté)
  VTANR5L17V4962: "DLR5L17N51968",
  // "l'ensemble de la proposition de loi relative à la lutte contre
  // l'antisémitisme, le racisme, les discriminations, les violences et la
  // haine dans l'enseignement supérieur" (1re lecture, adopté — titre élargi
  // par rapport à celui, plus court, du dossier)
  VTANR5L17V1601: "DLR5L17N50724",
  // "l'article unique de la proposition de loi visant à renforcer les
  // conditions d'accès à la nationalité française à Mayotte" (1re lecture,
  // adopté)
  VTANR5L17V710: "DLR5L17N51039",
  // même dossier, vote sur l'ensemble plutôt que l'article unique (1re
  // lecture, adopté)
  VTANR5L17V738: "DLR5L17N51039",
  // "l'ensemble de la proposition de loi visant à garantir l'égal accès de
  // tous à l'accompagnement et aux soins palliatifs" (1re lecture, adopté —
  // même dossier que la 2e lecture, cf. issue #81/alias "Droit à l'aide à
  // mourir" pour le dossier "Fin de vie" distinct)
  VTANR5L17V2106: "DLR5L17N51672",
  // "l'ensemble de la proposition de loi facilitant l'exercice en France
  // des médecins diplômés au Royaume-Uni avant le Brexit" (1re lecture,
  // adopté)
  VTANR5L17V5415: "DLR5L17N53192",
  // "l'ensemble du projet de loi de programmation pour la refondation de
  // Mayotte" (1re lecture, adopté)
  VTANR5L17V2874: "DLR5L17N51985",
  // "l'ensemble de la proposition de loi relative à l'intérêt des enfants"
  // (1re lecture, adopté)
  VTANR5L17V5283: "DLR5L17N51655",
  // "l'ensemble de la proposition de loi sur la profession d'infirmier"
  // (1re lecture, adopté)
  VTANR5L17V944: "DLR5L17N51002",
  // "l'ensemble de la proposition de loi visant à renforcer la stabilité
  // économique et la compétitivité du secteur agroalimentaire" (1re
  // lecture, adopté)
  VTANR5L17V1038: "DLR5L17N51504",
  // "l'article unique du projet de loi autorisant la ratification de la
  // résolution LP.3(4) portant amendement de l'article 6 du Protocole de
  // Londres... à la Convention... sur la prévention de la pollution des
  // mers..." (1re lecture, rejeté)
  VTANR5L17V1333: "DLR5L17N51362",
  // "l'ensemble de la proposition de loi organique fixant le statut du
  // procureur de la République anti-criminalité organisée" (1re lecture,
  // adopté — le dossier a changé de nom en cours de navette, d'abord
  // "procureur national anti-stupéfiants", seul un dossier "procureur"
  // existe dans Dossiers_Legislatifs.json.zip)
  VTANR5L17V1195: "DLR5L17N51078",
  // "l'ensemble de la proposition de loi de simplification du droit de
  // l'urbanisme et du logement" (1re lecture, adopté)
  VTANR5L17V1717: "DLR5L17N51852",
  // "l'ensemble du projet de loi d'urgence pour Mayotte" (1re lecture,
  // adopté)
  VTANR5L17V580: "DLR5L17N51222",
  // "l'ensemble de la proposition de loi visant à restaurer l'autorité de
  // la justice à l'égard des mineurs délinquants et de leurs parents" (1re
  // lecture, adopté)
  VTANR5L17V805: "DLR5L17N50690",
  // "l'ensemble de la proposition de loi visant à relancer les
  // investissements dans le secteur de l'hydroélectricité pour contribuer
  // à la transition énergétique" (1re lecture, adopté)
  VTANR5L17V5354: "DLR5L17N53530",
  // "l'ensemble du projet de loi organique relatif au Département-Région de
  // Mayotte" (1re lecture, adopté)
  VTANR5L17V2875: "DLR5L17N51984",
  // "l'ensemble du projet de loi portant transposition des accords
  // nationaux interprofessionnels en faveur de l'emploi des salariés
  // expérimentés et relatif à l'évolution du dialogue social" (1re lecture,
  // adopté)
  VTANR5L17V2935: "DLR5L17N52040",
  // "l'ensemble de la proposition de loi visant à optimiser la protection
  // et l'accompagnement des parents d'enfants atteints de cancers, de
  // maladies graves et de handicaps" (1re lecture, adopté)
  VTANR5L17V515: "DLR5L17N50444",
  // "l'ensemble de la proposition de loi visant à assurer le droit de
  // chaque enfant à être assisté d'un avocat dans le cadre d'une mesure
  // d'assistance éducative et de protection de l'enfance" (1re lecture,
  // adopté)
  VTANR5L17V4714: "DLR5L17N52781",
  // "l'ensemble du projet de loi spéciale prévue par l'article 45 de la loi
  // organique du 1er août 2001 relative aux lois de finances" (1re lecture,
  // adopté)
  VTANR5L17V4947: "DLR5L17N51079",
  // "l'ensemble de la proposition de loi visant à sortir la France du piège
  // du narcotrafic" (1re lecture, adopté)
  VTANR5L17V1194: "DLR5L17N50169",
  // "l'ensemble du projet de loi relative à l'organisation des jeux
  // Olympiques et Paralympiques de 2030" (1re lecture, adopté)
  VTANR5L17V4963: "DLR5L17N52100",
  // "l'ensemble de la proposition de loi visant à protéger les mineurs des
  // risques auxquels les expose l'utilisation des réseaux sociaux" (1re
  // lecture, adopté)
  VTANR5L17V5192: "DLR5L17N53187",
  // "la motion de rejet préalable... de la proposition de loi visant à
  // lever les contraintes à l'exercice du métier d'agriculteur" (1re
  // lecture, adoptée)
  VTANR5L17V2105: "DLR5L17N50819",

  // Ces 3 cas n'ont pas de correspondance dans Dossiers_Legislatifs.json.zip
  // (archive incomplète pour ces dossiers), identifiés par comparaison
  // directe avec les Fiches dossier déjà classées.
  // "l'ensemble de la proposition de loi relative à la sûreté dans les
  // transports" (1re lecture, adopté — même dossier que la lecture CMP déjà
  // couverte ci-dessus, VTANR5L17V1041)
  VTANR5L17V788: "DLR5L16N49176",
  // "l'ensemble de la proposition de loi relative au droit à l'aide à
  // mourir" (1re lecture, adopté — dossier "Fin de vie", cf. issue #81)
  VTANR5L17V2107: "DLR5L17N51670",
  // même dossier (2e lecture, adopté)
  VTANR5L17V5729: "DLR5L17N51670",

  // Retrouvés par recherche directe dans content/dossiers/ (titre du
  // dossier déjà connu de mémoire, hors méthode de #33).
  // "l'ensemble de la proposition de loi visant à renforcer le parcours
  // inclusif des enfants à besoins éducatifs particuliers" (1re lecture,
  // adopté)
  VTANR5L17V1550: "DLR5L17N50686",
  // "l'ensemble de la proposition de loi relative à l'organisation et aux
  // missions des professionnels de santé, vétérinaires, psychothérapeutes
  // et psychologues... des services d'incendie et de secours" (1re lecture,
  // adopté)
  VTANR5L17V912: "DLR5L17N51346",
  // "l'article unique de la proposition de loi visant à endiguer la
  // prolifération du frelon asiatique et à préserver la filière apicole"
  // (1re lecture, adopté)
  VTANR5L17V913: "DLR5L16N49472",
  // "l'ensemble du projet de loi de simplification de la vie économique"
  // (1re lecture, adopté)
  VTANR5L17V2458: "DLR5L16N49868",
  // "l'article unique de la proposition de loi visant à permettre
  // l'élection du maire d'une commune nouvelle en cas de conseil municipal
  // incomplet" (1re lecture, adopté)
  VTANR5L17V741: "DLR5L16N49843",

  // 4 dossiers nouvellement classés (content/dossiers/ créé dans le cadre
  // de cette reprise de #33) — absents des 187 dossiers déjà classés par
  // #34-#42, retrouvés par title-matching contre
  // Dossiers_Legislatifs.json.zip.
  // "l'article unique de la proposition de loi... relative à l'instauration
  // d'un nombre minimum de soignants par patient hospitalisé" (1re lecture,
  // adopté)
  VTANR5L17V599: "DLR5L17N50435",
  // "l'article unique de la proposition de loi visant à améliorer la
  // protection des commerçants grâce à l'usage d'outils numériques" (1re
  // lecture, adopté)
  VTANR5L17V5424: "DLR5L17N53158",
  // "l'ensemble de la proposition de loi visant à simplifier la sortie de
  // l'indivison successorale" (1re lecture, adopté — "indivison" est un
  // coquille du titre AN pour "indivision")
  VTANR5L17V921: "DLR5L17N52436",
  // "l'article unique de la proposition de loi simplifiant l'ouverture des
  // débits de boissons en zone rurale" (1re lecture, adopté)
  VTANR5L17V930: "DLR5L17N51453",
  // même dossier, vote sur l'ensemble plutôt que l'article unique (1re
  // lecture, adopté — confirmé par le voteRef de Dossiers_Legislatifs.json.zip
  // pour ce dossier, qui ne référence que ce scrutin)
  VTANR5L17V931: "DLR5L17N51453",

  // Décision #40 : les propositions de résolution comptent comme Dossier
  // législatif (cf. CONTEXT.md). 20 dossiers classés sur les 24 scrutins de
  // résolution sans dossierRef résolu identifiés par #33 — title-matching
  // contre Dossiers_Legislatifs.json.zip, avec vérification manuelle des
  // cas où 2 dossiers quasi identiques existent (plusieurs groupes déposent
  // souvent des résolutions séparées sur le même sujet ; seule celle allée
  // au bout de la navette porte le voteRef ou les actes de séance publique,
  // cf. commentaires ci-dessous). 1 scrutin reste sans correspondance
  // fiable ("réseaux sociaux face aux ingérences étrangères",
  // VTANR5L17V2283), ajouté à #41.
  // "l'article unique de la proposition de résolution européenne visant à
  // soutenir le Danemark et le Groenland..." (adopté)
  VTANR5L17V5300: "DLR5L17N51777",
  // "l'article unique de la proposition de résolution visant à étendre les
  // compétences du Parquet européen aux infractions à l'environnement"
  // (adopté)
  VTANR5L17V2282: "DLR5L17N51051",
  // "l'article unique de la proposition de résolution européenne appelant à
  // la préservation des principes démocratiques... en Turquie" (adopté)
  VTANR5L17V5307: "DLR5L17N51866",
  // "l'article unique de la proposition de résolution tendant à la création
  // d'une commission d'enquête sur le traitement judiciaire des violences
  // sexuelles incestueuses parentales..." (adopté)
  VTANR5L17V5225: "DLR5L17N53705",
  // même dossier, vote sur l'ensemble plutôt que l'article unique (adopté)
  VTANR5L17V5226: "DLR5L17N53705",
  // "l'article unique de la proposition de résolution européenne visant à
  // inscrire la mouvance des frères musulmans sur la liste européenne des
  // organisations terroristes" (adopté)
  VTANR5L17V5106: "DLR5L17N52132",
  // "l'article unique de la proposition de résolution européenne visant à
  // réaffirmer l'ambition climatique de la France au niveau européen"
  // (adopté)
  VTANR5L17V5316: "DLR5L17N53014",
  // "l'article unique de la proposition de résolution européenne visant à
  // rejeter le projet d'accord sur les droits de douane et le commerce du
  // 27 juillet 2025 entre l'Union européenne et les États-Unis" (adopté)
  VTANR5L17V5313: "DLR5L17N52598",
  // "l'ensemble de la proposition de résolution pour une stratégie
  // nationale de prévention sur le chemsex (article 34-1 de la
  // Constitution)" (adopté)
  VTANR5L17V1192: "DLR5L17N50589",
  // "l'article unique de la proposition de résolution européenne visant à
  // sauvegarder et renforcer le financement en faveur de la lutte contre le
  // virus de l'immunodéficience humaine" (adopté)
  VTANR5L17V5298: "DLR5L17N51679",
  // "l'article unique de la proposition de résolution européenne relative à
  // la mise en oeuvre du Protocole de l'OMS pour lutter contre le commerce
  // illicite de tabac" (adopté — à distinguer de DLR5L17N51520, un dossier
  // quasi identique déposé séparément mais qui n'est allé jusqu'à aucun
  // acte de séance publique, contrairement à celui-ci dont le voteRef
  // référence directement ce scrutin)
  VTANR5L17V4243: "DLR5L17N51615",
  // "l'ensemble de la proposition de résolution tendant à la création d'une
  // commission d'enquête sur les effets psychologiques de TikTok sur les
  // mineurs" (adopté)
  VTANR5L17V1018: "DLR5L17N52405",
  // même dossier, vote sur l'article unique (adopté)
  VTANR5L17V1017: "DLR5L17N52405",
  // "l'article unique de la proposition de résolution tendant à la création
  // d'une commission d'enquête sur les manquements des politiques publiques
  // de protection de l'enfance" (adopté)
  VTANR5L17V3: "DLR5L17N50595",
  // "l'article unique de la proposition de résolution européenne visant à
  // refuser la ratification de l'accord commercial entre l'Union
  // européenne et le Mercosur" (adopté — à distinguer de DLR5L17N50581, un
  // dossier au titre identique déposé séparément par un autre auteur, resté
  // au milieu du dépôt sans aucun acte de séance publique contrairement à
  // celui-ci)
  VTANR5L17V691: "DLR5L17N50939",
  // "l'article unique de la proposition de résolution modifiant le
  // Règlement de l'Assemblée nationale afin de supprimer le vote par assis
  // et levé" (adopté)
  VTANR5L17V960: "DLR5L17N51481",
  // "l'article unique de la proposition de résolution européenne appelant à
  // la libération immédiate et inconditionnelle de Boualem Sansal" (adopté)
  VTANR5L17V1570: "DLR5L17N51375",
  // "l'ensemble de la proposition de résolution relative à la publicisation
  // des doléances du grand débat national (art. 34-1 de la Constitution)"
  // (adopté)
  VTANR5L17V947: "DLR5L17N50452",
  // "l'ensemble de la proposition de résolution européenne relative à
  // l'adoption et à la mise en œuvre d'exigences à l'importation..."
  // (adopté)
  VTANR5L17V685: "DLR5L17N50476",
  // même dossier, vote sur l'article unique (adopté)
  VTANR5L17V684: "DLR5L17N50476",
  // "l'article unique de la proposition de résolution visant à condamner
  // l'oppression et la terreur imposées aux femmes iraniennes... (art. 34-1
  // de la Constitution)" (adopté — à distinguer de DLR5L17N50195, un
  // dossier au titre quasi identique déposé séparément mais resté au stade
  // du dépôt, sans discussion en séance contrairement à celui-ci)
  VTANR5L17V683: "DLR5L17N50590",
  // "l'article unique de la proposition de résolution européenne appelant
  // au renforcement du soutien à l'Ukraine" (adopté)
  VTANR5L17V988: "DLR5L17N51467",
  // "l'article unique de la proposition de résolution tendant à la création
  // d'une commission d'enquête relative aux violences commises dans les
  // secteurs du cinéma, de l'audiovisuel, du spectacle vivant, de la mode
  // et de la publicité" (adopté)
  VTANR5L17V2: "DLR5L17N50275",
};

// Exportée pour être réutilisée par le script d'audit de complétude
// (src/spi/filesystem/auditDossiersManquants.test.ts, cf. #33/#42) — la
// même logique de résolution (brut ?? curation manuelle) doit y être
// utilisée pour ne pas re-signaler comme "manquants" des scrutins déjà
// couverts par DOSSIER_REF_OVERRIDE.
export function normaliserDossierRef(
  uid: string,
  dossierRef: string | null
): string | null {
  return dossierRef ?? DOSSIER_REF_OVERRIDE[uid] ?? null;
}

function parseScrutin(raw: RawScrutinFile): Scrutin {
  const groupes = toArray(raw.scrutin.ventilationVotes.organe.groupes.groupe);

  return {
    uid: raw.scrutin.uid,
    titre: raw.scrutin.titre,
    date: raw.scrutin.dateScrutin,
    dossierRef: normaliserDossierRef(
      raw.scrutin.uid,
      raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null
    ),
    decompte: parseDecompte(raw.scrutin.syntheseVote.decompte),
    numero: parseCount(raw.scrutin.numero, "numero"),
    resultat: parseResultat(raw.scrutin.sort.code),
    positionsParGroupe: groupes.map((groupe) => ({
      organeRef: normaliserOrganeRef(groupe.organeRef),
      decompte: parseDecompte(groupe.vote.decompteVoix),
      effectif: parseCount(
        groupe.nombreMembresGroupe,
        "nombreMembresGroupe"
      ),
    })),
  };
}

export class FilesystemScrutinRepository implements ScrutinRepository {
  private zip: AdmZip | null = null;
  private indexParDossier: Map<string, Scrutin[]> | null = null;

  constructor(private readonly zipPath: string = ZIP_PATH) {}

  // L'archive (~40 Mo, 8000+ entrées) est coûteuse à ouvrir et à indexer ;
  // une seule instance est réutilisée par les deux méthodes de ce repository
  // plutôt que d'être reconstruite à chaque appel.
  private getZip(): AdmZip {
    if (!this.zip) {
      this.zip = new AdmZip(this.zipPath);
    }
    return this.zip;
  }

  async getByUid(uid: string): Promise<Scrutin | null> {
    const entry = this.getZip().getEntry(`json/${uid}.json`);
    if (!entry) {
      return null;
    }

    const raw = JSON.parse(
      entry.getData().toString("utf-8")
    ) as RawScrutinFile;

    return parseScrutin(raw);
  }

  async getByDossierRef(dossierRef: string): Promise<Scrutin[]> {
    return this.getIndexParDossier().get(dossierRef) ?? [];
  }

  // Construit l'index dossierRef -> scrutins en un seul passage sur les 8000+
  // entrées de l'archive, plutôt que de la reparcourir en entier à chaque
  // dossier demandé (le nombre de dossiers classés a fini par rendre ce
  // deuxième coût prohibitif : pages theme/sous-theme/dossier appellent
  // getByDossierRef pour chaque dossier de leur périmètre).
  private getIndexParDossier(): Map<string, Scrutin[]> {
    if (!this.indexParDossier) {
      const index = new Map<string, Scrutin[]>();

      for (const entry of this.getZip().getEntries()) {
        if (!entry.entryName.startsWith("json/") || entry.isDirectory) {
          continue;
        }

        const raw = JSON.parse(
          entry.getData().toString("utf-8")
        ) as RawScrutinFile;

        // Le dossierRef (brut ou corrigé par curation manuelle) détermine
        // s'il vaut la peine de parser intégralement ce scrutin — sans quoi
        // les entrées de test volontairement invalides hors de tout dossier
        // (décompte non numérique, sort inconnu) feraient échouer la
        // construction de l'index avant même d'atteindre le dossier demandé.
        const dossierRef = normaliserDossierRef(
          raw.scrutin.uid,
          raw.scrutin.objet.dossierLegislatif?.dossierRef ?? null
        );
        if (!dossierRef) {
          continue;
        }

        const scrutins = index.get(dossierRef) ?? [];
        scrutins.push(parseScrutin(raw));
        index.set(dossierRef, scrutins);
      }

      this.indexParDossier = index;
    }

    return this.indexParDossier;
  }
}
