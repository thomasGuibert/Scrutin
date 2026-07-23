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
- Priorité fonctionnelle retenue : **thématisation des votes** (axe B) plutôt que détection de dissidence des députés (axe A) — cet axe est déjà bien couvert par Datan (score de "loyauté"/rébellion par groupe), donc mis de côté pour ne pas dupliquer.

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

### 6 thèmes racines de départ (hypothèses de travail, à ajuster à l'usage)
1. Répartition des richesses (fiscalité, salaires, aides sociales, retraites, pouvoir d'achat)
2. Environnement & ressources (écologie, énergie, agriculture, aménagement du territoire)
3. Libertés & sécurité (justice, police, surveillance, immigration, libertés individuelles)
4. Solidarité & protection sociale (santé, handicap, famille, logement)
5. Éducation & culture (école, audiovisuel/médias, culture/patrimoine — *renommé, anciennement "Éducation & émancipation"*)
6. Souveraineté & rôle de la France dans le monde (défense, diplomatie, Europe, commerce international)

*Note : un 7e thème "Culture, médias & information" avait été envisagé après avoir découvert que l'audiovisuel/la culture n'avaient pas leur place sous Éducation, puis finalement réintégré comme branche sous "Éducation & culture" plutôt que comme thème séparé.*

### Cas d'étude travaillé en détail : "Éducation & culture"

Sur 16 dossiers réels de la 17e législature rattachés à la commission "Affaires culturelles et de l'éducation" (échantillon non exhaustif), seuls 8 concernent vraiment l'école/enseignement — les 8 autres sont de l'audiovisuel, de la culture/patrimoine, de la propriété intellectuelle.

**Branche École — 4 sous-thèmes (émergés empiriquement) :**
1. *Égalité territoriale et sociale d'accès à l'école* — mixité sociale et scolaire ; regroupements pédagogiques intercommunaux en milieu rural ; enseignement scolaire dans les départements frontaliers.
2. *Contrôle de l'État vs autonomie de l'enseignement supérieur* — régulation de l'enseignement supérieur privé ; commission d'enquête sur le pluralisme dans le supérieur.
3. *Uniformité républicaine vs reconnaissance des identités locales* — cérémonie de la laïcité dans les établissements scolaires ; réussite scolaire des ultramarins via l'apprentissage des langues régionales.
4. *Rôle de l'école dans la formation civique et patriotique* — enseignement à la défense nationale dans le parcours de citoyenneté (sous-thème à un seul dossier — normal et accepté).

**Branche Audiovisuel & médias** (moins abouti, à retester) : indépendance/gouvernance de l'audiovisuel public ; propriété intellectuelle face à l'IA.

**Branche Culture & patrimoine** (moins abouti, à retester) : financement/transmission du patrimoine (restitution de biens culturels, restes humains kali'nas) ; protection des personnes dans le monde culturel (violences morales/sexistes/sexuelles).

## Modèle de calcul des positions de vote

### Niveau scrutin individuel
- **Badge à 3 zones** : Pour / Divisé / Contre, par groupe parlementaire.
- **Seuil** : "Divisé" si le camp minoritaire (Pour vs Contre) dépasse 33% des votants exprimés.
- **Base de calcul** : votants exprimés uniquement (pour + contre + abstention) — **les absences ne sont pas traitées pour l'instant** (ni intégrées au badge, ni affichées séparément — reporté à une itération ultérieure).
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
- Tester la règle "sens politique = niveau sous-thème uniquement" sur un autre thème racine (ex. "Répartition des richesses") pour valider qu'elle généralise bien
- Affiner les branches Audiovisuel & médias et Culture & patrimoine (moins abouties que École)
- Reprendre l'architecture technique (Next.js, Prisma, structure du repo — mono-projet avec dossiers `src/domain` / `src/application` / `src/infrastructure`, discipline imposée par lint type dependency-cruiser plutôt que monorepo, décision provisoire prise en tout début d'échange avant le pivot vers le fonctionnel)
- Absentéisme des députés : non traité pour l'instant, à réintégrer plus tard comme indicateur séparé (pas fusionné dans le badge Pour/Divisé/Contre)
