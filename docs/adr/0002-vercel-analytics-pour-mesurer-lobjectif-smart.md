# Vercel Analytics pour mesurer l'objectif SMART

`projet-votes-assemblee-nationale.md` fixe un objectif chiffré (section "Objectif SMART") : au moins 50% des visiteurs uniques doivent descendre jusqu'au niveau **dossier législatif** au moins une fois, mesuré en continu sur une fenêtre glissante de 3 mois. C'est l'impact n°1 de l'Impact Map du même document ; l'impact n°7 (*"Instrumenter le suivi de profondeur de navigation dès le lancement"*) avait été reporté à la phase technique et n'était, jusqu'ici, pas implémenté.

**Décision** : utiliser **Vercel Analytics** (`@vercel/analytics`) plutôt qu'une solution self-hostée (Umami) ou un SaaS tiers (Plausible).

- Cohérent avec Vercel comme cible de déploiement déjà actée pour le projet.
- Sans cookies, pas de profilage nominatif (livrable attendu par l'Impact Map).
- Ne nécessite ni base de données ni service à héberger — compatible avec l'ADR-0001 (site statique sans base de données pour le v1).

## Mécanisme de mesure

- Le composant `<Analytics />` (`@vercel/analytics/next`), monté dans `src/app/layout.tsx`, envoie automatiquement une pageview par visite et calcule les visiteurs uniques du site.
- Un événement custom `dossier_view` est déclenché côté client (`DossierViewTracker`, `src/app/_components/DossierViewTracker.tsx`) au montage de la page `/dossier/[dossierRef]`.
- **Pourquoi côté client et pas côté serveur** : cette page est générée statiquement (`generateStaticParams`) ; un `track()` appelé depuis le Server Component se déclencherait au build, pas à chaque visite réelle. Le suivi doit donc se faire dans un Client Component monté au chargement de la page par un vrai visiteur.
- Le ratio "% de visiteurs uniques ayant atteint un dossier" **n'est pas calculé par le site** : il se lit en croisant, dans le dashboard (ou l'API) Vercel Analytics, le nombre de visiteurs uniques ayant déclenché `dossier_view` sur la fenêtre de 3 mois avec le nombre total de visiteurs uniques sur la même fenêtre.

## Conséquences

- Aucune donnée personnelle stockée dans le repo ni sur une infra propre au projet — tout vit côté Vercel.
- Le calcul du ratio reste une lecture manuelle du dashboard pour l'instant (pas de tableau de bord dédié sur le site) — cf. #47.
- Si le projet quitte Vercel un jour, cette instrumentation devra être reprise (dépendance au service).
