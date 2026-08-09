# Discours de séance comme complément de Contexte pour les votes sur amendement à exposé des motifs minimal

Suite à #94 : sur les 2099 votes sur amendement dotés d'une Fiche "effet attendu" (`FicheScrutinEffetAttendu`, contenu réel tiré de l'amendement curé), 476 (23 %) ont un Contexte réduit à la seule ligne d'attribution ("Amendement de X à l'article Y.") — l'exposé des motifs écrit de l'amendement ne fait qu'un seul paragraphe, `scinderExposeSommaire` n'a alors rien de plus à y mettre.

## Piste rejetée — repli sur la Fiche dossier

Une première proposition consistait à compléter ce Contexte minimal avec `dossier.ficheDossier.contexte` quand l'exposé des motifs est trop court. Rejetée explicitement : le Contexte d'un vote sur amendement doit rester **spécifique à cet amendement précis**, jamais une redite du contexte général du dossier (déjà affiché ailleurs sur la Fiche dossier elle-même) — cf. décision similaire de #84 pour les votes sur le texte entier.

## Piste explorée et abandonnée — `DiscussionGenerale-dossiers-classifies.json.zip`

La piste initialement retenue par #94 (données de Discussion générale déjà extraites par le pipeline #87) a été testée sur l'exemple même cité par l'issue (`VTANR5L17V6496`, dossier `DLR5L17N50686`) : aucune donnée disponible pour ce dossier. Généralisé aux 476 cas : cette archive n'est indexée que par **un seul scrutin par dossier** (le vote sur l'ensemble) et ne couvre donc que la séance de ce vote précis — or l'examen des amendements se répartit sur de nombreuses autres séances. Sur les 234 cas (49 %) dont le dossier a par ailleurs de la Discussion générale disponible, seuls 2 amendements y sont réellement mentionnés. Abandonnée : pas exploitable à l'échelle.

## Décision — parsing direct des comptes rendus bruts (`compteRendu*.zip`), désambiguïsation par document officiel

Chaque `<paragraphe>` d'un compte rendu SYCERON porte, au moment précis où un amendement est appelé, les attributs `adt` (numéro d'amendement), `art` (article) et `bibard` (numéro de document officiel associé) — une source structurée bien plus fiable qu'une recherche textuelle ou qu'un découpage par date de séance.

Un premier rapprochement numéro+article seul s'est révélé insuffisant : deux textes sans rapport peuvent réutiliser la même paire (vérifié sur un cas réel — l'amendement n°21 à l'article 1er existe à la fois dans un texte sur les bourses étudiantes et dans un texte sur l'exploration d'hydrocarbures, examinés à quelques semaines d'écart). Un filtre par fenêtre de dates du dossier n'a pas suffi non plus (deux textes différents peuvent être examinés la même période). La désambiguïsation retenue croise en plus le `bibard` du segment contre les numéros de document officiel réels du dossier (`texteAssocie` dans `Dossiers_Legislatifs.json.zip`, à toutes les étapes de sa navette) — seul candidat filtre qui n'a produit aucun faux positif après vérification manuelle. En cas d'ambiguïté résiduelle (plusieurs lectures partageant le même document), départage par la date exacte du scrutin ; sinon, aucun contexte plutôt qu'un contexte incertain.

Seuls les paragraphes prononcés par l'auteur·ice de l'amendement lui-même (immédiatement après l'annonce du président/présidente) sont conservés — pas l'échange complet (avis commission/gouvernement, interruptions). Une défense trop courte ("Il est défendu.") est écartée : elle n'apporte rien de plus que la ligne d'attribution déjà affichée.

## Couverture réelle mesurée

| | Nombre | % des 476 |
|---|---|---|
| Contexte complété par un discours de séance vérifié | 204 | 43 % |
| Aucune trace exploitable (discussion en bloc sans intervention individuelle taguée, séance hors archives locales, ou défense trop courte) | 272 | 57 % |

Accepté comme couverture **best-effort**, pas exhaustive (question 3 de #94) : les cas non couverts gardent le Contexte minimal actuel, sans aucun repli — jamais un contexte approximatif ou celui d'un autre texte.

## Conséquences

- Nouveau module `spi/filesystem/discoursAmendementRepository.ts` (`DiscoursAmendementRepository`, `domain/compteRendu.ts`), branché dans `createGenererFicheScrutinEnrichie` en 4ᵉ dépendance.
- Le complément rejoint directement le champ `contexte` existant (question 4 de #94), à la place de `fond` quand celui-ci est absent — pas de nouveau champ ni de distinction visuelle : même mécanique que `fond` aujourd'hui.
- Pas de nouvel état de Fiche : `FicheScrutinEffetAttendu` ne change pas de forme.
