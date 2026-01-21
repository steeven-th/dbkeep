# DBKeep

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt%20UI-4.x-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**DBKeep** is a free open-source tool for designing and modeling your database schemas with an intuitive visual interface. An alternative to DrawDB and dbdiagram.io.

## Features

- **Visual editor**: Create tables, columns and relations with a drag-and-drop interface
- **SQL export**: Export your schemas for PostgreSQL, MySQL or SQLite
- **Table groups**: Organize your tables into visual groups
- **Multi-language**: Interface available in English and French
- **Authentication**: User account system with optional guest mode
- **Open Source**: Free forever

## Tech Stack

- [Nuxt 4](https://nuxt.com) + [Nuxt UI v4](https://ui.nuxt.com)
- [Vue Flow](https://vueflow.dev) for the diagram canvas
- [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL
- [Better Auth](https://www.better-auth.com) for authentication
- [@nuxtjs/i18n](https://i18n.nuxtjs.org) for internationalization

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-username/dbkeep.git
cd dbkeep
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL settings

# 3. Create the database
createdb dbkeep
pnpm db:push

# 4. Run
pnpm dev
```

The application is available at [http://localhost:3000](http://localhost:3000)

## Documentation

**[Full documentation](./docs/README.md)**

- [Installation](./docs/installation.md) - Detailed installation guide
- [Configuration](./docs/configuration.md) - Environment variables
- [Database](./docs/database.md) - Drizzle ORM and Drizzle Studio
- [Authentication](./docs/authentication.md) - Better Auth
- [Email Configuration](./docs/email-configuration.md) - SMTP setup for password reset
- [Project Structure](./docs/structure.md) - File organization
- [Commands](./docs/commands.md) - All available commands
- [Contributing](./docs/contributing.md) - Contribution guide

## Main Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync database schema |
| `pnpm db:studio` | Drizzle Studio interface |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint code |

## Drizzle Studio

Visualize and manage your database with Drizzle Studio (similar to Prisma Studio):

```bash
pnpm db:studio
```

Opens [https://local.drizzle.studio](https://local.drizzle.studio)

## Deployment Modes

DBKeep supports different deployment modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Multi-user** | Authentication + open registration | Multi-user production |
| **Private** | Authentication, registration disabled | Private team |
| **Guest Mode** | No authentication required | Personal self-hosting |

See [Configuration](./docs/configuration.md) for details.

## Contributing

Contributions are welcome! Check the [contributing guide](./docs/contributing.md).

## License

[MIT](LICENSE) - Free to use, modify and distribute.

---

Made with love by the open-source community
