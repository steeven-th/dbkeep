# Configuration

Environment variables configuration guide.

## .env File

DBKeep uses an `.env` file for configuration. An example file `.env.example` is provided.

```bash
cp .env.example .env
```

## Environment Variables

### DATABASE_URL

PostgreSQL connection URL.

**Format**:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Examples**:

```env
# With password
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/dbkeep

# Without password (default macOS local config)
DATABASE_URL=postgresql://username@localhost:5432/dbkeep

# With SSL (production)
DATABASE_URL=postgresql://user:pass@host.com:5432/dbkeep?sslmode=require
```

### BETTER_AUTH_SECRET

Secret key for signing sessions and tokens. **Must be at least 32 characters**.

**Generate a secure key**:

```bash
# With OpenSSL
openssl rand -base64 32

# With Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example**:
```env
BETTER_AUTH_SECRET=+dh34Ge0TJcUPxtk7Nza9eOZ7+lPlX6itV/ATEw3jzs=
```

> **Important**: Never commit this key to source code!

### BETTER_AUTH_URL

Application base URL. Used for redirects and callbacks.

```env
# Development
BETTER_AUTH_URL=http://localhost:3000

# Production
BETTER_AUTH_URL=https://dbkeep.example.com
```

---

## Operation Modes

DBKeep supports different deployment modes via environment variables.

### NUXT_PUBLIC_GUEST_MODE

Enables **Guest Mode** allowing the application to be used without authentication.

| Value | Behavior |
|-------|----------|
| `false` (default) | Authentication required |
| `true` | Open access, projects assigned to a "guest" user |

**Use cases**:
- Personal self-hosting
- Demo instances
- Local use without account

```env
NUXT_PUBLIC_GUEST_MODE=true
```

**Impact**:
- Auth middleware allows all requests to `/app`
- Projects are saved with user ID `guest-user`
- "Profile" and "Settings" options are hidden in the menu

### NUXT_PUBLIC_ENABLE_REGISTER

Controls new user registration.

| Value | Behavior |
|-------|----------|
| `true` (default) | Open registration |
| `false` | Registration disabled |

**Use cases**:
- Private deployment (only admin creates accounts)
- Locked personal instance
- Closed beta phase

```env
NUXT_PUBLIC_ENABLE_REGISTER=false
```

**Impact**:
- "Sign up" link is hidden on `/login`
- The `/register` page displays an error message
- The `/api/auth/sign-up` API returns a 403 error

---

## Deployment Scenarios

### Multi-user (default)

Standard configuration with authentication and open registration.

```env
DATABASE_URL=postgresql://user:pass@db.host.com:5432/dbkeep
BETTER_AUTH_SECRET=<secure-key>
BETTER_AUTH_URL=https://dbkeep.example.com

# Default values (can be omitted)
NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=true
```

### Private Deployment

Authentication required, registration disabled (admin creates accounts).

```env
DATABASE_URL=postgresql://user:pass@db.host.com:5432/dbkeep
BETTER_AUTH_SECRET=<secure-key>
BETTER_AUTH_URL=https://private.dbkeep.example.com

NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Personal Self-hosting

Guest mode for personal use without account management.

```env
DATABASE_URL=postgresql://localhost/dbkeep
BETTER_AUTH_SECRET=dev-key-not-important-in-guest-mode
BETTER_AUTH_URL=http://localhost:3000

NUXT_PUBLIC_GUEST_MODE=true
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Local Development

Configuration for development with all features enabled.

```env
DATABASE_URL=postgresql://localhost/dbkeep
BETTER_AUTH_SECRET=dev-secret-key-not-for-production-use
BETTER_AUTH_URL=http://localhost:3000

NUXT_PUBLIC_GUEST_MODE=false
NUXT_PUBLIC_ENABLE_REGISTER=true
```

---

## Complete Example

```env
# ===========================================
# PostgreSQL Database
# ===========================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/dbkeep

# ===========================================
# Better Auth
# ===========================================
BETTER_AUTH_SECRET=+dh34Ge0TJcUPxtk7Nza9eOZ7+lPlX6itV/ATEw3jzs=
BETTER_AUTH_URL=http://localhost:3000

# ===========================================
# Operation Mode
# ===========================================
# Guest Mode (access without authentication)
NUXT_PUBLIC_GUEST_MODE=false

# User registration
NUXT_PUBLIC_ENABLE_REGISTER=true
```

## Validation

After configuration, verify everything works:

```bash
# Test database connection
pnpm db:push

# Launch the application
pnpm dev

# Open Drizzle Studio to verify tables
pnpm db:studio
```
