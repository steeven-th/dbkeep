# Authentication

DBKeep uses [Better Auth](https://www.better-auth.com) to manage user authentication.

## Operation Modes

DBKeep supports multiple deployment modes:

| Mode | Description | Variables |
|------|-------------|-----------|
| **Multi-user** | Auth required, open registration | (default) |
| **Private** | Auth required, registration disabled | `NUXT_PUBLIC_ENABLE_REGISTER=false` |
| **Guest Mode** | No auth, personal use | `NUXT_PUBLIC_GUEST_MODE=true` |

See [Configuration](./configuration.md) for more details.

## Overview

Better Auth is a modern authentication solution for TypeScript/JavaScript applications, offering:

- Email/password authentication
- Database-backed secure sessions
- OAuth support (extensible)
- Type-safe API
- Native Drizzle integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt)                       │
├─────────────────────────────────────────────────────────────┤
│  app/utils/auth-client.ts    → Better Auth Client           │
│  app/composables/useAuth.ts  → Vue Composable               │
│  app/middleware/auth.ts      → Route Protection             │
│  app/pages/login.vue         → Login Page                   │
│  app/pages/register.vue      → Registration Page            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Nitro)                       │
├─────────────────────────────────────────────────────────────┤
│  server/utils/auth.ts        → Better Auth Configuration    │
│  server/api/auth/[...all].ts → API Handler                  │
│  server/database/schema.ts   → Auth Tables (Drizzle)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        PostgreSQL                            │
├─────────────────────────────────────────────────────────────┤
│  user         → Users                                       │
│  session      → Active Sessions                             │
│  account      → OAuth Accounts                              │
│  verification → Email Verification Tokens                   │
└─────────────────────────────────────────────────────────────┘
```

## Server Configuration

### server/utils/auth.ts

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database/drizzle'
import { user, session, account, verification } from '../database/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification }
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8
  }
})
```

### server/api/auth/[...all].ts

```typescript
import { auth } from '~/server/utils/auth'
import { toWebRequest } from 'better-auth/node'

export default defineEventHandler(async (event) => {
  return auth.handler(toWebRequest(event))
})
```

## Client Configuration

### app/utils/auth-client.ts

```typescript
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  baseURL: import.meta.server
    ? (process.env.BETTER_AUTH_URL || 'http://localhost:3000')
    : window.location.origin
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient
```

### app/composables/useAuth.ts

```typescript
import { signIn, signUp, signOut, useSession } from '~/utils/auth-client'

export const useAuth = () => {
  const router = useRouter()
  const { data: session, isPending: isLoading, error } = useSession()

  const isAuthenticated = computed(() => !!session.value?.user)
  const user = computed(() => session.value?.user || null)

  const register = async (data) => {
    const result = await signUp.email(data)
    if (!result.error) await router.push('/app')
    return result
  }

  const login = async (data) => {
    const result = await signIn.email(data)
    if (!result.error) await router.push('/app')
    return result
  }

  const logout = async () => {
    await signOut()
    await router.push('/')
  }

  return {
    session, user, isAuthenticated, isLoading, error,
    register, login, logout
  }
}
```

## Route Protection

### app/middleware/auth.ts

```typescript
import { getSession } from '~/utils/auth-client'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login', '/register']

  if (publicRoutes.includes(to.path)) return

  if (import.meta.client) {
    const session = await getSession()
    if (!session.data?.user) {
      return navigateTo('/login')
    }
  }
})
```

## Available Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page | Public |
| `/login` | Login | Public |
| `/register` | Registration | Public |
| `/app` | Application | Authenticated |

## API Endpoints

Better Auth automatically exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-up/email` | POST | Registration |
| `/api/auth/sign-in/email` | POST | Login |
| `/api/auth/sign-out` | POST | Logout |
| `/api/auth/get-session` | GET | Current Session |

## Usage in Components

### Check Authentication

```vue
<script setup lang="ts">
const { isAuthenticated, user, isLoading } = useAuth()
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="isAuthenticated">
    Hello {{ user?.name }}
  </div>
  <div v-else>
    Not logged in
  </div>
</template>
```

### Login Form

```vue
<script setup lang="ts">
const { login } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const onSubmit = async () => {
  const result = await login(form)
  if (!result.success) {
    console.error(result.error)
  }
}
</script>
```

### Logout

```vue
<script setup lang="ts">
const { logout, user } = useAuth()
</script>

<template>
  <UButton @click="logout">
    Sign out
  </UButton>
</template>
```

## Security

### Password

- Minimum 8 characters (configurable)
- Hashed with bcrypt by Better Auth
- Never stored in plain text

### Sessions

- Stored in database
- Unique token per session
- Automatic expiration
- Revocable

### Best Practices

1. Always use HTTPS in production
2. Keep `BETTER_AUTH_SECRET` secret
3. Configure reasonable session expiration
4. Monitor failed login attempts

## Guest Mode

Guest mode allows using DBKeep without authentication, ideal for personal self-hosting.

### Activation

```env
NUXT_PUBLIC_GUEST_MODE=true
```

### How It Works

- The `auth.ts` middleware allows all requests to `/app`
- A "guest" user is automatically created at startup (`server/plugins/guestUser.ts`)
- Projects are assigned to the `guest-user` ID
- "Profile" and "Settings" options are hidden

### useAppMode Composable

```typescript
const { isGuestModeEnabled, guestUser, isAuthRequired } = useAppMode()

// Check if in guest mode
if (isGuestModeEnabled.value) {
  console.log('Guest mode enabled')
}
```

## Disabling Registration

For private deployments where only admins create accounts:

```env
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Impact

- "Sign up" link is hidden on `/login`
- The `/register` page shows an error message
- The `/api/auth/sign-up` API returns a 403 error

### Client-side Check

```typescript
const { isRegisterEnabled } = useAppMode()

// Show registration link only if enabled
<NuxtLink v-if="isRegisterEnabled" to="/register">
  Sign up
</NuxtLink>
```
