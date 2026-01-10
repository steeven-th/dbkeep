# DBKeep

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4.x-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**DBKeep** est un outil open-source gratuit pour concevoir et modéliser vos schémas de base de données avec une interface visuelle intuitive. Alternative à DrawDB et dbdiagram.io.

## Fonctionnalités

- **Éditeur visuel** : Créez des tables, colonnes et relations avec une interface drag-and-drop
- **Export SQL** : Exportez vos schémas pour PostgreSQL, MySQL ou SQLite
- **Groupes de tables** : Organisez vos tables en groupes visuels
- **Multi-langues** : Interface disponible en français et anglais
- **Authentification** : Système de comptes utilisateurs
- **Open Source** : Gratuit pour toujours

## Stack Technique

- [Nuxt 4](https://nuxt.com) + [Nuxt UI v4](https://ui.nuxt.com)
- [Vue Flow](https://vueflow.dev) pour le canvas de diagrammes
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Better Auth](https://www.better-auth.com) pour l'authentification
- [@nuxtjs/i18n](https://i18n.nuxtjs.org) pour l'internationalisation

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone https://github.com/votre-username/dbkeep.git
cd dbkeep
pnpm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# 3. Créer la base de données
createdb dbkeep
pnpm db:push

# 4. Lancer
pnpm dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000)

## Documentation

📚 **[Documentation complète](./docs/README.md)**

- [Installation](./docs/installation.md) - Guide d'installation détaillé
- [Configuration](./docs/configuration.md) - Variables d'environnement
- [Base de données](./docs/database.md) - Drizzle ORM et Drizzle Studio
- [Authentification](./docs/authentication.md) - Better Auth
- [Structure du projet](./docs/structure.md) - Organisation des fichiers
- [Commandes](./docs/commands.md) - Toutes les commandes disponibles
- [Contribution](./docs/contributing.md) - Guide de contribution

## Commandes principales

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm db:push` | Synchroniser le schéma BDD |
| `pnpm db:studio` | Interface Drizzle Studio |
| `pnpm test` | Lancer les tests |
| `pnpm lint` | Vérifier le code |

## Drizzle Studio

Visualisez et manipulez votre base de données avec Drizzle Studio (équivalent de Prisma Studio) :

```bash
pnpm db:studio
```

Ouvre [https://local.drizzle.studio](https://local.drizzle.studio)

## Contribution

Les contributions sont les bienvenues ! Consultez le [guide de contribution](./docs/contributing.md).

## License

[MIT](LICENSE) - Libre d'utilisation, modification et distribution.

---

Fait avec ❤️ par la communauté open-source
