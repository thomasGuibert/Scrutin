# Scrutin

Site de consultation des votes de l'Assemblée nationale française, organisés par thème plutôt que par discours de parti. Domaine central : classer des dossiers législatifs et leurs scrutins dans une taxonomie thématique construite empiriquement, puis afficher la position de chaque groupe parlementaire à chaque niveau de cette taxonomie.

## Language

### Taxonomie thématique

**Thème racine**:
Le niveau le plus haut de la taxonomie (7 à ce jour : Répartition des richesses, Environnement & ressources, Libertés & sécurité, Solidarité & protection sociale, Éducation & culture, Souveraineté & rôle de la France, Institutions). Un regroupement de navigation neutre, sans clivage politique propre — ce n'est qu'un tiroir de rangement.
_Avoid_: Thème (ambigu avec Sous-thème si le contexte ne précise pas), Catégorie, Commission (jamais calé sur une commission administrative — voir Commission permanente)

**Branche**:
Niveau intermédiaire optionnel entre Thème racine et Sous-thème (ex. École / Audiovisuel & médias / Culture & patrimoine sous "Éducation & culture"). Comme le thème racine, un regroupement neutre — pas un clivage.
_Avoid_: Sous-catégorie

**Sous-thème**:
Le seul niveau de la taxonomie où un clivage politique peut légitimement apparaître — émerge uniquement de façon empirique, en observant les dossiers réels, jamais plaqué a priori. Ne garantit pas qu'un clivage existe réellement (voir Sous-thème clivant / Sous-thème consensuel) : c'est le niveau de granularité correct pour le chercher, pas une promesse qu'il s'y trouve. Un sous-thème peut ne contenir qu'un seul dossier (accepté, pas une anomalie).
_Avoid_: Sujet, Axe (l'axe transversal a été explicitement rejeté comme modèle — voir Tag d'impact), Catégorie

**Sous-thème clivant**:
Un sous-thème dont les dossiers opposent nettement deux positions, nommé au format "Label : A vs B" (ex. "Retraites : capitalisation vs répartition").
_Avoid_: Sous-thème (sans précision, quand la distinction clivant/consensuel importe)

**Sous-thème consensuel**:
Un sous-thème dont les dossiers partagent un sujet de fond mais sans opposition nette entre groupes parlementaires — nommé simplement par son sujet, pas au format "A vs B" (ex. "Protection des victimes", "Transparence et probité de la vie politique", "Accès aux soins sur le territoire"). Reste un sous-thème à part entière, pas une case à part.

**Sous-thème "Housekeeping / technique"**:
Cas dégénéré de sous-thème consensuel : dossiers purement procéduraux, sans même un sujet de fond distinctif (ex. ratifications de traités bilatéraux techniques). Une branche peut en porter un, générique, pour préserver l'invariant "un dossier appartient toujours à exactement un sous-thème" sans forcer un faux clivage ni un faux sujet.
_Avoid_: Divers, Non classé (le dossier reste classé — juste dans un sous-thème sans clivage ni sujet propre)

**Dossier législatif**:
Un texte législatif (proposition ou projet de loi) déposé à l'Assemblée nationale. Unité d'application du thème : appartient à exactement un sous-thème, dont il hérite le thème racine et la branche. Peut contenir plusieurs scrutins — ou aucun (encore en commission, jamais mis au vote) ; **en v1, un dossier sans scrutin n'est pas affiché sur le site** (pas de Position à montrer), question à rouvrir plus tard.
_Avoid_: Texte, Proposition/Projet de loi (trop spécifique — un dossier peut désigner l'un ou l'autre)

**Fiche dossier (Contexte / Action / Résultat attendu)**:
Résumé en trois temps accompagnant un dossier législatif dans la navigation : **Contexte** (la situation ou le problème qui motive le dépôt), **Action** (ce que le texte propose de changer concrètement), **Résultat attendu** (l'effet visé si le texte est adopté). Structure fixe, indépendante du sous-thème auquel appartient le dossier.

**Scrutin**:
Un vote réel des député·es à l'Assemblée nationale, rattaché à un dossier législatif. Le niveau feuille de la taxonomie — celui où le badge Pour/Divisé/Contre est calculé par groupe parlementaire à partir des voix réelles.
_Avoid_: Vote (trop générique — un scrutin est l'événement, le "vote" est ce qu'émet un groupe ou un individu dans ce scrutin)

**Nœud**:
N'importe quel niveau de l'arbre thématique (thème racine, branche, sous-thème, dossier ou scrutin) sur lequel une Position agrégée par groupe parlementaire peut être affichée. La comparaison entre groupes n'est pas une fonctionnalité séparée : c'est la navigation même de l'arbre.

**Commission permanente**:
Une des 8 commissions de l'Assemblée nationale saisies au fond d'un dossier (ex. Commission des lois, Commission des finances). Source de données brute pour retrouver les dossiers — jamais utilisée comme thème racine, car elle mélange des sujets de fond sans rapport entre eux.
_Avoid_: Thème, Catégorie (une commission n'a pas de sens politique propre, contrairement à un sous-thème)

### Classification transversale

**Tag d'impact**:
Un tag additionnel optionnel qu'un dossier peut porter en plus de son sous-thème d'appartenance, pour le relier à un même sujet de fond qui recoupe plusieurs sous-thèmes/branches/thèmes (ex. "Laïcité" recoupe École, Justice/police/immigration, et Vie démocratique). Remplace la notion d'"axe transversal" — la duplication par tag est préférée à un niveau de taxonomie séparé.
_Avoid_: Axe transversal (rejeté comme modèle), Catégorie secondaire

### Vote et agrégation

**Position**:
Le résultat Pour / Divisé / Contre d'un groupe parlementaire sur un scrutin donné, ou sur l'agrégat de plusieurs scrutins rattachés à un même nœud de l'arbre. Exprimée dans la même grammaire (% Pour / % Contre / % Abstention) à tous les niveaux — jamais un score arbitraire. **À partir du niveau Dossier législatif (et au-dessus), la Position d'un groupe ne s'agrège pas sur tous les scrutins du dossier — voir Scrutin décisif.**
_Avoid_: Badge (nom de la représentation visuelle du concept, pas le concept lui-même), Score, Vote (voir Scrutin)

**Scrutin décisif**:
Le scrutin qui a réellement acté ou rejeté un dossier législatif — le plus récent (numéro le plus élevé, un dossier peut connaître plusieurs lectures) parmi ceux qui tranchent réellement son sort, sous l'une de ces formes selon la manière dont l'export AN titre le vote : le vote sur "l'ensemble" du texte (le cas le plus courant) ; le vote sur son "article unique" (un texte à article unique n'a pas de vote sur l'ensemble distinct) ; un vote direct sur le texte lui-même sans article ni ensemble nommé (certaines ratifications de traité) ; une motion de rejet préalable *adoptée*, qui tue le texte avant tout vote sur l'ensemble (rejetée, elle ne change rien : le texte poursuit son parcours normal) ; ou une motion de censure, dont le vote est lui-même l'objet entier du dossier (jamais rattachée à un texte de loi, donc décisive quelle que soit son issue). C'est lui, et lui seul, qui alimente la Position d'un groupe au niveau Dossier législatif et au-dessus (Sous-thème, Branche, Thème racine) — jamais une moyenne sur tous les scrutins du dossier (amendements, articles), qui diluerait la position de fond d'un groupe sur le texte avec ses votes de détail. Un dossier sans Scrutin décisif (encore en cours d'examen) ne contribue à aucune Position tant qu'il n'y en a pas.
_Avoid_: Vote final (imprécis — ne dit pas qu'il s'agit du vote sur l'ensemble)

**Vote individuel**:
Le choix d'un·e député·e sur un scrutin donné : Pour, Contre, Abstention, ou Absent. Unité atomique dont la Position d'un groupe parlementaire est calculée par sommation — la Position n'existe qu'agrégée, jamais au niveau d'un·e député·e seul·e (pas de "fiche député" pour l'instant, cf. points ouverts).
_Avoid_: Voix (ambigu — désigne parfois un décompte plutôt qu'un choix individuel)

**Divisé**:
Valeur de Position qu'un groupe parlementaire prend sur un scrutin (ou un agrégat) quand son camp minoritaire (Pour vs Contre) dépasse 33% des Votants. En dessous de ce seuil, la Position est Pour ou Contre selon le camp majoritaire.

**Votants**:
Dénominateur du calcul de Position : pour + contre + abstention (tout le monde sauf les député·es absent·es). Délibérément distinct des **Suffrages exprimés** au sens institutionnel de l'Assemblée nationale (pour + contre uniquement, abstention exclue) — les deux ne se recoupent pas, ne pas les confondre en important les vraies données de scrutin.
_Avoid_: Votants exprimés, Suffrages exprimés (réservé au sens institutionnel, non utilisé actuellement dans le modèle du site)

**Taux de participation (du groupe, sur un scrutin)**:
Ratio Votants du groupe / effectif total du groupe sur un scrutin donné. Sert de pondération quand la Position est agrégée sur plusieurs scrutins (ex. à l'échelle d'un sous-thème) — un scrutin technique peu suivi pèse ainsi naturellement moins qu'un scrutin solennel largement suivi, sans décision éditoriale arbitraire sur l'importance relative des scrutins.
_Avoid_: Participation (trop générique sans préciser "du groupe" et "sur quel scrutin")

**Groupe parlementaire**:
Formation politique cohérente à laquelle appartient un·e député·e à l'Assemblée nationale (11 pour la 17e législature). Unité de comparaison de la Position à chaque nœud de l'arbre.
_Avoid_: Inclure les Non-inscrits sous ce terme (voir Non-inscrits)

**Non-inscrits (NI)**:
Regroupement purement administratif des député·es sans groupe parlementaire — pas une ligne politique cohérente, juste une case de décompte de l'Assemblée nationale. Distinct d'un Groupe parlementaire : sa Position est affichée à titre indicatif dans les comparaisons, mais annotée comme non représentative d'une position politique unifiée.
_Avoid_: Groupe parlementaire, 12e groupe

**Législature**:
Mandat électoral de 5 ans de l'Assemblée nationale (17e législature en cours = périmètre du MVP).
