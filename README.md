# Scrutin — Au-delà du discours

[scrutin-theta.vercel.app](https://scrutin-theta.vercel.app)

Consultez les votes réels de l'Assemblée nationale, classés par thème : comparez ce que les groupes parlementaires ont concrètement voté, dossier par dossier, au-delà de leur communication.

## Objectif

Donner une lecture factuelle et pédagogique des votes des député·es et des groupes parlementaires à l'Assemblée nationale, à partir des données ouvertes qu'elle publie. Les scrutins sont classés par thème plutôt que par groupe ou par personnalité, pour comparer les positions réelles sur un sujet donné plutôt que suivre un camp. Voir la page [`/a-propos`](https://scrutin-theta.vercel.app/a-propos) du site pour le détail du positionnement éditorial.

## Fonctionnalités

- **Navigation thématique** : thème racine → branche → sous-thème → dossier législatif → scrutin, avec la position (Pour / Divisé / Contre) de chaque groupe parlementaire calculée et affichée à chaque niveau.
- **Fiches dossier** (Contexte / Action / Résultat attendu) pour situer chaque texte sans jargon.
- **Explications de vote** : résumés par groupe des explications de vote en séance, rattachés au scrutin décisif concerné.
- **Discussion générale** : mise en contexte de certains votes à partir des interventions en séance, en complément des explications de vote.

## Architecture

Architecture hexagonale (ports & adapters) :

- `src/domain` — logique métier pure (calcul de Position, seuil Divisé, taxonomie), sans dépendance à Next.js ni au système de fichiers.
- `src/api` — fonctions d'entrée appelées par les routes Next.js (`src/app`), orchestrent `domain` sans règle métier propre.
- `src/spi/filesystem` — implémentation des interfaces déclarées par `domain` : lit les fiches dossier (`content/dossiers/*.md`), la taxonomie et les données brutes de l'Assemblée nationale (`data/raw/an/`).

Le vocabulaire du domaine (thème, sous-thème, dossier, scrutin décisif, position, etc.) est documenté dans [`CONTEXT.md`](./CONTEXT.md) ; les décisions d'architecture dans [`docs/adr/`](./docs/adr/).

## Sources des données

Les votes, dossiers législatifs et comptes rendus proviennent des données ouvertes de l'Assemblée nationale ([data.assemblee-nationale.fr](https://data.assemblee-nationale.fr)).

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production
npm test         # tests unitaires (vitest)
npm run lint      # eslint
```

Audits de non-régression sur les données (à lancer après toute mise à jour de `data/raw/an/`) :

```bash
npm run audit:dossiers        # dossiers manquants après resolution des scrutins décisifs
npm run audit:fiches          # cohérence des fiches dossier générées
npm run audit:rattachements   # rattachement scrutin → dossier
```

## Licence

Code : MIT. Données dérivées de sources externes (ODbL) : voir attribution dans chaque jeu de données concerné.
