import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core'

// Helper to create timestamps with timezone (UTC storage)
const timestamptz = (name: string) => timestamp(name, { withTimezone: true })

/**
 * User table - Application users
 * Compatible with Better Auth (with admin plugin)
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'), // 'user' | 'admin' - Better Auth admin plugin
  banned: boolean('banned').default(false), // Better Auth admin plugin
  banReason: text('ban_reason'), // Better Auth admin plugin
  banExpires: timestamptz('ban_expires'), // Better Auth admin plugin
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow()
})

/**
 * Session table - User sessions
 * Compatible with Better Auth
 */
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamptz('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
})

/**
 * Account table - Linked OAuth accounts
 * Compatible with Better Auth
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
  accessTokenExpiresAt: timestamptz('access_token_expires_at'),
  refreshTokenExpiresAt: timestamptz('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow()
})

/**
 * Verification table - Verification tokens (email, password reset)
 * Compatible with Better Auth
 */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamptz('expires_at').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow()
})

/**
 * Project table - Database schema projects
 * Linked to user and workspace (user or team)
 */
export const project = pgTable('project', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  engine: text('engine').notNull().default('postgresql'),
  data: text('data'), // Stringified JSON schema
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Project owner (user_id or team_id)
  ownerId: text('owner_id').notNull(),
  // Owner type ('user' or 'team')
  ownerType: text('owner_type').notNull().default('user'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow()
})

// Exported types for TypeScript
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type Project = typeof project.$inferSelect
export type NewProject = typeof project.$inferInsert
