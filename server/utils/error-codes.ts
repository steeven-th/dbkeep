/**
 * Base API error codes for DBKeep
 * These codes are used for client-side internationalization
 *
 * This file contains generic error codes.
 * Extended deployments can add their own codes by creating a similar file.
 */

export const ErrorCode = {
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',

  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // User errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Generic validation errors
  EMAIL_INVALID: 'EMAIL_INVALID',
  EMAIL_REQUIRED: 'EMAIL_REQUIRED',
  NAME_REQUIRED: 'NAME_REQUIRED',
  FIELD_REQUIRED: 'FIELD_REQUIRED',

  // Project errors
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_PERMISSION_DENIED: 'PROJECT_PERMISSION_DENIED'
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]
