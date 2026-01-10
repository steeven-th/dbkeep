import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database/drizzle'
import * as schema from '../database/schema'

/**
 * Configuration Better Auth
 * Utilise Drizzle ORM avec PostgreSQL
 */
export const auth = betterAuth({
  // Base URL de l'application
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Secret pour les tokens (à définir en production)
  secret: process.env.BETTER_AUTH_SECRET,

  // Adapter Drizzle pour la persistance
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),

  // Configuration de l'authentification par email/password
  emailAndPassword: {
    enabled: true,
    // Longueur minimale du mot de passe
    minPasswordLength: 8
  },

  // Configuration des sessions
  session: {
    // Durée de vie de la session (7 jours)
    expiresIn: 60 * 60 * 24 * 7,
    // Renouvellement automatique
    updateAge: 60 * 60 * 24
  },

  // Configuration des cookies
  advanced: {
    cookiePrefix: 'dbkeep',
    useSecureCookies: process.env.NODE_ENV === 'production'
  }
})

// Type pour la session
export type AuthSession = typeof auth.$Infer.Session
