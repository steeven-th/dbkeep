import { getSession } from '~/utils/auth-client'

/**
 * Route protection middleware
 * - In normal mode: redirects to /login if not authenticated
 * - In guest mode: allows access without verification
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const runtimeConfig = useRuntimeConfig()

  // Guest mode enabled = no auth verification
  if (runtimeConfig.public.guestMode === true) {
    return
  }

  // Don't check on public routes
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Check session on client side
  if (import.meta.client) {
    const session = await getSession()

    if (!session.data?.user) {
      return navigateTo('/login')
    }
  }
})
