# Commandes

Toutes les commandes disponibles pour développer et maintenir DBKeep.

## Développement

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Lancer le serveur de développement |
| `pnpm build` | Build de production |
| `pnpm preview` | Prévisualiser le build de production |

### pnpm dev

Lance le serveur Nuxt en mode développement avec hot-reload.

```bash
pnpm dev

# Sortie
Nuxt 4.x.x with Nitro 2.x.x
Local:    http://localhost:3000/
Network:  http://192.168.x.x:3000/
```

Options utiles :
```bash
# Port personnalisé
pnpm dev -- --port 3001

# Ouvrir dans le navigateur
pnpm dev -- --open
```

### pnpm build

Compile l'application pour la production.

```bash
pnpm build
```

Le build est généré dans `.output/`.

### pnpm preview

Prévisualise le build de production localement.

```bash
pnpm build && pnpm preview
```

## Base de données

| Commande | Description |
|----------|-------------|
| `pnpm db:push` | Synchroniser le schéma avec la BDD |
| `pnpm db:generate` | Générer les fichiers de migration |
| `pnpm db:migrate` | Appliquer les migrations |
| `pnpm db:studio` | Ouvrir Drizzle Studio |

### pnpm db:push

Synchronise le schéma TypeScript avec la base de données. **Idéal pour le développement**.

```bash
pnpm db:push

# Sortie
[✓] Changes applied
```

> **Attention** : Cette commande peut supprimer des données si vous supprimez des colonnes ou tables.

### pnpm db:generate

Génère des fichiers de migration SQL basés sur les changements.

```bash
pnpm db:generate

# Sortie
[✓] Your SQL migration file ➜ drizzle/0001_migration.sql
```

### pnpm db:migrate

Applique les migrations en attente sur la base de données.

```bash
pnpm db:migrate
```

### pnpm db:studio

Lance Drizzle Studio pour visualiser et manipuler la base de données.

```bash
pnpm db:studio

# Sortie
Drizzle Studio is running on https://local.drizzle.studio
```

## Qualité du code

| Commande | Description |
|----------|-------------|
| `pnpm lint` | Vérifier le code avec ESLint |
| `pnpm typecheck` | Vérification des types TypeScript |

### pnpm lint

Analyse le code pour trouver des problèmes de style et des erreurs potentielles.

```bash
pnpm lint

# Corriger automatiquement
pnpm lint --fix
```

### pnpm typecheck

Vérifie les types TypeScript dans tout le projet.

```bash
pnpm typecheck
```

## Tests

| Commande | Description |
|----------|-------------|
| `pnpm test` | Lancer tous les tests |
| `pnpm test:watch` | Tests en mode watch |
| `pnpm test:unit` | Tests unitaires uniquement |
| `pnpm test:nuxt` | Tests Nuxt uniquement |
| `pnpm test:e2e` | Tests E2E Playwright |
| `pnpm test:e2e:ui` | Tests E2E avec interface |

### pnpm test

Lance tous les tests (unitaires et Nuxt).

```bash
pnpm test

# Avec couverture de code
pnpm test -- --coverage
```

### pnpm test:watch

Lance les tests en mode watch (relance automatique).

```bash
pnpm test:watch
```

### pnpm test:e2e

Lance les tests end-to-end avec Playwright.

```bash
pnpm test:e2e

# Un seul fichier
pnpm test:e2e tests/auth.spec.ts
```

### pnpm test:e2e:ui

Lance Playwright avec son interface graphique.

```bash
pnpm test:e2e:ui
```

## Installation

| Commande | Description |
|----------|-------------|
| `pnpm install` | Installer les dépendances |
| `pnpm postinstall` | Préparer Nuxt (auto) |

### pnpm install

Installe toutes les dépendances du projet.

```bash
pnpm install

# Ignorer les devDependencies (production)
pnpm install --prod
```

## Résumé rapide

```bash
# Setup initial
pnpm install
cp .env.example .env
# Éditer .env
pnpm db:push
pnpm dev

# Workflow quotidien
pnpm dev           # Développer
pnpm lint          # Vérifier le code
pnpm test          # Tester
pnpm db:studio     # Voir la BDD

# Avant commit
pnpm lint --fix
pnpm typecheck
pnpm test

# Déploiement
pnpm build
pnpm preview       # Vérifier localement
```
