import { createAuthClient } from 'better-auth/vue'

/**
 * Client Better Auth pour le frontend Vue/Nuxt
 * Note: Better Auth nécessite une URL absolue pour le SSR
 */
export const authClient = createAuthClient({
  baseURL: import.meta.server
    ? (process.env.BETTER_AUTH_URL || 'http://localhost:3000')
    : window.location.origin
})

// Export des méthodes principales
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient
