# Automatisation quotidienne (#126) — récap des tentatives

Contexte perdu facilement d'une session à l'autre (pas une décision d'architecture au sens d'un ADR, juste un blocage opérationnel constaté) — noté ici pour ne pas avoir à le redécouvrir.

## Objectif au moment de la tentative

Une fois le ticket #126 spécifié par grillage (récupération + curation quotidienne autonome, merge auto par défaut, PR de secours en cas de doute — cf. le corps du ticket), la demande était de commencer l'implémentation directement, sans étape de validation supplémentaire, pour une première exécution le lendemain vers 4h du matin.

## Tentative — Vérifier que le premier maillon (le téléchargement) peut fonctionner

Avant d'écrire la moindre ligne de code, vérification de l'accès réseau sortant de cet environnement vers les domaines de l'Assemblée nationale :

```
curl https://data.assemblee-nationale.fr/   → CONNECT tunnel failed, 403
curl https://www.assemblee-nationale.fr/    → CONNECT tunnel failed, 403
```

Les deux domaines sont bloqués par la politique réseau sortant de l'environnement — même comportement que celui déjà observé plus tôt dans la session sur `scrutin-theta.vercel.app` (le site en prod lui-même, également bloqué depuis cet environnement).

## Constat

La Routine planifiée prévue par #126 démarre une session **dans ce même environnement**, qui hérite donc de la même politique réseau. Sans accès à `data.assemblee-nationale.fr`, le pipeline ne peut pas télécharger les données — peu importe la qualité du code écrit autour. Implémenter quand même aurait juste programmé un échec garanti pour l'exécution du lendemain.

## Décision prise sur le moment

Ne pas commencer l'implémentation tant que l'accès réseau n'est pas résolu, plutôt que de livrer du code qui échouera à coup sûr. Deux options posées à l'utilisateur :

1. Élargir la politique réseau de cet environnement pour autoriser `data.assemblee-nationale.fr` (et probablement `www.assemblee-nationale.fr`).
2. Faire tourner la Routine dans un autre environnement avec un accès réseau plus permissif.

Les deux sont des réglages de **configuration d'environnement**, pas quelque chose qu'une session peut changer elle-même.

## Guidance donnée pour élargir la politique réseau (depuis l'app mobile)

Sans accès visuel à l'app pour vérifier les libellés exacts des menus, la guidance donnée est restée générale plutôt que de risquer d'inventer des noms d'écrans :

- La politique réseau est un réglage de l'**environnement**, pas de la session ni de la conversation — donc à chercher dans la gestion des environnements Claude Code de l'app, pas dans les paramètres de la conversation elle-même.
- Chercher un réglage type "Accès réseau" / "Network access" sur l'environnement utilisé par cette session, avec généralement plusieurs niveaux (aucun accès, domaines de confiance/allowlist, accès complet) — ajouter `data.assemblee-nationale.fr` à l'allowlist si ce mode existe.
- Un changement de politique s'applique probablement à partir de la **prochaine** session/exécution de l'environnement, pas à une session déjà démarrée.
- Référence fiable pointée plutôt que des noms de menus non vérifiés : https://code.claude.com/docs/en/claude-code-on-the-web

## État au moment de la rédaction de cette note

Toujours bloqué — en attente que l'accès réseau soit élargi (ou qu'un autre environnement soit choisi) côté configuration, avant de pouvoir reprendre l'implémentation du pipeline lui-même.

## Prochaines étapes une fois débloqué

1. Vérifier concrètement l'accès (`curl https://data.assemblee-nationale.fr/`) depuis une session tournant avec la politique mise à jour, avant de coder quoi que ce soit.
2. Construire le script de téléchargement des jeux de données bruts (aujourd'hui inexistant — le téléchargement initial de `data/raw/an/17/*.zip` a été fait à la main, cf. `data/raw/an/17/README.md`).
3. Implémenter la détection du nouveau, la curation, la logique merge auto / PR de secours, et les 4 déclencheurs de doute — tous déjà spécifiés dans le corps du ticket #126.
4. Mettre en place la Routine planifiée (`create_trigger`, `create_new_session_on_fire: true`) une fois le pipeline testé manuellement au moins une fois.
