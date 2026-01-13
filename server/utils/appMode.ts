import type { H3Event } from 'h3'
import { auth } from './auth'
import { GUEST_USER_ID } from '../services/projectService'

/**
 * Server-side utilities for application mode management
 */

/**
 * Checks if guest mode is enabled
 */
export function isGuestModeEnabled(): boolean {
  const config = useRuntimeConfig()
  return config.public.guestMode === true
}

/**
 * Checks if registration is enabled
 */
export function isRegisterEnabled(): boolean {
  const config = useRuntimeConfig()
  return config.public.enableRegister !== false
}

/**
 * Returns the effective user ID for operations
 * - In guest mode: returns guest ID if no session
 * - In normal mode: returns session ID or null
 */
export async function getEffectiveUserId(event: H3Event): Promise<string | null> {
  // Try to get authenticated session
  const session = await auth.api.getSession({
    headers: event.headers
  })

  // If authenticated, return user ID
  if (session?.user?.id) {
    return session.user.id
  }

  // If guest mode enabled, return guest ID
  if (isGuestModeEnabled()) {
    return GUEST_USER_ID
  }

  // Otherwise, no user
  return null
}

/**
 * Ensures the user is authenticated (or in guest mode)
 * Throws 401 error if not authenticated and guest mode is disabled
 */
export async function requireAuth(event: H3Event): Promise<string> {
  const userId = await getEffectiveUserId(event)

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return userId
}
