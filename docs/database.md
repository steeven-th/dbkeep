# Database

DBKeep uses **PostgreSQL** with **Drizzle ORM** for data management.

## Stack

| Technology | Usage |
|------------|-------|
| [PostgreSQL](https://www.postgresql.org) | Relational database |
| [Drizzle ORM](https://orm.drizzle.team) | Type-safe TypeScript ORM |
| [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) | CLI for migrations |
| [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) | Visualization interface |

## Schema

The database schema is defined in `server/database/schema.ts`.

### Main Tables

#### User (Users)

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

#### Account (OAuth Accounts)

```typescript
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  // ... other OAuth fields
})
```

#### Project (Schema Projects)

```typescript
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  engine: text('engine').notNull().default('postgresql'),
  data: jsonb('data'),  // Schema storage (tables, relations, etc.)
  userId: text('user_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
```

## Drizzle Commands

### db:push

Synchronizes the TypeScript schema with the database. **Recommended for development**.

```bash
pnpm db:push
```

> **Note**: This command may delete data if you remove columns.

### db:generate

Generates SQL migration files based on schema changes.

```bash
pnpm db:generate
```

Migrations are created in `drizzle/` (or the configured folder).

### db:migrate

Applies pending migrations.

```bash
pnpm db:migrate
```

### db:studio

Launches Drizzle Studio, a web interface to visualize and manipulate the database.

```bash
pnpm db:studio
```

## Drizzle Studio

Drizzle Studio is the equivalent of **Prisma Studio** for Drizzle ORM.

### Launch

```bash
pnpm db:studio
```

Automatically opens [https://local.drizzle.studio](https://local.drizzle.studio)

### Features

- **Table visualization**: View the structure of all tables
- **Data navigation**: Browse records with pagination
- **Inline editing**: Modify data directly
- **Add/Delete**: Create or delete records
- **Filters**: Filter data by column
- **Raw SQL**: Execute custom SQL queries

### Screenshot

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

## Database Connection

The connection is configured in `server/database/drizzle.ts`:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool)
```

## Best Practices

### Development

1. Use `db:push` to iterate quickly on the schema
2. Use Drizzle Studio to verify data
3. Don't commit sensitive data

### Production

1. Always use migrations (`db:generate` + `db:migrate`)
2. Test migrations on a staging environment
3. Backup before migrations
4. Use SSL connections (`?sslmode=require`)
