# Base de données

DBKeep utilise **PostgreSQL** avec **Drizzle ORM** pour la gestion des données.

## Stack

| Technologie | Usage |
|-------------|-------|
| [PostgreSQL](https://www.postgresql.org) | Base de données relationnelle |
| [Drizzle ORM](https://orm.drizzle.team) | ORM TypeScript type-safe |
| [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) | CLI pour migrations |
| [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) | Interface de visualisation |

## Schéma

Le schéma de la base de données est défini dans `server/database/schema.ts`.

### Tables principales

#### User (Utilisateurs)

```typescript
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
```

#### Session (Sessions)

```typescript
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id)
})
```

#### Account (Comptes OAuth)

```typescript
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  // ... autres champs OAuth
})
```

#### Project (Projets de schéma)

```typescript
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  engine: text('engine').notNull().default('postgresql'),
  data: jsonb('data'),  // Stockage du schéma (tables, relations, etc.)
  userId: text('user_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
```

## Commandes Drizzle

### db:push

Synchronise le schéma TypeScript avec la base de données. **Recommandé pour le développement**.

```bash
pnpm db:push
```

> **Note** : Cette commande peut supprimer des données si vous supprimez des colonnes.

### db:generate

Génère des fichiers de migration SQL basés sur les changements du schéma.

```bash
pnpm db:generate
```

Les migrations sont créées dans `drizzle/` (ou le dossier configuré).

### db:migrate

Applique les migrations en attente.

```bash
pnpm db:migrate
```

### db:studio

Lance Drizzle Studio, une interface web pour visualiser et manipuler la base de données.

```bash
pnpm db:studio
```

## Drizzle Studio

Drizzle Studio est l'équivalent de **Prisma Studio** pour Drizzle ORM.

### Lancement

```bash
pnpm db:studio
```

Ouvre automatiquement [https://local.drizzle.studio](https://local.drizzle.studio)

### Fonctionnalités

- **Visualisation des tables** : Voir la structure de toutes les tables
- **Navigation des données** : Parcourir les enregistrements avec pagination
- **Édition inline** : Modifier les données directement
- **Ajout/Suppression** : Créer ou supprimer des enregistrements
- **Filtres** : Filtrer les données par colonne
- **SQL brut** : Exécuter des requêtes SQL personnalisées

### Capture d'écran

```
┌─────────────────────────────────────────────────────────┐
│  Drizzle Studio                                         │
├─────────────────────────────────────────────────────────┤
│  Tables:                                                │
│  ├── user (5 rows)                                      │
│  ├── session (12 rows)                                  │
│  ├── account (3 rows)                                   │
│  ├── verification (0 rows)                              │
│  └── project (8 rows)                                   │
├─────────────────────────────────────────────────────────┤
│  user                                    [+ Add Row]    │
│  ┌────────┬──────────────┬─────────────────────────┐   │
│  │ id     │ name         │ email                   │   │
│  ├────────┼──────────────┼─────────────────────────┤   │
│  │ abc123 │ John Doe     │ john@example.com        │   │
│  │ def456 │ Jane Smith   │ jane@example.com        │   │
│  └────────┴──────────────┴─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Connexion à la base

La connexion est configurée dans `server/database/drizzle.ts` :

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool)
```

## Bonnes pratiques

### Développement

1. Utiliser `db:push` pour itérer rapidement sur le schéma
2. Utiliser Drizzle Studio pour vérifier les données
3. Ne pas commiter de données sensibles

### Production

1. Toujours utiliser des migrations (`db:generate` + `db:migrate`)
2. Tester les migrations sur un environnement de staging
3. Faire des backups avant les migrations
4. Utiliser des connexions SSL (`?sslmode=require`)
