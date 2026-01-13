import { signIn, signUp, signOut, useSession, getSession } from '~/utils/auth-client'

/**
 * Composable pour l'authentification
 * Wrapper autour du client Better Auth
 */
export const useAuth = () => {
  const router = useRouter()

  // Session réactive depuis Better Auth (côté client uniquement)
  const sessionQuery = import.meta.client ? useSession() : null

  // État partagé pour la session (useState pour partager entre composants)
  const sessionData = useState<any>('auth-session', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)
  const error = useState<Error | null>('auth-error', () => null)

  // Synchroniser la session de Better Auth avec notre état
  if (import.meta.client && sessionQuery) {
    watch(
      () => sessionQuery.data?.value,
      (newSession) => {
        sessionData.value = newSession
        isLoading.value = sessionQuery.isPending?.value ?? false
      },
      { immediate: true }
    )
  }

  // Charger la session au montage côté client
  onMounted(async () => {
    if (import.meta.client) {
      try {
        const result = await getSession()
        if (result.data) {
          sessionData.value = result.data
        }
      } catch (e) {
        error.value = e as Error
      } finally {
        isLoading.value = false
      }
    }
  })

  // Computed pour l'état de l'authentification
  const isAuthenticated = computed(() => !!sessionData.value?.user)
  const user = computed(() => sessionData.value?.user || null)

  /**
   * Inscription avec email/password
   */
  const register = async (data: {
    email: string
    password: string
    name: string
  }) => {
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Redirection vers l'app après inscription
      await router.push('/app')
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      }
    }
  }

  /**
   * Connexion avec email/password
   */
  const login = async (data: {
    email: string
    password: string
  }) => {
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Redirection vers l'app après connexion
      await router.push('/app')
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      }
    }
  }

  /**
   * Déconnexion
   */
  const logout = async () => {
    try {
      await signOut()
      // Redirection vers la page d'accueil
      await router.push('/')
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      }
    }
  }

  return {
    // État
    session: sessionData,
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    register,
    login,
    logout
  }
}
