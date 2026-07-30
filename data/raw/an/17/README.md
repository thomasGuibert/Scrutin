# Données brutes — Assemblée nationale, 17e législature

Téléchargées depuis l'open data officiel de l'AN (https://data.assemblee-nationale.fr/) le 2026-07-30.

**Pas encore commitées** — laissées ici en fichiers non trackés le temps que le ticket "Schéma de données" de la carte wayfinder tranche comment ces données brutes doivent vivre dans le repo (snapshot commité, fetch au build, stockage externe...).

## Contenu

| Fichier | Source | Format | Contenu |
|---|---|---|---|
| `Scrutins.json.zip` | `/travaux-parlementaires/votes` | JSON, 1 fichier par scrutin | **8 434 scrutins** (17e législature à date). Chaque scrutin : métadonnées (date, type, sort), synthèse (votants/suffrages exprimés/décompte), et `ventilationVotes` — position par groupe (`organeRef`) avec décompte nominatif partiel des député·es par groupe. |
| `Dossiers_Legislatifs.json.zip` | `/travaux-parlementaires/dossiers-legislatifs` | JSON, 1 fichier par dossier (+ documents liés) | **3 028 dossiers parlementaires** (17e législature). Titre, procédure, arbre des actes législatifs (dépôt, commission saisie au fond via `organeRef`, lectures...). Inclut des dossiers **encore en commission, sans scrutin**. |
| `AMO10_deputes_actifs_mandats_actifs_organes.json.zip` | `/acteurs/deputes-en-exercice` | JSON | 577 acteurs (député·es), mandats, et **7 126 organes** (dont seulement 12 de `codeType: "GP"` = les 11 vrais groupes parlementaires + "Non inscrit" — les 7 114 autres organes sont commissions, délégations, groupes d'études, etc.) |

## Constats utiles pour la suite

- **Pas de CSV pour scrutins/dossiers** — seul le jeu "députés" a un export CSV plat (`AMO50_acteurs_mandats_organes_divises.csv.zip` ou `liste_deputes_*.csv`, non téléchargés ici). Scrutins et dossiers ne sont disponibles qu'en un fichier JSON/XML par entité (donc ~8 400 + ~3 000 petits fichiers une fois dézippés).
- **Non-inscrits partage le même `codeType` ("GP") que les vrais groupes** dans la donnée source (`uid: PO840056`, `libelleAbrege: "NI"`) — la distinction Groupe parlementaire / Non-inscrits du domaine (cf. `CONTEXT.md`) est une décision de modélisation posée par-dessus, pas quelque chose que la source distingue structurellement.
- **Le lien scrutin → dossier législatif** passe par `scrutin.objet.dossierLegislatif` (référence `DLR5L17N...`) — `null` pour les scrutins non rattachés à un dossier (motions de censure, etc.).
- **Échelle réelle bien supérieure au périmètre classifié à la main pendant le design fonctionnel** : le document `projet-votes-assemblee-nationale.md` classe une poignée de dossiers d'exemple (cas d'étude par branche/sous-thème) — la vraie volumétrie est de ~3 000 dossiers et ~8 400 scrutins. La question "la passe de curation déjà faite suffit-elle pour un v1 statique ?" est donc à revisiter avec ce chiffre en tête, pas juste supposée acquise.

## Groupes parlementaires identifiés (`codeType: "GP"`)

RN, EPR (ex-Renaissance), LFI-NFP, SOC, DR, EcoS, Dem, HOR, LIOT, GDR, UDR, + Non inscrit (NI). 11 groupes + NI = 12, cohérent avec `CONTEXT.md`.
