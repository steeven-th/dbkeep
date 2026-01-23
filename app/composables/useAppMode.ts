/**
 * Composable for managing application modes
 * - Guest Mode: Allows using the app without authentication
 * - Register Mode: Enables/disables registration
 */
export const useAppMode = () => {
  const runtimeConfig = useRuntimeConfig()

  // === Configuration from environment variables ===

  /**
   * Guest Mode enabled
   * If true, user can access the app without authentication
   */
  const isGuestModeEnabled = computed(() => {
    return runtimeConfig.public.guestMode === true
  })

  /**
   * Registration enabled
   * If false, registration link is hidden and API is blocked
   */
  const isRegisterEnabled = computed(() => {
    return runtimeConfig.public.enableRegister !== false
  })

  // === Guest user state ===

  /**
   * Guest user ID (used for database saves)
   * This special ID allows assigning projects to a "system" user
   */
  const GUEST_USER_ID = 'guest-user'

  /**
   * Simulated guest user data
   */
  const guestUser = computed(() => ({
    id: GUEST_USER_ID,
    name: 'Guest',
    email: 'guest@local',
    isGuest: true
  }))

  // === Helpers ===

  /**
   * Checks if authentication is required to access the app
   * In guest mode, auth is not required
   */
  const isAuthRequired = computed(() => !isGuestModeEnabled.value)

  /**
   * Returns the user ID to use for operations
   * In guest mode, returns the guest ID
   */
  const getEffectiveUserId = (authenticatedUserId: string | null | undefined): string => {
    if (authenticatedUserId) {
      return authenticatedUserId
    }
    if (isGuestModeEnabled.value) {
      return GUEST_USER_ID
    }
    throw new Error('User ID required but not available')
  }

  return {
    // Configuration
    isGuestModeEnabled,
    isRegisterEnabled,
    isAuthRequired,

    // Constants
    GUEST_USER_ID,

    // Data
    guestUser,

    // Helpers
    getEffectiveUserId
  }
}
