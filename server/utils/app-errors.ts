/**
 * Utilities for creating standardized errors
 *
 * This file provides helpers to create HTTP errors
 * with error codes for internationalization.
 */

/**
 * Interface for application error data
 */
export interface AppErrorData {
  code: string
  details?: Record<string, unknown>
}

/**
 * Creates an HTTP error with an error code for internationalization
 */
export function createAppError(
  statusCode: number,
  code: string,
  details?: Record<string, unknown>
) {
  return createError({
    statusCode,
    message: code, // Message is the code for server-side debugging
    data: {
      code,
      details
    } as AppErrorData
  })
}

/**
 * Pre-configured common errors
 */
export const AppErrors = {
  // 400 - Bad Request
  badRequest: (code: string, details?: Record<string, unknown>) =>
    createAppError(400, code, details),

  // 401 - Unauthorized
  unauthorized: (code: string = 'UNAUTHORIZED', details?: Record<string, unknown>) =>
    createAppError(401, code, details),

  // 403 - Forbidden
  forbidden: (code: string = 'FORBIDDEN', details?: Record<string, unknown>) =>
    createAppError(403, code, details),

  // 404 - Not Found
  notFound: (code: string = 'NOT_FOUND', details?: Record<string, unknown>) =>
    createAppError(404, code, details),

  // 409 - Conflict
  conflict: (code: string, details?: Record<string, unknown>) =>
    createAppError(409, code, details),

  // 402 - Payment Required
  paymentRequired: (code: string = 'QUOTA_EXCEEDED', details?: Record<string, unknown>) =>
    createAppError(402, code, details),

  // 500 - Internal Server Error
  internal: (code: string = 'UNKNOWN_ERROR', details?: Record<string, unknown>) =>
    createAppError(500, code, details)
}
