# Commands

All available commands for developing and maintaining DBKeep.

## Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build |

### pnpm dev

Starts the Nuxt server in development mode with hot-reload.

```bash
pnpm dev

# Output
Nuxt 4.x.x with Nitro 2.x.x
Local:    http://localhost:3000/
Network:  http://192.168.x.x:3000/
```

Useful options:
```bash
# Custom port
pnpm dev -- --port 3001

# Open in browser
pnpm dev -- --open
```

### pnpm build

Compiles the application for production.

```bash
pnpm build
```

The build is generated in `.output/`.

### pnpm preview

Previews the production build locally.

```bash
pnpm build && pnpm preview
```

## Database

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Sync schema with database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |

### pnpm db:push

Synchronizes the TypeScript schema with the database. **Ideal for development**.

```bash
pnpm db:push

# Output
[✓] Changes applied
```

> **Warning**: This command may delete data if you remove columns or tables.

### pnpm db:generate

Generates SQL migration files based on changes.

```bash
pnpm db:generate

# Output
[✓] Your SQL migration file ➜ drizzle/0001_migration.sql
```

### pnpm db:migrate

Applies pending migrations to the database.

```bash
pnpm db:migrate
```

### pnpm db:studio

Launches Drizzle Studio to visualize and manipulate the database.

```bash
pnpm db:studio

# Output
Drizzle Studio is running on https://local.drizzle.studio
```

## Code Quality

| Command | Description |
|---------|-------------|
| `pnpm lint` | Check code with ESLint |
| `pnpm typecheck` | TypeScript type checking |

### pnpm lint

Analyzes code for style issues and potential errors.

```bash
pnpm lint

# Auto-fix
pnpm lint --fix
```

### pnpm typecheck

Verifies TypeScript types throughout the project.

```bash
pnpm typecheck
```

## Tests

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:nuxt` | Nuxt tests only |
| `pnpm test:e2e` | E2E Playwright tests |
| `pnpm test:e2e:ui` | E2E tests with UI |

### pnpm test

Runs all tests (unit and Nuxt).

```bash
pnpm test

# With code coverage
pnpm test -- --coverage
```

### pnpm test:watch

Runs tests in watch mode (automatic re-run).

```bash
pnpm test:watch
```

### pnpm test:e2e

Runs end-to-end tests with Playwright.

```bash
pnpm test:e2e

# Single file
pnpm test:e2e tests/auth.spec.ts
```

### pnpm test:e2e:ui

Launches Playwright with its graphical interface.

```bash
pnpm test:e2e:ui
```

## Installation

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm postinstall` | Prepare Nuxt (auto) |

### pnpm install

Installs all project dependencies.

```bash
pnpm install

# Ignore devDependencies (production)
pnpm install --prod
```

## Quick Reference

```bash
# Initial setup
pnpm install
cp .env.example .env
# Edit .env
pnpm db:push
pnpm dev

# Daily workflow
pnpm dev           # Develop
pnpm lint          # Check code
pnpm test          # Test
pnpm db:studio     # View database

# Before commit
pnpm lint --fix
pnpm typecheck
pnpm test

# Deployment
pnpm build
pnpm preview       # Verify locally
```
