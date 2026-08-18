# Données brutes — Assemblée nationale, 17e législature

Téléchargées depuis l'open data officiel de l'AN (https://data.assemblee-nationale.fr/) le 2026-07-30, rafraîchies le 2026-08-18 (`Scrutins.json.zip`, `Dossiers_Legislatifs.json.zip`, `AMO10_deputes_actifs_mandats_actifs_organes.json.zip`, `compteRendu.zip`).

URLs directes des archives sources (utiles pour un futur script de téléchargement, cf. `docs/notes/126-automatisation-tentatives.md` — l'accès réseau vers `data.assemblee-nationale.fr` fonctionne à nouveau depuis cet environnement) :
- `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/vp/syceronbrut/syseron.xml.zip` — archive officielle unique couvrant **tous** les comptes rendus de séance (601 fichiers XML, 17e législature à date) ; remplace `compteRendu1.zip`…`compteRendu4.zip` (lots manuels précédents, désormais un sous-ensemble strict de celle-ci) par un unique `compteRendu.zip`. Toujours reconnue par `compteRenduRepository.ts` (motif `/^compteRendu.*\.zip$/`, insensible au chemin interne des entrées).
- `https://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip` — ~300 Mo, **volontairement non commitée** (cf. en-tête de `scripts/extraire-amendements.ts`) : seule `Amendements-scrutins-classifies.json.zip` (le filtré, ~11 Mo) est lue par l'app à l'exécution.

**⚠️ Piège vérifié le 2026-08-18 : ne jamais rejouer `scripts/extraire-explications-vote.ts` / `extraire-discussion-generale.ts` en pensant simplement "absorber les nouveaux comptes rendus".** Ces scripts ne détectent que les correspondances mécaniques (titre/date) ; une bonne partie du contenu commité dans `ExplicationsVote-dossiers-classifies.json.zip` et `DiscussionGenerale-dossiers-classifies.json.zip` vient de passes de curation éditoriale manuelle, lot par lot (historique git : "Curation lot N (#95)"), pas seulement de ces scripts. Un rejeu à blanc, même avec des sources `compteRendu*` strictement identiques ou strictement plus complètes, régénère un résultat **plus pauvre** que l'existant (vérifié : 127 dossiers couverts contre 197 commités) et écraserait ce travail de curation s'il était commité tel quel. Si de nouveaux comptes rendus doivent être exploités, les rejouer dans un fichier à part et ne merger que les entrées réellement nouvelles après revue, jamais écraser l'archive committée en bloc.

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
