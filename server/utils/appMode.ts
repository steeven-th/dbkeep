import type { H3Event } from 'h3'
import { auth } from './auth'
import { GUEST_USER_ID } from '../services/projectService'

/**
 * Utilitaires pour la gestion des modes de l'application côté serveur
 */

/**
 * Vérifie si le mode invité est activé
 */
export function isGuestModeEnabled(): boolean {
  const config = useRuntimeConfig()
  return config.public.guestMode === true
}

/**
 * Vérifie si l'inscription est activée
 */
export function isRegisterEnabled(): boolean {
  const config = useRuntimeConfig()
  return config.public.enableRegister !== false
}

/**
 * Récupère l'ID utilisateur effectif pour les opérations
 * - En mode invité: retourne l'ID guest si pas de session
 * - En mode normal: retourne l'ID de la session ou null
 */
export async function getEffectiveUserId(event: H3Event): Promise<string | null> {
  // Essayer d'obtenir la session authentifiée
  const session = await auth.api.getSession({
    headers: event.headers
  })

  // Si authentifié, retourner l'ID utilisateur
  if (session?.user?.id) {
    return session.user.id
  }

  // Si mode invité activé, retourner l'ID guest
  if (isGuestModeEnabled()) {
    return GUEST_USER_ID
  }

  // Sinon, pas d'utilisateur
  return null
}

/**
 * Vérifie que l'utilisateur est authentifié (ou en mode invité)
 * Lance une erreur 401 si non authentifié et mode invité désactivé
 */
export async function requireAuth(event: H3Event): Promise<string> {
  const userId = await getEffectiveUserId(event)

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non authentifié'
    })
  }

  return userId
}
