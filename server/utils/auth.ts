import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../database/drizzle'
import * as schema from '../database/schema'
import { sendPasswordResetEmail, sendEmailVerification, isEmailConfigured } from '../services/emailService'

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
    minPasswordLength: 8,

    // Password reset email
    sendResetPassword: async ({ user, url }) => {
      if (!isEmailConfigured()) {
        console.warn('[Auth] Email not configured - reset link:', url)
        return
      }

      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
        expiresInMinutes: 60
      })
    }
  },

  // Email verification (optional, disabled by default)
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!isEmailConfigured()) {
        console.warn('[Auth] Email not configured - verification link:', url)
        return
      }

      await sendEmailVerification({
        to: user.email,
        verifyUrl: url,
        userName: user.name
      })
    },
    // Disabled by default, can be enabled via env
    sendOnSignUp: process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
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
