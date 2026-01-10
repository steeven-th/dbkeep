# Documentation DBKeep

Bienvenue dans la documentation de DBKeep, un outil open-source pour concevoir des bases de données visuellement.

## Modes de déploiement

DBKeep supporte différents modes de déploiement :

| Mode | Description | Utilisation |
|------|-------------|-------------|
| **SaaS Public** | Authentification + inscription ouverte | Production multi-utilisateurs |
| **SaaS Privé** | Authentification, inscription fermée | Équipe privée |
| **Mode Invité** | Sans authentification | Auto-hébergement personnel |

Voir [Configuration](./configuration.md) pour les détails.

## Sommaire

### Guides de démarrage
- [Installation](./installation.md) - Guide d'installation complet
- [Configuration](./configuration.md) - Variables d'environnement et modes

### Base de données
- [Drizzle ORM](./database.md) - Schéma, migrations et Drizzle Studio

### Authentification
- [Better Auth](./authentication.md) - Système d'authentification et mode invité

### Développement
- [Structure du projet](./structure.md) - Organisation des fichiers et architecture
- [Commandes](./commands.md) - Toutes les commandes disponibles

### Contribution
- [Guide de contribution](./contributing.md) - Comment contribuer au projet

## Quick Start

```bash
# Cloner le repo
git clone https://github.com/votre-username/dbkeep.git
cd dbkeep

# Installer les dépendances
pnpm install

# Configurer
cp .env.example .env
# Éditer .env avec vos valeurs

# Créer les tables
pnpm db:push

# Lancer
pnpm dev
```

## Mode Invité (usage personnel)

Pour utiliser DBKeep sans gestion de compte :

```env
NUXT_PUBLIC_GUEST_MODE=true
```

Voir [Installation](./installation.md) pour plus de détails.
