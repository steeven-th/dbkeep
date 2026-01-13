# Installation

Complete installation guide for DBKeep.

## Prerequisites

Before starting, make sure you have installed:

| Tool | Minimum Version | Check |
|------|-----------------|-------|
| Node.js | >= 18.x | `node --version` |
| pnpm | >= 10.x | `pnpm --version` |
| PostgreSQL | >= 14.x | `psql --version` |

### Install pnpm (if needed)

```bash
# Via npm
npm install -g pnpm

# Via Homebrew (macOS)
brew install pnpm

# Via Corepack (recommended)
corepack enable
corepack prepare pnpm@latest --activate
```

### Install PostgreSQL (if needed)

```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

## Project Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dbkeep.git
cd dbkeep
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create the database

```bash
# Create the database
createdb dbkeep

# Verify the database exists
psql -l | grep dbkeep
```

### 4. Configure the environment

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` - see [Configuration](./configuration.md) for details.

### 5. Initialize the database

```bash
# Create tables
pnpm db:push
```

### 6. Launch the application

```bash
pnpm dev
```

The application is now accessible at [http://localhost:3000](http://localhost:3000)

## Verify Installation

1. Open [http://localhost:3000](http://localhost:3000) - Landing page
2. Click "Sign up" - Account creation page
3. Create a test account
4. You should be redirected to `/app`

## Guest Mode (optional)

For personal use without account management, enable guest mode:

```bash
# In .env
NUXT_PUBLIC_GUEST_MODE=true
```

In guest mode:
- No need to create an account
- Direct access to `/app`
- Projects are saved locally

See [Configuration](./configuration.md) for more details on deployment modes.

## Common Issues

### Error "database does not exist"

```
database "username" does not exist
```

**Solution**: The `DATABASE_URL` variable is not configured correctly. Check your `.env` file.

### Error "Invalid base URL"

```
Invalid base URL: /api/auth
```

**Solution**: The base URL must be absolute. Verify that `BETTER_AUTH_URL` is defined in `.env`.

### PostgreSQL connection error

```
connection refused
```

**Solution**: PostgreSQL is not running.

```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```
