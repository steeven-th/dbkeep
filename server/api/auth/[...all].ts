import { auth } from '../../utils/auth'
import { isRegisterEnabled } from '../../utils/appMode'

/**
 * Handler catch-all pour les routes d'authentification Better Auth
 * Gère : /api/auth/sign-up, /api/auth/sign-in, /api/auth/sign-out, etc.
 */
export default defineEventHandler(async (event) => {
  // Bloquer l'inscription si désactivée
  const url = getRequestURL(event)
  const isSignUpRoute = url.pathname.includes('/sign-up') || url.pathname.includes('/signup')

  if (isSignUpRoute && !isRegisterEnabled()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Registration is disabled on this instance'
    })
  }

  return auth.handler(toWebRequest(event))
})
