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
git clone https://github.com/steeven-th/dbkeep.git
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

📚 **[Full documentation on dbkeep.com/docs](https://dbkeep.com/docs)**

- [Getting Started](https://dbkeep.com/docs/getting-started/introduction) - Introduction and quick start
- [Configuration](https://dbkeep.com/docs/self-hosting/configuration) - Environment variables
- [Docker Deployment](https://dbkeep.com/docs/self-hosting/docker) - Deploy with Docker
- [Email Configuration](https://dbkeep.com/docs/self-hosting/email) - SMTP setup for password reset

## Main Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync database schema |
| `pnpm db:studio` | Drizzle Studio interface |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint code |

## Deployment Modes

DBKeep supports different deployment modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Multi-user** | Authentication + open registration | Multi-user production |
| **Private** | Authentication, registration disabled | Private team |
| **Guest Mode** | No authentication required | Personal self-hosting |

See [Configuration](https://dbkeep.com/docs/self-hosting/configuration) for details.

## Contributing

Contributions are welcome! Please read the contribution guidelines before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) - Free to use, modify and distribute.

---

Made with ❤️ by the open-source community
