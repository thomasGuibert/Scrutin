# Contexte étoffé (Contexte/Action/Résultat attendu) + discussion générale comme source pour les scrutins décisifs

Suite à #84/#85 : sur un vote décisif (« vote sur le texte entier »), la Fiche affichée aujourd'hui (`FicheScrutinExplicationsVote`) réduit tout le contexte à une seule phrase (`contexteIntro`, reprise de l'`Action` de la Fiche dossier) suivie du tableau des positions. Les deux variantes qui apportent de la valeur identifiées en #84 (tableau détaillé par parti, contexte étendu) doivent être combinées plutôt que mutuellement exclusives — cf. le proto validé le 2026-08-07 sur `DLR5L17N50579` (harmonisation du mode de scrutin municipal).

## Décision 1 — Structure de la Fiche d'un scrutin décisif

**Contexte → Action → Résultat attendu → Tableau des positions → Résultat**, dans cet ordre :

- `Contexte`, `Action`, `Résultat attendu` reprennent les **trois champs de la Fiche dossier** (`FicheDossier`, cf. `content/dossiers/*.md`), pas un champ `contexteIntro` séparé — cohérence avec la Fiche générique (`genererFicheScrutin`) et avec les Fiches dossier déjà rédigées pour la totalité des ~220 dossiers classifiés.
- Le tableau des positions par groupe (`explicationsParGroupe`) est inséré **après** `Résultat attendu`, jamais à la place d'`Action`/`Résultat attendu` comme c'était le cas jusqu'ici.
- `Résultat` (l'issue réelle du scrutin — adopté/rejeté, décompte) reste **en dernier**, inchangé.

## Décision 2 — La Position (Pour/Contre/Divisé) du tableau vient toujours du décompte réel, jamais du ton d'une intervention

`Position` (`calculerPosition`, `domain/scrutin.ts`) est déjà calculée depuis le décompte réel de vote du groupe sur ce scrutin précis (`comparerGroupes`) — **ce mécanisme ne change pas**. Le point explicité ici, suite à une erreur commise dans un premier prototype manuel (résumés de discussion générale utilisés pour *deviner* une position du type « Partagé »/« Critique » au lieu du triptyque réel Pour/Contre/Divisé) : quelle que soit la source du texte de justification (`resume`), la case Position ne doit **jamais** être déduite du ton d'une intervention — uniquement du décompte. Un groupe peut avoir un discours nuancé et un vote net (ex. DR/LIOT sur `DLR5L17N50579` : discours mesuré, vote très majoritairement Contre) — les deux informations sont indépendantes et doivent le rester dans l'implémentation.

## Décision 3 — La discussion générale comme source complémentaire aux Explications de vote (#87)

Sur les scrutins décisifs sans bloc "Explications de vote" structuré (104 sur 194 selon #80/#87), la **discussion générale** du même compte rendu contient des interventions nommées exploitables. Contrairement à Explications de vote, ces interventions ne portent pas le groupe entre parenthèses dans le texte — validé sur `DLR5L17N50579` (séance du 7 avril 2025, aucun bloc EV, discussion générale complète) : le rattachement se fait en croisant l'`<id>` numérique de l'orateur avec le fichier officiel des mandats de l'Assemblée (`AMO10_deputes_actifs_mandats_actifs_organes.json.zip`, déjà dans `data/raw/an/17/`), **en respectant les dates de mandat** — la composition des groupes change en cours de législature (ex. création de l'UDR).

Conséquences pratiques vérifiées sur le cas réel :

- Les 12 groupes ayant voté sur ce scrutin ont chacun une position réelle (Pour/Contre/Divisé) ; 11 ont une intervention en discussion générale exploitable, 1 (UDR) n'en a aucune sur ce texte précis — la case reste vide plutôt que remplie arbitrairement, comme pour Explications de vote (cf. issue #59 : jamais une ligne omise, jamais un résumé forcé).
- Le volume de discussion générale est nettement supérieur à un bloc Explications de vote (plusieurs interventions par orateur, mélangées à des échanges de procédure) — le tri éditorial pour en tirer un résumé fiable par groupe reste manuel, comparable en effort au travail déjà fait sur les lots d'Explications de vote.

## Décision 4 — Ne jamais déduire un Sous-thème clivant de l'agrégat de plusieurs dossiers sans vérifier chaque dossier individuellement

Vérifié en cherchant, parmi les sous-thèmes déclarés `consensuel`, des candidats à repasser `clivant` (format « Label : A vs B ») : la position agrégée par groupe sur l'ensemble des dossiers d'un sous-thème (`agregerPositionsDossiers`) peut masquer une réalité bien plus disparate au niveau de chaque dossier pris individuellement — même erreur de nature que celle déjà écartée par la Décision 2 (déduire une conclusion éditoriale d'une donnée qui ne la porte pas directement), transposée à la classification plutôt qu'au résumé d'un scrutin.

Deux cas concrets observés :

- **« Lutte contre la fraude sociale et fiscale »** (2 dossiers) : l'agrégat affichait un clivage net (bloc de gauche Contre, reste du spectre Pour). En détail, un seul des deux textes porte ce clivage (« Lutte contre les fraudes sociales et fiscales ») ; l'autre (« Contre toutes les fraudes aux aides publiques ») est adopté à l'**unanimité des 12 groupes**.
- **« Conditions de vie et santé des agriculteurs »** (2 dossiers) : même schéma — « Lever les contraintes à l'exercice du métier d'agriculteur » est clivant, mais « Protéger la santé mentale des agricultrices et des agriculteurs » est lui aussi adopté à l'**unanimité**.

Un troisième candidat (fusionner « Simplification du droit et de la vie économique » et « Protection des consommateurs et des commerçants » en un seul sous-thème clivant, les deux affichant des « Contre » isolés du même bloc de gauche) est tombé pour une raison différente mais apparentée : la lecture des Fiches dossier montre qu'il ne s'agit pas d'un même axe politique cohérent (dérégulation vs protection), mais de textes disparates où les « Contre » isolés semblent tenir à des dispositions spécifiques (ex. l'angle sécuritaire de certains textes de protection des commerçants) plutôt qu'à une ligne de fracture partagée. Une similarité de surface entre intitulés de sous-thèmes, ou une coïncidence de vote entre dossiers sans rapport de fond, n'est pas non plus une base suffisante.

**Conséquence pratique** : avant de reclasser un sous-thème `consensuel` en `clivant`, ou de fusionner plusieurs sous-thèmes en un seul sous-thème clivant, toujours vérifier la position **dossier par dossier** (pas seulement l'agrégat), et lire le contenu réel des Fiches dossier concernées — jamais se fier à un agrégat statistique ou à une similarité d'intitulé seuls.

## Conséquences

- `FicheScrutinExplicationsVote` passe de `{ contexteIntro, explicationsParGroupe, resultat }` à `{ contexte, action, resultatAttendu, explicationsParGroupe, resultat }`.
- Le tri éditorial (rédaction des `Contexte`/`Action`/`Résultat attendu` étoffés + résumés du tableau) reste un travail par lots, comme pour Explications de vote jusqu'ici — pas un chantier "tout en un coup".
- Un nouveau module d'extraction (discussion générale + rattachement acteur → groupe par date de mandat) est nécessaire en complément du module Explications de vote existant (`compteRenduRepository.ts`), pas en remplacement.
