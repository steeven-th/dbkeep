# Contributing to DBKeep

Thank you for your interest in contributing to DBKeep! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/dbkeep.git`
3. Install dependencies: `pnpm install`
4. Copy environment file: `cp .env.example .env`
5. Configure your PostgreSQL database in `.env`
6. Run migrations: `pnpm db:push`
7. Start development server: `pnpm dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Run linter: `pnpm lint`
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests

## Code Style

- Use TypeScript
- Follow ESLint rules (`pnpm lint`)
- Use Prettier for formatting

## Questions?

Feel free to open a [Discussion](https://github.com/steeven-th/dbkeep/discussions) if you have questions!
