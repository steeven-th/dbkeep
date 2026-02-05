import { getSession } from '~/utils/auth-client'

/**
 * Guest-only middleware
 * Redirects authenticated users to /app
 * Used on /login and /register pages
 */
export default defineNuxtRouteMiddleware(async () => {
  const runtimeConfig = useRuntimeConfig()

  // Guest mode = no auth, no redirect
  if (runtimeConfig.public.guestMode === true) {
    return
  }

  // Server-side: check session cookie to prevent page flash during SSR
  if (import.meta.server) {
    const sessionCookie = useCookie('dbkeep.session_token')
    if (sessionCookie.value) {
      return navigateTo('/app')
    }
  }

  // Client-side: full session check
  if (import.meta.client) {
    const session = await getSession()

    if (session.data?.user) {
      return navigateTo('/app')
    }
  }
})
