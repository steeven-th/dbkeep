# Authentification

DBKeep utilise [Better Auth](https://www.better-auth.com) pour gérer l'authentification des utilisateurs.

## Modes de fonctionnement

DBKeep supporte plusieurs modes de déploiement :

| Mode | Description | Variables |
|------|-------------|-----------|
| **SaaS Public** | Auth requise, inscription ouverte | (défaut) |
| **SaaS Privé** | Auth requise, inscription fermée | `NUXT_PUBLIC_ENABLE_REGISTER=false` |
| **Mode Invité** | Pas d'auth, usage personnel | `NUXT_PUBLIC_GUEST_MODE=true` |

Voir [Configuration](./configuration.md) pour plus de détails.

## Vue d'ensemble

Better Auth est une solution d'authentification moderne pour les applications TypeScript/JavaScript, offrant :

- Authentification email/mot de passe
- Sessions sécurisées en base de données
- Support OAuth (extensible)
- API type-safe
- Intégration Drizzle native

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt)                       │
├─────────────────────────────────────────────────────────────┤
│  app/utils/auth-client.ts    → Client Better Auth           │
│  app/composables/useAuth.ts  → Composable Vue               │
│  app/middleware/auth.ts      → Protection des routes        │
│  app/pages/login.vue         → Page de connexion            │
│  app/pages/register.vue      → Page d'inscription           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Nitro)                       │
├─────────────────────────────────────────────────────────────┤
│  server/utils/auth.ts        → Configuration Better Auth    │
│  server/api/auth/[...all].ts → Handler API                  │
│  server/database/schema.ts   → Tables auth (Drizzle)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        PostgreSQL                            │
├─────────────────────────────────────────────────────────────┤
│  user         → Utilisateurs                                │
│  session      → Sessions actives                            │
│  account      → Comptes OAuth                               │
│  verification → Tokens de vérification email                │
└─────────────────────────────────────────────────────────────┘
```

## Configuration serveur

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

## Configuration client

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

## Protection des routes

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

## Routes disponibles

| Route | Description | Accès |
|-------|-------------|-------|
| `/` | Landing page | Public |
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/app` | Application | Authentifié |

## API Endpoints

Better Auth expose automatiquement ces endpoints :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/sign-up/email` | POST | Inscription |
| `/api/auth/sign-in/email` | POST | Connexion |
| `/api/auth/sign-out` | POST | Déconnexion |
| `/api/auth/get-session` | GET | Session actuelle |

## Utilisation dans les composants

### Vérifier l'authentification

```vue
<script setup lang="ts">
const { isAuthenticated, user, isLoading } = useAuth()
</script>

<template>
  <div v-if="isLoading">Chargement...</div>
  <div v-else-if="isAuthenticated">
    Bonjour {{ user?.name }}
  </div>
  <div v-else>
    Non connecté
  </div>
</template>
```

### Formulaire de connexion

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

### Déconnexion

```vue
<script setup lang="ts">
const { logout, user } = useAuth()
</script>

<template>
  <UButton @click="logout">
    Se déconnecter
  </UButton>
</template>
```

## Sécurité

### Mot de passe

- Minimum 8 caractères (configurable)
- Hashé avec bcrypt par Better Auth
- Jamais stocké en clair

### Sessions

- Stockées en base de données
- Token unique par session
- Expiration automatique
- Révocation possible

### Bonnes pratiques

1. Toujours utiliser HTTPS en production
2. Garder `BETTER_AUTH_SECRET` secret
3. Configurer une expiration de session raisonnable
4. Surveiller les tentatives de connexion échouées

## Mode Invité

Le mode invité permet d'utiliser DBKeep sans authentification, idéal pour l'auto-hébergement personnel.

### Activation

```env
NUXT_PUBLIC_GUEST_MODE=true
```

### Fonctionnement

- Le middleware `auth.ts` laisse passer toutes les requêtes vers `/app`
- Un utilisateur "guest" est créé automatiquement au démarrage (`server/plugins/guestUser.ts`)
- Les projets sont attribués à l'ID `guest-user`
- Les options "Profil" et "Paramètres" sont masquées

### Composable useAppMode

```typescript
const { isGuestModeEnabled, guestUser, isAuthRequired } = useAppMode()

// Vérifier si en mode invité
if (isGuestModeEnabled.value) {
  console.log('Mode invité activé')
}
```

## Désactivation de l'inscription

Pour un SaaS privé où seul l'admin crée les comptes :

```env
NUXT_PUBLIC_ENABLE_REGISTER=false
```

### Impact

- Le lien "S'inscrire" est masqué sur `/login`
- La page `/register` affiche un message d'erreur
- L'API `/api/auth/sign-up` retourne une erreur 403

### Vérification côté client

```typescript
const { isRegisterEnabled } = useAppMode()

// Afficher le lien d'inscription seulement si activé
<NuxtLink v-if="isRegisterEnabled" to="/register">
  S'inscrire
</NuxtLink>
```
