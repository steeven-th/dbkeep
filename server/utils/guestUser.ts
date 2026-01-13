import { eq } from 'drizzle-orm'
import { db } from '../database/drizzle'
import { user } from '../database/schema'
import { GUEST_USER_ID } from '../services/projectService'

/**
 * Ensures the guest user exists in the database
 * Called at startup if guest mode is enabled
 */
export async function ensureGuestUserExists(): Promise<void> {
  // Check if guest user already exists
  const [existingGuest] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, GUEST_USER_ID))
    .limit(1)

  if (existingGuest) {
    return // User already exists
  }

  // Create guest user
  await db.insert(user).values({
    id: GUEST_USER_ID,
    name: 'Guest User',
    email: 'guest@local.dbkeep',
    emailVerified: true
  })

  console.log('[DBKeep] Guest user created in database')
}
