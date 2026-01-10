/**
 * Composable pour la gestion des modes de l'application
 * - Guest Mode: Permet d'utiliser l'app sans authentification
 * - Register Mode: Active/désactive l'inscription
 */
export const useAppMode = () => {
  const runtimeConfig = useRuntimeConfig()

  // === Configuration depuis les variables d'environnement ===

  /**
   * Mode Invité activé
   * Si true, l'utilisateur peut accéder à l'app sans authentification
   */
  const isGuestModeEnabled = computed(() => {
    return runtimeConfig.public.guestMode === true
  })

  /**
   * Inscription activée
   * Si false, le lien d'inscription est masqué et l'API bloquée
   */
  const isRegisterEnabled = computed(() => {
    return runtimeConfig.public.enableRegister !== false
  })

  // === État de l'utilisateur invité ===

  /**
   * ID de l'utilisateur invité (utilisé pour les sauvegardes en BDD)
   * Cet ID spécial permet d'attribuer les projets à un utilisateur "système"
   */
  const GUEST_USER_ID = 'guest-user'

  /**
   * Données de l'utilisateur invité simulé
   */
  const guestUser = computed(() => ({
    id: GUEST_USER_ID,
    name: 'Guest',
    email: 'guest@local',
    isGuest: true
  }))

  // === Helpers ===

  /**
   * Vérifie si l'authentification est requise pour accéder à l'app
   * En mode invité, l'auth n'est pas requise
   */
  const isAuthRequired = computed(() => !isGuestModeEnabled.value)

  /**
   * Retourne l'ID utilisateur à utiliser pour les opérations
   * En mode invité, retourne l'ID guest
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

    // Constantes
    GUEST_USER_ID,

    // Données
    guestUser,

    // Helpers
    getEffectiveUserId
  }
}
