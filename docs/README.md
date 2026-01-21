# DBKeep Documentation

Welcome to the DBKeep documentation, an open-source tool for designing databases visually.

## Deployment Modes

DBKeep supports different deployment modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Multi-user** | Authentication + open registration | Multi-user production |
| **Private** | Authentication, registration disabled | Private team |
| **Guest Mode** | No authentication | Personal self-hosting |

See [Configuration](./configuration.md) for details.

## Table of Contents

### Getting Started
- [Installation](./installation.md) - Complete installation guide
- [Configuration](./configuration.md) - Environment variables and modes

### Database
- [Drizzle ORM](./database.md) - Schema, migrations and Drizzle Studio

### Authentication
- [Better Auth](./authentication.md) - Authentication system and guest mode
- [Email Configuration](./email-configuration.md) - SMTP setup for password reset and email verification

### Development
- [Project Structure](./structure.md) - File organization and architecture
- [Commands](./commands.md) - All available commands

### Contributing
- [Contributing Guide](./contributing.md) - How to contribute to the project

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/dbkeep.git
cd dbkeep

# Install dependencies
pnpm install

# Configure
cp .env.example .env
# Edit .env with your values

# Create tables
pnpm db:push

# Run
pnpm dev
```

## Guest Mode (personal use)

To use DBKeep without account management:

```env
NUXT_PUBLIC_GUEST_MODE=true
```

See [Installation](./installation.md) for more details.
