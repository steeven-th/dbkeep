import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database/drizzle'
import * as schema from '../database/schema'

/**
 * Better Auth configuration
 * Uses Drizzle ORM with PostgreSQL
 */
export const auth = betterAuth({
  // Application base URL
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Token secret (must be set in production)
  secret: process.env.BETTER_AUTH_SECRET,

  // Drizzle adapter for persistence
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),

  // Email/password authentication configuration
  emailAndPassword: {
    enabled: true,
    // Minimum password length
    minPasswordLength: 8
  },

  // Session configuration
  session: {
    // Session lifetime (7 days)
    expiresIn: 60 * 60 * 24 * 7,
    // Automatic renewal
    updateAge: 60 * 60 * 24
  },

  // Cookie configuration
  advanced: {
    cookiePrefix: 'dbkeep',
    useSecureCookies: process.env.NODE_ENV === 'production'
  }
})

// Session type
export type AuthSession = typeof auth.$Infer.Session
