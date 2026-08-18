# Données brutes — Assemblée nationale, 17e législature

Téléchargées depuis l'open data officiel de l'AN (https://data.assemblee-nationale.fr/) le 2026-07-30, rafraîchies le 2026-08-18 (`Scrutins.json.zip`, `Dossiers_Legislatifs.json.zip`, `AMO10_deputes_actifs_mandats_actifs_organes.json.zip`).

URLs directes des archives sources (utiles pour un futur script de téléchargement, cf. `docs/notes/126-automatisation-tentatives.md` — l'accès réseau vers `data.assemblee-nationale.fr` fonctionne à nouveau depuis cet environnement) :
- `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip`

`compteRendu*.zip` (comptes rendus de séance, en lots successifs) et les fichiers `*-classifies.json.zip` (sorties des scripts `scripts/extraire-*.ts`, à rejouer après toute mise à jour des sources brutes correspondantes) ne sont pas couverts par ce rafraîchissement — pas de source zip unique côté AN pour les comptes rendus, et `Amendements.json.zip` (source de `Amendements-scrutins-classifies.json.zip`) pèse ~300 Mo brut.

## Contenu

| Fichier | Source | Format | Contenu |
|---|---|---|---|
| `Scrutins.json.zip` | `/travaux-parlementaires/votes` | JSON, 1 fichier par scrutin | **8 434 scrutins** (17e législature à date, inchangé au 2026-08-18). Chaque scrutin : métadonnées (date, type, sort), synthèse (votants/suffrages exprimés/décompte), et `ventilationVotes` — position par groupe (`organeRef`) avec décompte nominatif partiel des député·es par groupe. |
| `Dossiers_Legislatifs.json.zip` | `/travaux-parlementaires/dossiers-legislatifs` | JSON, 1 fichier par dossier (+ documents liés) | **10 100 fichiers** (dossiers + documents liés) au 2026-08-18, contre 10 069 au 2026-07-30. Titre, procédure, arbre des actes législatifs (dépôt, commission saisie au fond via `organeRef`, lectures...). Inclut des dossiers **encore en commission, sans scrutin**. |
| `AMO10_deputes_actifs_mandats_actifs_organes.json.zip` | `/acteurs/deputes-en-exercice` | JSON | 577 acteurs (député·es), mandats, et organes (7 737 au 2026-08-18, contre 7 740 au 2026-07-30 — dont toujours seulement 12 de `codeType: "GP"` = les 11 vrais groupes parlementaires + "Non inscrit", les autres étant commissions, délégations, groupes d'études, etc.) |

## Constats utiles pour la suite

- **Pas de CSV pour scrutins/dossiers** — seul le jeu "députés" a un export CSV plat (`AMO50_acteurs_mandats_organes_divises.csv.zip` ou `liste_deputes_*.csv`, non téléchargés ici). Scrutins et dossiers ne sont disponibles qu'en un fichier JSON/XML par entité (donc ~8 400 + ~3 000 petits fichiers une fois dézippés).
- **Non-inscrits partage le même `codeType` ("GP") que les vrais groupes** dans la donnée source (`uid: PO840056`, `libelleAbrege: "NI"`) — la distinction Groupe parlementaire / Non-inscrits du domaine (cf. `CONTEXT.md`) est une décision de modélisation posée par-dessus, pas quelque chose que la source distingue structurellement.
- **Le lien scrutin → dossier législatif** passe par `scrutin.objet.dossierLegislatif` (référence `DLR5L17N...`) — `null` pour les scrutins non rattachés à un dossier (motions de censure, etc.).
- **Échelle réelle bien supérieure au périmètre classifié à la main pendant le design fonctionnel** : le document `projet-votes-assemblee-nationale.md` classe une poignée de dossiers d'exemple (cas d'étude par branche/sous-thème) — la vraie volumétrie est de ~3 000 dossiers et ~8 400 scrutins. La question "la passe de curation déjà faite suffit-elle pour un v1 statique ?" est donc à revisiter avec ce chiffre en tête, pas juste supposée acquise.

## Groupes parlementaires identifiés (`codeType: "GP"`)

RN, EPR (ex-Renaissance), LFI-NFP, SOC, DR, EcoS, Dem, HOR, LIOT, GDR, UDR, + Non inscrit (NI). 11 groupes + NI = 12, cohérent avec `CONTEXT.md`.
