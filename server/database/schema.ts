import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'

/**
 * Table User - Utilisateurs de l'application
 * Compatible avec Better Auth
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

/**
 * Table Session - Sessions utilisateur
 * Compatible avec Better Auth
 */
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
})

/**
 * Table Account - Comptes OAuth liés
 * Compatible avec Better Auth
 */
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

/**
 * Table Verification - Tokens de vérification (email, reset password)
 * Compatible avec Better Auth
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

/**
 * Table Project - Projets de schéma de base de données
 * Liée à l'utilisateur
 */
export const project = pgTable('project', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  engine: text('engine').notNull().default('postgresql'),
  data: text('data'), // JSON stringifié du schéma
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Types exportés pour TypeScript
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type Project = typeof project.$inferSelect
export type NewProject = typeof project.$inferInsert
