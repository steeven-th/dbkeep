import { eq } from 'drizzle-orm'
import { db } from '../database/drizzle'
import { user } from '../database/schema'
import { GUEST_USER_ID } from '../services/projectService'

/**
 * Assure que l'utilisateur guest existe dans la BDD
 * Appelé au démarrage si le mode guest est activé
 */
export async function ensureGuestUserExists(): Promise<void> {
  // Vérifier si l'utilisateur guest existe déjà
  const [existingGuest] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, GUEST_USER_ID))
    .limit(1)

  if (existingGuest) {
    return // L'utilisateur existe déjà
  }

  // Créer l'utilisateur guest
  await db.insert(user).values({
    id: GUEST_USER_ID,
    name: 'Guest User',
    email: 'guest@local.dbkeep',
    emailVerified: true
  })

  console.log('[DBKeep] Guest user created in database')
}
