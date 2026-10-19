# Pipeline quotidien AN — récupération et curation autonomes

Runbook exécuté intégralement par la session Claude Code fraîche que la
Routine planifiée (quotidienne, `trig_01UAWWZvWVG3SRnoksnACTJ5`, 05:03 UTC)
démarre chaque jour — spécifié par l'issue
[#126](https://github.com/thomasGuibert/Scrutin/issues/126). Chaque run part
sans contexte de conversation préalable : ce document doit se suffire à
lui-même.

Objectif : que le site reste à jour sans qu'un humain ait à relancer le
processus à la main (cf. `data/raw/an/17/README.md` pour l'état des données
brutes). Législature 17 uniquement — pas de détection de changement de
législature.

**Aucun run ne se termine sans laisser de trace consultable sur GitHub**,
quelle que soit son issue (rien à faire, merge, PR de doute, échec) — cf.
Étape 8. Un run silencieux (aucun commentaire, aucun commit, aucune PR) est
un run qui n'a pas suivi ce runbook jusqu'au bout, même s'il n'y avait
réellement rien à curer ce jour-là.

## Étape 1 — Se situer

- **En tout premier**, si l'outil `add_repo` (Claude Code Remote) est
  disponible dans cette session : l'appeler avec
  `owner: thomasGuibert`, `repo: Scrutin`, `access: "push"`, **avant toute
  autre opération git**. Une session fraîche démarrée par la Routine ne part
  avec aucun dépôt attaché par défaut (ni lecture ni écriture) — sans cet
  appel, `git push`/l'API GitHub échouent avec un refus du type "not in
  this session's authorized repository set" quand bien même le clone
  initial fonctionne. Si l'outil renvoie une erreur d'autorisation malgré
  l'appel (dépôt non activé pour cet environnement), c'est alors un échec
  complet de run (Étape 6), pas quelque chose à contourner.
- `git fetch origin main && git checkout main && git pull` pour partir d'un
  état à jour.
- Créer une branche de travail dédiée à ce run : `automation/an-YYYY-MM-DD`
  (date du jour).

## Étape 2 — Récupérer les données brutes

```
npm run an:recuperer
```

Retélécharge `Scrutins.json.zip`, `Dossiers_Legislatifs.json.zip`,
`AMO10_deputes_actifs_mandats_actifs_organes.json.zip` **et
`compteRendu.zip`** (archive officielle unique de tous les comptes rendus de
séance, `syceronbrut/syseron.xml.zip` — remplace depuis le 2026-08-19 les
anciens lots manuels `compteRendu1.zip`…`compteRendu4.zip`) depuis
data.assemblee-nationale.fr, et n'écrase un fichier local que si son contenu
a réellement changé (comparaison par hash). Le script log
`modifié`/`inchangé` par fichier — **un fichier "modifié" ici ne veut pas
encore dire "à committer"** : l'AN régénère parfois un export avec des
métadonnées internes différentes sans changement de fond, c'est l'Étape 3
qui tranche.

Les URLs sont codées en dur dans `scripts/lib/recupererDonneesAN.ts`
(`SOURCES`), vérifiées en direct le 2026-08-19. Si un téléchargement échoue
avec une redirection vers une page HTML (le jeu de données a été déplacé sur
le portail), corriger l'URL dans ce fichier avant de continuer — ce n'est
pas en soi un échec de run (cf. Étape 6). Le téléchargement retry
automatiquement (4 tentatives, backoff 2s/4s/8s) : le proxy réseau de
l'environnement ferme parfois la connexion en cours de transfert sur les
plus grosses archives, de façon intermittente — un run qui échoue après les
4 tentatives est un vrai problème réseau, pas juste de la malchance.

Si `data.assemblee-nationale.fr` est inaccessible depuis cette session après
les retries (politique réseau de l'environnement), c'est un échec complet de
run — aller directement à l'Étape 6.

## Étape 3 — Détecter les nouveautés

```
npm run an:detecter-nouveautes
```

Compare le contenu des 3 archives "catalogue" (Scrutins, Dossiers
législatifs, AMO10 — pas `compteRendu.zip`, cf. Étape 4) fraîchement
téléchargées à la version encore commitée sur `HEAD` (comparaison par nom de
fichier interne à l'archive, donc par `uid`/`dossierRef`, jamais par diff
brut de l'archive zip entière — un fichier peut être "modifié" au sens de
l'Étape 2 sans qu'aucune entrée ne change réellement). Sortie : un rapport
JSON listant les scrutins nouveaux/modifiés (avec `dossierRef`, `decisif`,
`raisonsDeDoute`) et les dossiers nouveaux/modifiés.

`raisonsDeDoute` couvre automatiquement 3 des 4 déclencheurs de doute de
l'étape 7 : `dossierRef-absent`, `plf-plfss`, `vote-de-conscience`. Le 4e
(sous-thème incertain) ne peut être évalué qu'au moment de la
classification thématique (Étape 4bis).

Si aucun scrutin/dossier nouveau ou modifié n'est rapporté ici, **et** que
`npm run an:fusionner-curation` (Étape 4bis) ne trouve non plus rien de
nouveau, **et** que `npm run curer:amendements` (Étape 4ter) laisse son
archive inchangée : **rien à curer** (pas de commit, pas de PR — cf. issue #126 point
2, pas de commit no-op quotidien) — restaurer les fichiers `data/raw/an/17/`
modifiés par l'Étape 2 sans changement réel (`git checkout --
data/raw/an/17/`) plutôt que de les committer tels quels, puis passer quand
même à l'Étape 8 pour journaliser ce constat. Ne jamais s'arrêter ici sans
journaliser : c'est le cas qui, en pratique, se confond le plus facilement
avec un run qui n'a pas eu lieu ou qui a échoué en silence.

Ce cas exige **zéro** scrutin et **zéro** dossier nouveau ou modifié dans le
rapport. Des scrutins nouveaux non décisifs (amendements d'un dossier non
classé, typiquement le PLF/PLFSS) ou des dossiers nouveaux sans scrutin
décisif ne sont **pas** « rien à curer » : il n'y a rien à rédiger, mais les
données brutes ont réellement changé et doivent être committées et publiées
(Étape 7), sinon `main` reste figé et chaque run suivant redétecte les mêmes
nouveautés.

## Étape 4 — Curer chaque nouveau scrutin décisif

Pour chaque scrutin **décisif** (`decisif: true`) nouveau ou modifié dont le
`dossierRef` n'est pas déjà classé dans `content/dossiers/`, avec la même
rigueur que le travail fait pour les issues
[#94](https://github.com/thomasGuibert/Scrutin/issues/94) et
[#96](https://github.com/thomasGuibert/Scrutin/issues/96) :

1. **Fiche dossier** (`content/dossiers/<dossierRef>.md`) — frontmatter
   `dossierRef`/`titre`/`sousTheme`/`tagsImpact`, puis les 3 sections
   `## Contexte` / `## Action` / `## Résultat attendu` (cf. Fiche dossier,
   `CONTEXT.md`).
2. **Classification thématique** — rattacher à un sous-thème **existant**
   de `src/spi/filesystem/taxonomie.ts` (`DeclaredTaxonomyRepository`).
   Ne jamais forcer un dossier dans le sous-thème "le moins pire" : la
   taxonomie n'émerge qu'empiriquement (`CONTEXT.md`). Si aucun sous-thème
   existant ne convient clairement, marquer ce dossier en doute
   (`sous-theme-incertain`, Étape 7) plutôt que de trancher.

**Exception PLF/PLFSS et votes de conscience** (`raisonsDeDoute` contient
`plf-plfss` ou `vote-de-conscience`) : faire la fiche dossier et la
classification thématique normalement (le dossier doit apparaître avec ses
vraies données de vote), mais **ne pas** lancer l'Étape 4bis pour ce
dossier — cf. [#130](https://github.com/thomasGuibert/Scrutin/issues/130),
pas encore spécifié. Ces cas passent de toute façon en PR de doute
(Étape 7), qui sert à vérifier que la détection automatique est correcte.

Pour un scrutin non décisif (amendement, article, procédure) d'un dossier
déjà classé : aucune action requise à ce stade, ces scrutins sont couverts
automatiquement dès que la Fiche dossier existe.

Pour un scrutin non décisif d'un dossier **non classé** (y compris un
PLF/PLFSS dont `raisonsDeDoute` contient `plf-plfss`) : rien à curer non plus,
mais la mise à jour des données brutes reste à publier (Étape 7). Un
`raisonsDeDoute` porté uniquement par des scrutins non décisifs n'est pas un
déclencheur de doute : aucun contenu n'est produit pour eux, il n'y a donc
rien à faire vérifier.

## Étape 4bis — Enrichir Explications de vote / Discussion générale

```
npm run an:fusionner-curation
```

**Ne jamais lancer directement `npm run curer:explications-vote` ou
`curer:discussion-generale` dans ce pipeline** — piège vérifié le
2026-08-18 (cf. `data/raw/an/17/README.md`) : ces deux commandes régénèrent
l'archive *entière* à partir de ce qu'elles détectent mécaniquement
aujourd'hui, et écrasent donc silencieusement toute la curation éditoriale
manuelle accumulée par ailleurs (historique git : "Curation lot N (#95)") —
constaté à l'usage : régénère 127 dossiers couverts contre 197 commités
pour Explications de vote. `an:fusionner-curation` fait la même détection
mécanique mais **fusionne** le résultat dans les archives commitées sans
jamais toucher à une entrée déjà présente (cf.
`scripts/lib/fusionnerCurationAN.ts`) — seul chemin sûr pour ce pipeline.

Lit son rapport (dossiers/scrutins ajoutés) directement sur stdout — à
reprendre tel quel dans le message de commit et le résumé de l'Étape 8. Un
rapport "0 ajout" pour les deux archives, combiné à un `an:detecter-nouveautes`
également vide (Étape 3), confirme le cas "rien à curer".

## Étape 4ter — Rafraîchir le contenu des amendements

```
npm run curer:amendements
```

Télécharge l'archive complète `Amendements.json.zip` (~300 Mo, dans un
dossier temporaire, jamais commitée) et régénère
`data/raw/an/17/Amendements-scrutins-classifies.json.zip` pour tous les
scrutins d'amendement des dossiers classés. Sans cette étape, un amendement
d'un dossier classé après la dernière extraction n'affiche que son titre AN
reformulé, sans exposé des motifs (constaté le 2026-10-15 sur le dossier
titre-restaurant). Contrairement aux Explications de vote, cette archive ne
contient aucune curation manuelle : la régénérer entièrement est sûr.
L'archive n'est réécrite que si son contenu change ; quand elle l'est, c'est
une nouveauté à committer au même titre que celles des Étapes 3 et 4bis
(ne pas la restaurer dans le cas "rien à curer"). Un échec de
téléchargement ici n'est pas un échec complet de run : le signaler dans le
résumé de l'Étape 8 et continuer.

## Étape 4quater — Résumer les Explications de vote

```
npm run an:resumes -- --manquants
```

Liste en JSON les interventions d'Explications de vote encore sans
`resume` (typiquement celles ajoutées par l'Étape 4bis). Tant qu'un seul
groupe d'un scrutin n'a pas de résumé, la Fiche Scrutin n'affiche pas le
tableau par groupe et l'encart « Prises de parole » indique « en cours de
résumé ». Si la liste est vide, passer à l'Étape 5.

Sinon, rédiger un résumé par intervention à partir de son `texte`, puis les
écrire dans un fichier JSON temporaire (hors du dépôt) au format
`[{ "dossierRef", "scrutin", "groupe", "resume" }]` et l'appliquer :

```
npm run an:resumes -- <fichier.json>
```

Règles de rédaction (même format que les résumés déjà en ligne) :

- Une seule phrase factuelle, au présent, d'environ 40 à 70 mots.
- Si l'orateur·ice annonce le vote du groupe : « Le groupe <nom> vote
  pour/contre ce texte / s'abstient, … » suivi des raisons avancées.
- Sinon : « Intervention <ce qu'elle soutient ou critique> ; sans détailler
  davantage la position de vote du groupe dans cet extrait. »
- Ne reprendre que ce que dit l'intervention : pas de jugement, pas
  d'adjectif évaluatif, pas de contexte extérieur (cf. posture éditoriale,
  `CONTEXT.md`).

Le script refuse de remplacer un résumé existant ou de viser une
intervention introuvable. Les résumés ne sont pas un déclencheur de doute
(choix de Thomas du 2026-10-15) : ils sont livrés comme le reste du run ;
lister chacun (dossier, scrutin, groupe) dans le message de commit et le
commentaire de l'Étape 8.

## Étape 5 — Vérifier

Dans cet ordre, en s'arrêtant au premier échec :

```
npm run lint
npm test
npm run audit:dossiers
npm run audit:fiches
npm run audit:rattachements
npm run build
```

Un échec à n'importe laquelle de ces étapes est un déclencheur de doute
(Étape 7), pas un échec complet de run (Étape 6) — les données ont bien été
récupérées, c'est la curation qui a produit un état invalide à faire
relire. `audit:rattachements` échoue actuellement sur `main` de façon
préexistante et connue (5 désaccords, cf.
[#134](https://github.com/thomasGuibert/Scrutin/issues/134)) — tant que ce
ticket n'est pas résolu, **chaque run** passera en PR de doute à cause de
lui, même sans rien de nouveau à curer ce jour-là. Ne pas essayer de
contourner ni de désactiver cet audit pour autant : le signaler comme
raison du doute (Étape 7) reste correct, résoudre #134 est le seul vrai
correctif.

## Étape 6 — Échec complet du run

Si `an:recuperer`/`an:detecter-nouveautes`/`an:fusionner-curation` a échoué
avant même d'atteindre la vérification (ex. source AN inaccessible malgré
les retries, archive corrompue) :

1. Chercher une issue déjà ouverte avec un titre commençant par
   `Pipeline AN en échec` (recherche GitHub — outil MCP GitHub
   `search_issues`/`list_issues` selon ce qui est disponible dans cette
   session).
2. Si une telle issue existe déjà et est ouverte : y ajouter un commentaire
   avec la date et l'erreur du jour, ne pas en créer une seconde (anti-spam,
   cf. #126 point 8).
3. Sinon, en créer une nouvelle : titre `Pipeline AN en échec — <date>`,
   corps = message d'erreur complet + étape atteinte, label
   `ready-for-human` (cf. `docs/agents/triage-labels.md` — nécessite une
   intervention humaine, ex. URL de jeu de données déplacée).
4. Ce commentaire/cette issue **fait office de journalisation** pour ce run
   (Étape 8) — ne pas dupliquer sur #126 en plus. Arrêter le run ici (ne pas
   ouvrir de PR partielle).

## Étape 7 — Publier

**Aucun déclencheur de doute rencontré et l'Étape 5 est entièrement
verte** :

- Committer tous les changements sur la branche `automation/an-YYYY-MM-DD`,
  avec un message clair listant les dossiers/scrutins traités (reprendre le
  rapport de l'Étape 4bis pour Explications de vote/Discussion générale).
- Fusionner directement dans `main` (merge ou fast-forward) et pousser —
  pas de PR intermédiaire à faire approuver, pas de dépendance à une CI
  GitHub Actions séparée (hors périmètre de #126 : la vérification a déjà
  eu lieu à l'Étape 5, dans cette même session).
- Supprimer la branche de travail.

**Au moins un déclencheur de doute** (échec technique de l'Étape 5 déjà
couvert ci-dessus ; ou, sur les scrutins **décisifs** curés à l'Étape 4 :
`dossierRef-absent`, `plf-plfss`, `vote-de-conscience`, ou sous-thème ne
correspondant clairement à aucun sous-thème existant — un `raisonsDeDoute`
sur des scrutins non décisifs seulement ne compte pas, cf. Étape 4) :

- Committer tout de même les changements sur la branche (y compris les cas
  non ambigus traités dans le même run — ne pas les perdre).
- Ouvrir **une seule** PR regroupant tous les cas en doute de ce run, avec
  un corps qui liste explicitement, par dossier/scrutin :
  - la raison du doute,
  - ce qui a été fait automatiquement (ex. "classé en PLF, narratif exclu —
    à confirmer"),
  - le cas échéant, la question précise à trancher (ex. "aucun `dossierRef`
    résolu, dossier candidat probable : DLR5L17N#####, à confirmer par
    rapprochement de titre").
- Laisser la PR ouverte, ne pas merger. Pas de notification dédiée
  au-delà de la notification GitHub standard (nouvelle PR sur un dépôt dont
  le propriétaire est notifié par défaut).
- Ne pas committer directement sur `main` dans ce cas, même partiellement.

Dans les deux cas (merge auto ou PR de doute), passer ensuite à l'Étape 8.

## Étape 8 — Journaliser le résultat du run

Objectif : qu'on puisse savoir ce qu'un run a fait **sans avoir à ouvrir son
transcript de session** — en lisant simplement l'issue #126 sur GitHub.
Cette étape s'applique à **tous** les cas qui n'ont pas déjà journalisé par
eux-mêmes (le commentaire/l'issue de l'Étape 6 en tient déjà lieu pour un
échec complet — ne pas doubler).

Poster un commentaire sur
[l'issue #126](https://github.com/thomasGuibert/Scrutin/issues/126)
résumant le run du jour, avec toujours au minimum :

- la date et l'heure du run ;
- `an:recuperer` : modifié/inchangé, par fichier ;
- `an:detecter-nouveautes` : nombre de scrutins/dossiers nouveaux/modifiés,
  et leurs `raisonsDeDoute` le cas échéant ;
- `an:fusionner-curation` : dossiers/scrutins ajoutés, par archive ;
- `an:resumes` : nombre de résumés rédigés (Étape 4quater) ;
- le résultat de l'Étape 5 (vert, ou première étape en échec) ;
- l'issue du run : `rien à curer`, `mergé sur main (<sha>)`, ou
  `PR de doute ouverte (<lien>)`.

Exemple minimal pour un run "rien à curer" :

```
Run du 2026-08-20 05:03 UTC — rien à curer.
an:recuperer : Scrutins inchangé, Dossiers législatifs inchangé, AMO10 inchangé, comptes rendus inchangé.
an:detecter-nouveautes : 0 scrutin nouveau/modifié, 0 dossier nouveau/modifié.
an:fusionner-curation : 0 ajout (Explications de vote), 0 ajout (Discussion générale).
```

Un commentaire par run, jamais regroupé ni omis — c'est le seul historique
fiable de l'activité quotidienne du pipeline.

## Hors périmètre de ce runbook

- Revoir la stratégie de stockage des archives brutes (snapshot commité vs.
  stockage externe) — reste tel qu'aujourd'hui, cf. ADR-0001.
- Définir une méthode de curation pour PLF/PLFSS — cf. #130, ticket séparé.
- Passer à un pipeline CI classique (GitHub Actions) — la Routine
  quotidienne s'appuie sur l'outillage Claude Code Remote, pas sur un
  déclenchement CI.
