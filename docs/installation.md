# Installation

Guide d'installation complet de DBKeep.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | >= 18.x | `node --version` |
| pnpm | >= 10.x | `pnpm --version` |
| PostgreSQL | >= 14.x | `psql --version` |

### Installer pnpm (si nécessaire)

```bash
# Via npm
npm install -g pnpm

# Via Homebrew (macOS)
brew install pnpm

# Via Corepack (recommandé)
corepack enable
corepack prepare pnpm@latest --activate
```

### Installer PostgreSQL (si nécessaire)

```bash
# macOS avec Homebrew
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Télécharger depuis https://www.postgresql.org/download/windows/
```

## Installation du projet

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/dbkeep.git
cd dbkeep
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Créer la base de données

```bash
# Créer la base de données
createdb dbkeep

# Vérifier que la base existe
psql -l | grep dbkeep
```

### 4. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env
```

Éditer `.env` - voir [Configuration](./configuration.md) pour les détails.

### 5. Initialiser la base de données

```bash
# Créer les tables
pnpm db:push
```

### 6. Lancer l'application

```bash
pnpm dev
```

L'application est maintenant accessible sur [http://localhost:3000](http://localhost:3000)

## Vérification de l'installation

1. Ouvrir [http://localhost:3000](http://localhost:3000) - Landing page
2. Cliquer sur "S'inscrire" - Page de création de compte
3. Créer un compte test
4. Vous devriez être redirigé vers `/app`

## Mode Invité (optionnel)

Pour un usage personnel sans gestion de compte, activez le mode invité :

```bash
# Dans .env
NUXT_PUBLIC_GUEST_MODE=true
```

En mode invité :
- Pas besoin de créer un compte
- Accès direct à `/app`
- Les projets sont sauvegardés localement

Voir [Configuration](./configuration.md) pour plus de détails sur les modes de déploiement.

## Problèmes courants

### Erreur "database does not exist"

```
database "username" does not exist
```

**Solution** : La variable `DATABASE_URL` n'est pas configurée correctement. Vérifiez votre fichier `.env`.

### Erreur "Invalid base URL"

```
Invalid base URL: /api/auth
```

**Solution** : L'URL de base doit être absolue. Vérifiez que `BETTER_AUTH_URL` est définie dans `.env`.

### Erreur de connexion PostgreSQL

```
connection refused
```

**Solution** : PostgreSQL n'est pas démarré.

```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```
