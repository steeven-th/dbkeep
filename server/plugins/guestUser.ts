import { ensureGuestUserExists } from '../utils/guestUser'
import { isGuestModeEnabled } from '../utils/appMode'

/**
 * Server plugin that runs at startup
 * Creates the guest user if guest mode is enabled
 */
export default defineNitroPlugin(async () => {
  // Do nothing if guest mode is not enabled
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
