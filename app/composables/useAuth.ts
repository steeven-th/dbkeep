import { signIn, signUp, signOut, useSession, getSession } from '~/utils/auth-client'

/**
 * Composable for authentication
 * Wrapper around Better Auth client
 */
export const useAuth = () => {
  const router = useRouter()

  // Reactive session from Better Auth (client side only)
  const sessionQuery = import.meta.client ? useSession() : null

  // Shared session state (useState to share between components)
  // Note: role field is added by Better Auth admin plugin ('user' | 'admin')
  const sessionData = useState<{ user?: { id: string, email: string, name?: string, role?: string } } | null>('auth-session', () => null)
  const isLoading = useState<boolean>('auth-loading', () => false)
  const error = useState<Error | null>('auth-error', () => null)

  // Sync Better Auth session with our state
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

  // Load session on client mount
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

  // Computed for authentication state
  const isAuthenticated = computed(() => !!sessionData.value?.user)
  const user = computed(() => sessionData.value?.user || null)

  /**
   * Register with email/password
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

      // Redirect to app after registration
      await router.push('/app')
      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }

  /**
   * Login with email/password
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

      // Redirect to app after login
      await router.push('/app')
      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await signOut()
      // Redirect to homepage
      await router.push('/')
      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }
  }

  return {
    // State
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
