import { createAuthClient } from 'better-auth/vue'
import { adminClient } from 'better-auth/client/plugins'

/**
 * Better Auth client for Vue/Nuxt frontend
 * Note: Better Auth requires an absolute URL for SSR
 */
export const authClient = createAuthClient({
  baseURL: import.meta.server
    ? (process.env.BETTER_AUTH_URL || 'http://localhost:3000')
    : window.location.origin,
  plugins: [
    adminClient() // Adds admin role support to client
  ]
})

// Export main methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession
} = authClient
