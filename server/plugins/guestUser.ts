import { ensureGuestUserExists } from '../utils/guestUser'
import { isGuestModeEnabled } from '../utils/appMode'

/**
 * Plugin serveur qui s'exécute au démarrage
 * Crée l'utilisateur guest si le mode invité est activé
 */
export default defineNitroPlugin(async () => {
  // Ne rien faire si le mode guest n'est pas activé
  if (!isGuestModeEnabled()) {
    return
  }

  try {
    await ensureGuestUserExists()
    console.log('[DBKeep] Guest mode enabled - guest user ready')
  } catch (error) {
    console.error('[DBKeep] Failed to create guest user:', error)
  }
})
