# Site statique sans base de données pour le v1

Le stack initial du projet posait PostgreSQL (Neon) + Prisma comme acquis dès le départ. En reprenant l'architecture technique, le téléchargement des vraies données de l'AN a montré que seuls **75 dossiers législatifs** (17e législature) sont réellement reliés à un scrutin — bien loin des ~3 000 dossiers du dataset complet, la plupart encore en commission et déjà hors périmètre par la règle "dossier sans scrutin non affiché". À cette échelle, une base de données n'apporte rien qu'un fichier plat ne fasse aussi bien.

**Décision** : le v1 est un site **entièrement statique**, généré à partir de fichiers versionnés dans le repo (taxonomie déclarée dans `taxonomy.ts`/`.json`, un fichier Markdown+frontmatter par dossier combinant classement thématique et Fiche dossier, données brutes de vote de l'AN sous `data/raw/an/`). Aucune base de données déployée pour le v1 — Postgres/Prisma sont réservés au v2 (ingestion temps réel), pas abandonnés.

## Conséquences

- Le schéma de données du v1 est un ensemble de types TypeScript (contrats de contenu), pas un schéma Prisma.
- Pas d'infrastructure DB à héberger/maintenir tant que le site reste sur ce jeu de données figé.
- La migration vers Postgres/Prisma au v2 nécessitera un adaptateur d'ingestion qui remplace la lecture de fichiers plats — anticipé par le découpage hexagonal (cf. ticket "Architecture hexagonale").
