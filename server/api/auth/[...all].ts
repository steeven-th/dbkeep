import { auth } from '../../utils/auth'
import { isRegisterEnabled } from '../../utils/appMode'

/**
 * Catch-all handler for Better Auth authentication routes
 * Handles: /api/auth/sign-up, /api/auth/sign-in, /api/auth/sign-out, etc.
 */
export default defineEventHandler(async (event) => {
  // Block registration if disabled
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
