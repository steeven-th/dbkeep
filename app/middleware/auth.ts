import { getSession } from '~/utils/auth-client'

/**
 * Middleware de protection des routes
 * - En mode normal: redirige vers /login si non authentifié
 * - En mode invité: laisse passer sans vérification
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const runtimeConfig = useRuntimeConfig()

  // Mode invité activé = pas de vérification d'auth
  if (runtimeConfig.public.guestMode === true) {
    return
  }

  // Ne pas vérifier sur les routes publiques
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Vérifier la session côté client
  if (import.meta.client) {
    const session = await getSession()

    if (!session.data?.user) {
      return navigateTo('/login')
    }
  }
})
