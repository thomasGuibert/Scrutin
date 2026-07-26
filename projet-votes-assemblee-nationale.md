# Projet : site de consultation des votes de l'Assemblée nationale

## Contexte général

Développeur C#/.NET avec expérience en architecture, DDD, TDD. Objectif : créer un site web permettant de consulter les votes de l'Assemblée nationale française, plus lisible et pédagogique que l'existant (NosDéputés.fr, La Fabrique de la Loi, Datan), sans les dupliquer.

**Constat de départ** : les sites existants ne montrent pas assez clairement "qui vote quoi, sur quel sujet de fond, dans quel but". Idée déclenchante : un commentaire du type *"je votais extrême droite par défaut jusqu'à ce que je me renseigne"*. L'objectif n'est **pas de faire changer d'avis**, mais de donner de l'information factuelle pour que la perception d'un parti s'appuie sur ses votes réels plutôt que sur ses discours.

## Stack technique envisagée (posée en tout début, mise de côté pour l'instant)

- Frontend : Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend : API Routes / Route Handlers de Next.js
- Base de données : PostgreSQL (Neon) + Prisma
- Déploiement : Vercel
- Import automatique : GitHub Actions (cron)
- Architecture : en couches / hexagonale — domaine indépendant de Next.js et Prisma

*Décision méthodologique : approfondir le fonctionnel avant de trancher l'architecture technique.*

## Objectif central et posture éditoriale

- **Informer, pas orienter** : le site reste **purement factuel**, ne porte jamais de jugement de valeur ("bon" ou "mauvais" vote). Le jugement de valeur appartient au lecteur, après lecture des faits.
- **Règle de rédaction pour tout texte du site (affinée en pratique)** : rester purement descriptif, jamais défensif. Ne pas écrire de phrases qui justifient la neutralité ou s'adressent au lecteur sur ce qu'il devrait en penser (ex. éviter "l'objectif n'est pas de vous faire changer d'avis", "aucun vote n'est jugé bon ou mauvais", "par souci de transparence") — même correctes sur le fond, ces formulations renvoient à des valeurs et sonnent comme une justification plutôt qu'un fait. Décrire ce que le site fait (données, source, méthode), point.
- Priorité fonctionnelle retenue : **thématisation des votes** (axe B) plutôt que détection de dissidence des députés (axe A) — cet axe est déjà bien couvert par Datan (score de "loyauté"/rébellion par groupe), donc mis de côté pour ne pas dupliquer.

### Objectif SMART (issu d'une session de grilling)

Stratégie en 3 temps : d'abord **profondeur d'usage** (B), pour que ça mène à de la **reconnaissance par des tiers de confiance** (C), pour finalement atteindre l'**ampleur de diffusion** (A). L'objectif ci-dessous ne couvre que la première étape (B), volontairement — c'est la seule mesurable sans dépendre d'acteurs externes (journalistes, réseau de diffusion).

> Dès la mise en ligne publique, atteindre et maintenir un taux d'au moins **50% des visiteurs uniques** qui, au moins une fois, **descendent jusqu'au niveau dossier législatif**, mesuré en continu sur une **fenêtre glissante de 3 mois**.

### Impact map

**Acteurs**
- *Primaires* : citoyen peu politisé/indécis (persona fondateur du projet) ; citoyen déjà engagé qui vérifie/conteste un discours de parti.
- *Secondaires* : le développeur/éditeur (toi) ; le curateur thématique (rôle actuellement tenu par toi).
- *En coulisses* : journalistes/fact-checkers susceptibles de relayer le site ; Assemblée nationale/Sénat (fournisseurs de la donnée).
- *Faisant obstacle* : comptes/médias qui relaient un chiffre agrégé hors contexte pour un récit partisan ; **visiteur sceptique qui présume d'emblée un biais éditorial et repart sans creuser** — impact jugé important pour la façon de présenter l'information (ton, design de la page d'accueil).

**Impacts (comportements visés)**
1. Descendre jusqu'au dossier pour vérifier avant de juger *(= l'objectif chiffré lui-même)*
2. Comparer un même sous-thème entre plusieurs groupes parlementaires
3. Ne pas rebondir sur le score agrégé sans creuser
4. Ne pas repartir dès la page d'accueil par présomption de biais
5. Partager/citer un lien vers un dossier précis (citoyen engagé, journalistes)
6. Publier de nouveaux thèmes/branches validés empiriquement, sans enfreindre la règle "sens politique = niveau sous-thème uniquement"
7. Instrumenter le suivi de profondeur de navigation dès le lancement
8. Contrer la récupération partisane d'un chiffre isolé

**Livrables candidats (hypothèses à tester, pas des engagements)** — voir impact visé entre parenthèses :
- Navigation arbre → nœud → dossier → scrutin, avec CTA explicite "voir les X dossiers" à chaque nœud agrégé (1, 3)
- Vue comparative entre groupes intégrée à la navigation, pas une feature à part (2)
- Page d'accueil montrant la neutralité dès le premier écran (ex. un scrutin consensuel en exemple, pas un sujet clivant) + charte éditoriale visible + design sobre non connoté (4)
- URLs stables/lisibles par dossier ou scrutin (permaliens) + carte de partage pré-remplie avec la source (5, 8)
- Méthode d'analyse empirique par commission (comme pratiqué pour École et Libertés & sécurité) à formaliser en process réutilisable (6)
- Analytics respectueux de la vie privée, sans profilage nominatif (7)

**Priorisation qui en découle** : continuer le travail de taxonomie en premier (impacts 1 et 6 en dépendent) ; travailler en parallèle le ton/design de la page d'accueil pour l'impact 4 (décision à prendre tôt, pas un correctif tardif) ; reporter permaliens/analytics/cartes de partage (5, 7, 8) à la phase technique.

### Décision : structure de la page d'accueil (prototype)

3 variantes structurelles testées (grille de tuiles / exemple en vedette / index éditorial), même identité visuelle — prototype de référence : https://claude.ai/code/artifact/7fd7f581-743b-4826-aef4-3c22c36d0853

**Retenu : la grille de tuiles** (un thème = une tuile, avec gloss neutre d'une ligne). Choisie parce qu'elle affiche l'ensemble des possibilités sans orienter le visiteur vers une direction — cohérent avec l'impact "ne pas repartir dès la home par présomption de biais". Testée jusqu'à 9 tuiles sans casser la mise en page, ce qui donne une marge confortable au-delà des 7 thèmes actuels : la structure de la home n'est donc plus bloquée sur la fin de la taxonomie.

**Faiblesse connue, à corriger dans un second temps** : la grille montre tout à plat mais ne suscite pas la curiosité par elle-même (contrairement à la variante "exemple en vedette", qui prouvait la neutralité par un cas concret). À retravailler plus tard — probablement en empruntant un élément de la variante B (un exemple mis en avant) sans perdre l'exhaustivité neutre de la grille.

**Ordre des tuiles** : classées par nombre de dossiers (décroissant), calculé en direct depuis les données — pas un choix éditorial. La première (plus grand volume) occupe une cellule pleine largeur, les 6 suivantes en grille 2 colonnes × 3 lignes.

**Règle de départage en cas d'égalité (spécifiée, pas encore implémentable)** : nombre de dossiers → puis nombre de scrutins → puis nombre de Votants, du plus large au plus fin (cohérent avec le modèle thème/dossier/scrutin déjà acté). Non codée dans le prototype actuel car on ne dispose que des vrais titres de dossiers — les scrutins et les votes y sont entièrement générés/fictifs, donc trier dessus produirait une fausse précision. Dans le prototype, l'égalité actuelle (Répartition des richesses / Environnement & ressources, 21 dossiers chacun) reste départagée arbitrairement (ordre d'origine des données), en attendant une vraie collecte de scrutins.

## Sources de données (par ordre de priorité)

1. **Assemblée nationale** (Open Data officiel) — données brutes : scrutins, dossiers législatifs, votes, groupes.
2. **Sénat / La Fabrique de la Loi** (data.senat.fr, réutilisé par lafabriquedelaloi.fr) — fournit une classification thématique multi-tag déjà existante (licence ODbL, attribution obligatoire, partage à l'identique des données dérivées).
3. **NosDéputés.fr / Datan** — en dernier recours seulement, pour enrichir (ex. indicateurs d'activité, mais pas indispensable pour le MVP).

### Ce qu'on sait des sources
- **Sénat/La Fabrique de la Loi** : fichier `dossiers.csv` avec colonne "Thèmes" (multi-tag), ~30 tags recensés dans l'échantillon exploré (Économie et finances/fiscalité, Questions sociales et santé, Justice, Environnement, Affaires étrangères, Travail, Éducation, Pouvoirs publics et Constitution, Collectivités territoriales, Police et sécurité, Énergie, Culture, Famille, Traités et conventions, Union européenne, Aménagement du territoire, Logement et urbanisme, Agriculture et pêche, Budget, Sécurité sociale, Entreprises, Défense, Transports, Anciens combattants, Outre-mer, Sports, Recherche/sciences/techniques, Fonction publique, PME/commerce/artisanat...). Licence ODbL.
- **Datan** : pas de taxonomie thématique publique ; fait de la curation éditoriale manuelle ("votes décryptés"), des scores de participation/loyauté/spécialisation par député.
- **Assemblée nationale (17e législature, à ce jour)** : 8190 scrutins publics, 2271 dossiers législatifs, tous sujets confondus. Pas de tagging thématique officiel — seule classification native : la commission saisie du texte (8 commissions permanentes).

## Périmètre du MVP

- **Législature en cours (17e)** uniquement pour la v1, pipeline d'ingestion conçu pour être rejouable sur d'autres législatures plus tard (port `ScrutinRepository` / `ImportScrutins` non couplé au format d'une législature précise).

## Modèle de données : structure de la taxonomie thématique

Arbre à 4 niveaux (potentiellement 5 avec des "branches" intermédiaires selon le thème) :

```
Thème racine (ex: Éducation & culture)
   └── Branche (ex: École / Audiovisuel & médias / Culture & patrimoine)
         └── Sous-thème = LE SEUL niveau qui porte un "pourquoi" / clivage politique
               └── Dossier législatif (hérite du thème du sous-thème)
                     └── Scrutin (vote réel des députés)
```

### Règle de méthode fondamentale (validée après plusieurs itérations)
- Le **sens politique** (la ligne de fracture, le "pourquoi") ne doit émerger **qu'au niveau sous-thème**, et seulement de façon empirique — en observant les dossiers réels, jamais en le plaquant a priori sur une catégorie.
- Les niveaux au-dessus (branche, thème racine) sont des **regroupements de navigation neutres**, sans prétention à représenter un clivage — ce sont des tiroirs de rangement, pas des affirmations politiques.
- **Ne jamais caler un thème sur une commission administrative officielle** : les commissions mélangent des sujets sans rapport (ex. la commission "Affaires culturelles et de l'éducation" couvre école + audiovisuel + patrimoine + sport + propriété intellectuelle — des questions de fond complètement différentes). La commission sert uniquement à héberger/retrouver les dossiers, jamais à décider de leur sens.
- Le nom du thème racine doit rester **neutre et descriptif**, pas connoté politiquement (ex. "Éducation & culture", pas "Éducation & émancipation" — ce dernier terme est plus connoté à gauche).
- **Invariant confirmé : un dossier appartient toujours à exactement un sous-thème**, y compris les dossiers trop consensuels/techniques pour porter un vrai clivage (ex. ratifications de traités bilatéraux, cf. cas d'étude n°7). Pour ces cas, chaque branche peut avoir un sous-thème générique **"Housekeeping / technique"** — pas un vrai clivage, mais ça préserve la navigation uniforme de l'arbre (aucun dossier "orphelin" sans sous-thème).

### 7 thèmes racines (hypothèses de travail, à ajuster à l'usage)
1. Répartition des richesses (fiscalité, salaires, aides sociales, retraites, pouvoir d'achat)
2. Environnement & ressources (écologie, énergie, agriculture, aménagement du territoire)
3. Libertés & sécurité (justice, police, surveillance, immigration, libertés individuelles)
4. Solidarité & protection sociale (santé, handicap, famille, logement)
5. Éducation & culture (école, audiovisuel/médias, culture/patrimoine — *renommé, anciennement "Éducation & émancipation"*)
6. Souveraineté & rôle de la France dans le monde (défense, diplomatie, Europe, commerce international)
7. **Institutions** (vie démocratique & pouvoirs publics, collectivités territoriales & décentralisation, droit civil & état des personnes) — *ajouté après le test de généralisation sur "Libertés & sécurité", voir cas d'étude ci-dessous*

*Note : un thème "Culture, médias & information" avait été envisagé après avoir découvert que l'audiovisuel/la culture n'avaient pas leur place sous Éducation, puis finalement réintégré comme branche sous "Éducation & culture" plutôt que comme thème séparé.*

### Cas d'étude travaillé en détail : "Éducation & culture"

Sur 16 dossiers réels de la 17e législature rattachés à la commission "Affaires culturelles et de l'éducation" (échantillon non exhaustif), seuls 8 concernent vraiment l'école/enseignement — les 8 autres sont de l'audiovisuel, de la culture/patrimoine, de la propriété intellectuelle.

**Branche École — 4 sous-thèmes (émergés empiriquement) :**
1. *Accès à l'école : égalité territoriale vs adaptation aux réalités locales* — mixité sociale et scolaire ; regroupements pédagogiques intercommunaux en milieu rural ; enseignement scolaire dans les départements frontaliers.
2. *Contrôle de l'État vs autonomie de l'enseignement supérieur* — régulation de l'enseignement supérieur privé ; commission d'enquête sur le pluralisme dans le supérieur.
3. *Uniformité républicaine vs reconnaissance des identités locales* — cérémonie de la laïcité dans les établissements scolaires ; réussite scolaire des ultramarins via l'apprentissage des langues régionales.
4. *Rôle de l'école dans la formation civique et patriotique* — enseignement à la défense nationale dans le parcours de citoyenneté (sous-thème à un seul dossier — normal et accepté).

**Branche Audiovisuel & médias** (moins abouti, à retester) : indépendance/gouvernance de l'audiovisuel public ; propriété intellectuelle face à l'IA.

**Branche Culture & patrimoine** (moins abouti, à retester) : financement/transmission du patrimoine (restitution de biens culturels, restes humains kali'nas) ; protection des personnes dans le monde culturel (violences morales/sexistes/sexuelles).

### Cas d'étude n°2 : test de généralisation sur "Libertés & sécurité"

Objectif : vérifier que la règle "le sens politique n'émerge qu'au niveau sous-thème" tient sur un thème racine différent, plus gros. Méthode : téléchargement du jeu de données officiel de l'Assemblée nationale (`Dossiers_Legislatifs.json.zip`, 17e législature, 2822 dossiers rattachés à une commission) et comptage réel par commission saisie au fond (au lieu d'une estimation).

**Résultat inattendu** : contrairement à la commission "Affaires culturelles et de l'éducation" (qui se limitait à 3 sujets de fond proches, tous logeables sous "Éducation & culture"), la commission des lois (36% de tout le volume législatif, 830 dossiers — la commission la plus prolifique de l'Assemblée) est **beaucoup plus hétérogène** : elle mélange plusieurs domaines sans rapport entre eux. Seule une partie relève réellement de "Libertés & sécurité" ; le reste a révélé un trou dans le modèle à 6 thèmes, comblé par la création du thème **Institutions** (voir ci-dessus).

**Sous-thèmes émergés empiriquement pour la branche "Justice, police & immigration" (thème Libertés & sécurité) :**
1. *Sécurité : fermeté pénale vs garanties individuelles* — peines planchers, présomption de légitime défense pour les forces de l'ordre, vidéoprotection algorithmique/reconnaissance faciale, contrôles d'identité, sanction du refus d'obtempérer.
2. *Immigration : restriction vs protection des droits des étrangers* — accélération des OQTF/expulsions, rétention administrative, vs droit du sol, naturalisation, droit de vote des résidents étrangers, accès au travail des demandeurs d'asile.
3. *Laïcité : neutralité stricte vs reconnaissance des expressions religieuses* — signes religieux à l'école/à l'université/dans le sport, crèches de Noël, entrisme islamiste, neutralité des lieux de culte.
4. *Protection des victimes (violences sexuelles, intrafamiliales, mineurs)* — inceste, féminicides, pédocriminalité : gros volume, mais plus consensuel/moins clivant que les 3 sous-thèmes précédents (comparable au sous-thème à dossier unique accepté pour École).

**Branches du thème Institutions (nouveau, hypothèses à affiner)**, issues du reste des dossiers de la commission des lois :
- *Vie démocratique & pouvoirs publics* : mode de scrutin, réforme constitutionnelle, statut du parlementaire/cumul des mandats, financement de la vie politique, Conseil constitutionnel, référendum, CESE, destitution du Président — probablement le plus gros gisement de dossiers de toute l'Assemblée.
- *Collectivités territoriales & décentralisation* : compétences eau/assainissement, communes nouvelles, intercommunalité, statut de l'élu local, métropoles, statuts spécifiques outre-mer (Mayotte, Nouvelle-Calédonie, Corse, Polynésie).
- *Droit civil & état des personnes* : successions, filiation/PMA, protection juridique des majeurs — moins abouti, à retester (nature un peu différente des deux autres branches, plus proche du droit privé que de l'organisation des pouvoirs publics ; à surveiller si ça justifie un thème à part plus tard).

### Cas d'étude n°3 : détail de la branche "Vie démocratique & pouvoirs publics"

163 dossiers analysés (le plus gros morceau d'Institutions). Sous-thèmes émergés empiriquement :

1. *Mode de scrutin : proportionnelle vs scrutin majoritaire* — le plus gros bloc ; la réforme du scrutin municipal dans les communes de moins de 1000 habitants revient sans cesse (contestée, rétablie, reportée par des textes concurrents), plus tout le débat proportionnelle/majoritaire pour les législatives.
2. *Pouvoirs : renforcer le Parlement vs préserver la prééminence présidentielle* — limiter le pouvoir de dissolution du Président, renforcer le Parlement face au Gouvernement, discussions type "VIe République".
3. *Démocratie : référendum d'initiative citoyenne vs démocratie représentative* — référendums d'initiative citoyenne (délibératif, révocatoire, constitutionnel), conventions citoyennes.
4. *Droit de vote : ouvrir aux résidents étrangers vs réserver aux nationaux* — clivage classique et net (plusieurs propositions quasi identiques déposées par des groupes différents à travers la législature).
5. *Cumul des mandats : autoriser vs interdire* — statut du parlementaire/élu local.
6. *Transparence et probité de la vie politique* — financement occulte des campagnes, casier judiciaire vierge pour candidats, affichage électoral. Plus consensuel/technique, comme le sous-thème "protection des victimes" trouvé dans Libertés & sécurité.
7. *Laïcité institutionnelle : neutralité stricte vs reconnaissance des expressions religieuses* — Charte de la laïcité, devise nationale, signes religieux pour les élus locaux. Ajouté après coup (cf. exemple concret `impactTags[]` ci-dessous) : ces dossiers n'entraient dans aucun des 6 sous-thèmes précédents, ils avaient besoin de leur propre sous-thème dans cette branche.

**Point méthodologique confirmé** : ce sous-thème recoupe le sous-thème laïcité déjà trouvé dans Libertés & sécurité, et touche aussi École. Conformément à la règle déjà actée (`impactTags[]`, voir "Niveau de granularité du tag thématique"), ce n'est **pas un axe transversal à part** — chaque branche garde son propre sous-thème laïcité, et ils se recoupent simplement via leurs tags d'impact, exactement comme prévu par le modèle existant.

**Exemple concret d'`impactTags[]` en action** (premier cas réellement travaillé, pas seulement noté en théorie) :

| Dossier réel | `primaryTheme` | `impactTags[]` |
|---|---|---|
| "Cérémonie de la laïcité dans les établissements scolaires" | Éducation & culture › École › "Uniformité républicaine vs reconnaissance des identités locales" | `["Laïcité"]` |
| "Interdire le port de signes ou de tenues manifestant de manière ostensible une appartenance religieuse ou politique dans le cadre scolaire et universitaire" | Libertés & sécurité › Justice, police & immigration › "Laïcité : neutralité stricte vs reconnaissance des expressions religieuses" | `["Laïcité"]` |
| "Proposition de loi visant à instituer une Charte de la laïcité" | Institutions › Vie démocratique & pouvoirs publics › "Laïcité institutionnelle : neutralité stricte vs reconnaissance des expressions religieuses" | `["Laïcité"]` |

Le `primaryTheme` de chacun est déterminé par sa commission d'origine réelle (donc structurel, pas un choix éditorial) ; le tag `"Laïcité"` permet de les rassembler en dehors de l'arbre thématique, peu importe où ils vivent dedans. Produire cet exemple a directement révélé le sous-thème manquant ci-dessus — la vertu de rendre les choses concrètes plutôt que de les laisser à l'état de règle abstraite.

**Frontière à ajuster** : les statuts spéciaux outre-mer à portée constitutionnelle (autonomie de la Corse, Nouvelle-Calédonie) chevauchent la branche Collectivités territoriales — même type d'ajustement de frontière que pour Affaires sociales (Répartition des richesses / Solidarité).

### Cas d'étude n°4 : Répartition des richesses

Confirme ce qui n'était qu'une hypothèse dans le doc : ce thème **n'est pas alimenté par une seule commission**, mais par un vrai découpage transversal entre la commission des Finances (231 dossiers) et une partie de la commission des Affaires sociales (469 dossiers, dont ~57 nettement retraites/salaires/minima sociaux contre ~186 nettement santé/handicap/famille — le reste ambigu à trancher au cas par cas). Cohérent avec la règle de ne jamais caler un thème sur une commission administrative.

**Branche 1 — Fiscalité & régulation économique** (commission des Finances) :
1. *Fiscalité : alourdir l'impôt des plus riches vs alléger les prélèvements* — fiscalité des grandes fortunes/successions/superprofits vs exonérations ciblées (auto-entrepreneurs, heures supplémentaires, transmission de patrimoine).
2. *Rôle de l'État dans l'économie : nationalisations vs marché* — signature récurrente et marquée (ArcelorMittal x2, sidérurgie, autoroutes, Vencorex, Fibre Excellence, TotalEnergies).
3. *Protection du consommateur bancaire* — plafonnement des frais bancaires (5 propositions quasi identiques), fraude aux paiements. Plus consensuel.
   *(Le volet budget/gestion des finances publiques — lois de finances, règle d'or — duplique avec le sous-thème "Pouvoirs : renforcer le Parlement vs préserver la prééminence présidentielle" de Vie démocratique via `impactTags`, pas un sous-thème à part ici.)*

**Branche 2 — Retraites, salaires & minima sociaux** (sous-ensemble d'Affaires sociales) :
1. *Retraites : capitalisation vs répartition* — le plus gros bloc et le plus clivant, revient sans cesse (abrogation de la retraite à 64 ans proposée plusieurs fois).
2. *Salaires : indexation obligatoire vs négociation libre* — indexation sur l'inflation, échelle mobile des salaires, exonération des heures supplémentaires.
3. *Minima sociaux : conditionner à l'activité vs garantir l'universalité* — RSA conditionné à l'activité vs universalité des aides, plafonnement du cumul des allocations.
4. *Licenciements économiques : encadrer vs liberté de l'entreprise*.

**Sous-produit utile pour la suite** : les ~186 dossiers d'Affaires sociales nettement santé/handicap/famille alimentent directement le thème Solidarité & protection sociale — une partie du travail sur ce thème est donc déjà dégrossie.

### Cas d'étude n°5 : Solidarité & protection sociale

Sous-thèmes émergés (à partir du sous-ensemble santé/handicap/famille d'Affaires sociales, cf. cas d'étude n°4) :

1. *Fin de vie : légaliser l'aide à mourir vs renforcer les soins palliatifs* — clivage fort, déjà connu nationalement (débat "fin de vie" 2023-2024).
2. *Accès aux soins sur le territoire* — déserts médicaux (une proposition explicitement labellisée "initiative transpartisane"), médecins à diplôme hors UE, pharmacies rurales. Plutôt consensuel/technique.
3. *Handicap : droits et accompagnement* — allocation adultes handicapés, discrimination à l'emploi, accompagnants d'élèves handicapés.
4. *Politique familiale : nataliste vs ciblée sur les familles vulnérables* — d'un côté relance de la natalité, de l'autre soutien aux familles monoparentales/précarité — clivage à vérifier plus finement.
5. *Protection de l'enfance* — aide sociale à l'enfance, enfants placés, maltraitance ; beaucoup de résolutions d'enquête sur des défaillances institutionnelles.
6. *Santé publique : réguler les produits à risque vs liberté de consommation* — tabac/nicotine/sucre/protoxyde d'azote : clivage paternalisme d'État vs liberté de consommation.

**Duplications attendues via `impactTags`** (pas de nouvel axe, cohérent avec la règle actée) : violences sexistes et sexuelles (recoupe le sous-thème homonyme de Libertés & sécurité) ; conditions de travail/licenciements (recoupe Répartition des richesses).

**Point ouvert** : le "logement" (pourtant dans la définition du thème) n'apparaît quasiment pas dans Affaires sociales — les dossiers logement vus jusqu'ici (prêt à taux zéro, accession à la propriété) viennent en fait de la commission des Finances. Frontière/source encore à clarifier.

### Cas d'étude n°6 : Environnement & ressources

Source : commission Développement durable & aménagement du territoire (160 dossiers). Contrairement à Commission des lois, celle-ci correspond plutôt bien au thème tel que défini.

**Sous-thèmes émergés** :
1. *Zones à faibles émissions (ZFE) : mobilité propre imposée vs liberté de circulation* — le plus gros bloc et le plus récurrent (abroger/moratoire/supprimer/"bon développement" des ZFE reviennent sans cesse) — clivage écologie/coût de la vie très net.
2. *Éolien : transition énergétique vs protection des riverains* — encadrer le développement, indemniser les propriétaires impactés, sécuriser l'éolien en mer.
3. *Eau agricole : mégabassines et irrigation vs moratoire environnemental* — moratoire sur les mégabassines et les ouvrages de stockage pour l'irrigation, protection de l'eau potable. (Le conflit des mégabassines avait déjà émergé côté Libertés & sécurité via Sainte-Soline — mais il s'agissait du maintien de l'ordre, pas de la politique de fond : cohérent, pas une redite.)
4. *Prédateurs et chasse : réguler le loup vs protection animale stricte* — pièges à colle, trophées de chasse, faune sauvage captive — clivage rural/chasseurs vs protection animale, très récurrent.
5. *Souveraineté énergétique : nucléaire/hydrocarbures vs sobriété* — gouvernance de la sûreté nucléaire (IRSN/ASN), gaz de schiste, exploitation des hydrocarbures "au service de la souveraineté énergétique" — chevauche potentiellement le thème Souveraineté (à dupliquer via `impactTags`, pas à trancher ici).
6. *Mobilités et transports du quotidien* — ferroviaire, zones rurales/peu denses, droit de grève dans les transports — plus service public que clivage pur.

Plus consensuel/technique en périphérie : déchets/plastique (économie circulaire), nuisances aéroportuaires locales.

**Point ouvert** : l'agriculture pure (exploitations, PAC) est quasi absente d'ici — probablement dans la commission des Affaires économiques (332 dossiers, pas encore dépouillée), comme pour le logement.

### Cas d'étude n°7 : Souveraineté & rôle de la France dans le monde

Source : commissions Affaires étrangères + Défense (87 dossiers, le plus petit volume des 7 thèmes).

**Sous-thèmes émergés** :
1. *Diplomatie : soutien vs condamnation des régimes étrangers* — le plus clivant de loin : résolutions sur Israël/Palestine, Ukraine, Mercosur, USA/Trump, Géorgie, Turquie, Algérie, Afghanistan, RDC/Rwanda — divergence nette entre groupes selon les régimes visés.
2. *Doctrine de défense et effort militaire* — loi de programmation militaire 2024-2030, rétablir le service national, contrôle parlementaire sur les exportations d'armements, traité sur les systèmes d'armes autonomes.
3. *Réparation et reconnaissance mémorielle* — Harkis, essais nucléaires (Polynésie, Algérie), massacre de Thiaroye, Lebensborn, réhabilitation de Dreyfus, rapatriés d'Indochine.
4. *Monde combattant et anciens militaires* — statut de vétéran, indemnisation des invalidités, sites mémoriels — plutôt consensuel/transpartisan.

Bruit de fond très consensuel : une grosse quantité de ratifications de traités bilatéraux techniques (extradition, entraide judiciaire, coopération défense bilatérale, accords aériens) — quasi jamais clivants. Rattachés au sous-thème générique **"Housekeeping / technique"** de cette branche (cf. règle de méthode fondamentale) plutôt qu'à un des 4 sous-thèmes ci-dessus, qu'ils dénatureraient.

**Première passe sur les 7 thèmes racines terminée** à ce stade (certains plus approfondis que d'autres — voir points ouverts).

### Cas d'étude n°8 : Affaires économiques (commission transversale, comme Affaires sociales)

332 dossiers. Ferme deux points ouverts laissés en suspens (logement, agriculture) — cette commission n'est rattachée à aucun thème unique, elle nourrit plusieurs thèmes déjà identifiés.

**→ Logement** (ferme le point ouvert de Solidarité & protection sociale) :
1. *Régulation locative vs droit de propriété* — le plus gros bloc, très clivant : encadrement des loyers, garantie universelle des loyers, trêve des expulsions, réquisition de logements vacants, vs protection du droit de propriété face aux occupations, facilitation des expulsions.
2. *Logement social* — attribution, gouvernance, fin du maintien à vie vs prioriser certains publics.
3. *Rénovation énergétique des logements* — duplique naturellement avec Environnement (énergie) via `impactTags`.

**→ Agriculture** (ferme le point ouvert d'Environnement & ressources) :
1. *Pesticides et loi Duplomb : écologie/santé publique vs compétitivité agricole* — le sujet le plus chaud et récurrent (plusieurs propositions pour abroger la loi Duplomb et interdire les néonicotinoïdes, face à des textes pour "lever les contraintes" à l'exercice du métier d'agriculteur) — sujet politique national déjà connu.
2. *Souveraineté alimentaire et circuits courts* — restauration collective, filières locales, "produire autrement".

**→ Énergie** : renforce (avec un vrai volume de dossiers en plus) le sous-thème "Souveraineté énergétique" déjà repéré dans Environnement (cas d'étude n°6) — prix de l'énergie, nationalisation TotalEnergies/Engie, concessions hydroélectriques, nucléaire vs photovoltaïque. Pas un nouveau sous-thème, confirmation avec plus de matière.

**→ Vie chère en outre-mer** : pouvoir d'achat, régulation des prix/marges spécifiquement outre-mer — rattaché à Répartition des richesses, avec un angle géographique propre.

Plus consensuel en périphérie : protection des consommateurs (démarchage téléphonique, droit de rétractation), numérique/télécoms, protection animale hors chasse (recoupe le sous-thème "chasse et protection animale" d'Environnement).

**Les 8 commissions permanentes de l'Assemblée nationale ont maintenant toutes été dépouillées** (Lois, Affaires sociales, Affaires économiques, Finances, Affaires culturelles et éducation, Développement durable, Affaires étrangères, Défense) — plus de nouvelle source de commission à explorer. Le travail restant est d'approfondissement (branches encore superficielles) plutôt que de découverte.

## Modèle de calcul des positions de vote

### Niveau scrutin individuel
- **Badge à 3 zones** : Pour / Divisé / Contre, par groupe parlementaire.
- **Seuil** : "Divisé" si le camp minoritaire (Pour vs Contre) dépasse 33% des **Votants**.
- **Base de calcul — terminologie précisée** : **Votants** = pour + contre + abstention (tout le monde sauf les absents). Ce terme est délibérément distinct de **Suffrages exprimés** (sens institutionnel usuel à l'Assemblée nationale : pour + contre uniquement, abstention exclue) — les deux notions ne se recoupent pas, ne pas les confondre au moment d'importer les vraies données de scrutin. **Les absences ne sont pas traitées pour l'instant** (ni intégrées au badge, ni affichées séparément — reporté à une itération ultérieure).
- Détail chiffré exact accessible en un clic (tooltip ou page dédiée — à trancher techniquement plus tard).

### Agrégation multi-scrutins (ex: tous les scrutins d'un sous-thème)
- Résultat exprimé dans la **même grammaire** que le niveau scrutin : % Pour / % Contre / % Abstention agrégés (pas de score arbitraire +1/0/-1).
- **Pondération : par le taux de participation du groupe sur chaque scrutin** (nombre de votants du groupe / effectif total du groupe) — pas une simple moyenne du nombre de scrutins, pas un poids arbitraire décidé par l'éditeur du site (ce qui serait un jugement de valeur déguisé).
- Effet positif de ce choix : un scrutin technique voté par une poignée de députés pèse naturellement moins qu'un scrutin solennel largement suivi, sans qu'on ait à décider "à la main" qu'un scrutin est plus important qu'un autre.
- Le badge Pour/Divisé/Contre peut être réappliqué sur le résultat agrégé final pour un affichage synthétique.

## Comparaison entre groupes parlementaires

Ce n'est **pas une fonctionnalité séparée** : c'est la navigation même de l'arbre thématique. À chaque nœud de l'arbre (thème, branche, sous-thème, dossier, scrutin), l'utilisateur voit la comparaison agrégée des groupes sur l'ensemble des scrutins rattachés à ce nœud. Le scrutin individuel est simplement la vue "feuille" de cet arbre.

## Niveau de granularité du tag thématique

- Le thème est appliqué **au niveau du dossier législatif** (hérité par tous ses scrutins), pas scrutin par scrutin — pour rester réalisable (un dossier peut contenir des milliers d'amendements).
- **Tags d'impact optionnels** (`impactTags[]`) : en complément du thème principal (`primaryTheme`), un scrutin peut recevoir des tags additionnels (ex. "Écologie", "Agriculture", "Hôpital") ajoutés progressivement, prioritairement sur les scrutins solennels (les plus consultés), via un pipeline semi-automatique (suggestion + validation humaine) à construire plus tard.

## Sourcing des thèmes : ordre de priorité retenu

1. Données brutes Assemblée nationale (scrutins, dossiers, votes)
2. Classification thématique Sénat / La Fabrique de la Loi (multi-tag existant, réutilisable ODbL)
3. NosDéputés.fr / Datan en dernier recours si besoin d'enrichissement

## Points encore ouverts / à approfondir

- Fiche député (reporté)
- Page de recherche / filtrage (reporté)
- Affiner les branches Audiovisuel & médias et Culture & patrimoine (moins abouties que École — jamais redescendues au niveau sous-thème)
- Affiner les branches Collectivités territoriales et Droit civil & état des personnes d'Institutions (Vie démocratique & pouvoirs publics est désormais détaillée, cf. cas d'étude n°3) ; ajuster la frontière outre-mer statutaire entre Vie démocratique et Collectivités territoriales
- Affiner la frontière ambiguë restante entre Solidarité et Répartition des richesses (~226 dossiers d'Affaires sociales encore non tranchés entre les deux)
- Premier exemple concret d'`impactTags[]` produit (cas laïcité, voir cas d'étude n°3) — reste à traiter les autres duplications déjà repérées (violences sexistes/sexuelles, licenciements économiques, rénovation énergétique, énergie/souveraineté) de la même façon, puis à implémenter le mécanisme dans un vrai schéma de données une fois le code démarré
- Reprendre l'architecture technique (Next.js, Prisma, structure du repo — mono-projet avec dossiers `src/domain` / `src/application` / `src/infrastructure`, discipline imposée par lint type dependency-cruiser plutôt que monorepo, décision provisoire prise en tout début d'échange avant le pivot vers le fonctionnel)
- Absentéisme des députés : non traité pour l'instant, à réintégrer plus tard comme indicateur séparé (pas fusionné dans le badge Pour/Divisé/Contre)
- Dossiers sans scrutin (encore en commission, jamais mis au vote) : exclus du site en v1 (pas de Position à montrer). Décision explicitement provisoire — à revisiter plus tard dans les développements, garder en tête (cf. `CONTEXT.md`)
- Non-inscrits (NI) : à distinguer d'un vrai groupe parlementaire dans l'UI (regroupement administratif, pas une position politique cohérente, cf. `CONTEXT.md`) — le prototype actuel les traite encore comme un groupe ordinaire parmi 12, à corriger
