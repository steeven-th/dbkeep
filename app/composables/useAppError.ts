/**
 * Composable for application error handling
 *
 * Allows:
 * - Parsing standardized API errors
 * - Translating error codes
 * - Displaying error toasts
 */

/**
 * Interface for captured errors
 */
export interface CapturedError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

export const useAppError = () => {
  const { t, te } = useI18n()
  const toast = useToast()

  /**
   * Extracts error code from an API error
   */
  const getErrorCode = (error: unknown): string => {
    if (!error || typeof error !== 'object') {
      return 'UNKNOWN_ERROR'
    }

    const err = error as Record<string, unknown>

    // $fetch error format: error.data.code
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>
      if (data.code && typeof data.code === 'string') {
        return data.code
      }
    }

    // Direct format: error.code
    if (err.code && typeof err.code === 'string') {
      return err.code
    }

    return 'UNKNOWN_ERROR'
  }

  /**
   * Extracts details from an API error
   */
  const getErrorDetails = (error: unknown): Record<string, unknown> | undefined => {
    if (!error || typeof error !== 'object') {
      return undefined
    }

    const err = error as Record<string, unknown>

    // $fetch error format: error.data.details
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>
      if (data.details && typeof data.details === 'object') {
        return data.details as Record<string, unknown>
      }
    }

    return undefined
  }

  /**
   * Translates an error code
   * Returns translated message or code if no translation exists
   */
  const translateErrorCode = (code: string): string => {
    const key = `errors.${code}`
    if (te(key)) {
      return t(key)
    }
    // Fallback: return formatted code
    return code.replace(/_/g, ' ').toLowerCase()
  }

  /**
   * Parses an error and returns structured information
   */
  const parseError = (error: unknown): CapturedError => {
    const code = getErrorCode(error)
    const details = getErrorDetails(error)
    const message = translateErrorCode(code)

    let statusCode: number | undefined
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>
      if (typeof err.statusCode === 'number') {
        statusCode = err.statusCode
      }
    }

    return {
      code,
      message,
      details,
      statusCode
    }
  }

  /**
   * Displays an error in a toast
   */
  const showErrorToast = (error: unknown, title?: string) => {
    const parsed = parseError(error)

    toast.add({
      title: title || t('error.title'),
      description: parsed.message,
      color: 'error'
    })

    return parsed
  }

  /**
   * Checks if error matches a specific code
   */
  const isErrorCode = (error: unknown, code: string): boolean => {
    return getErrorCode(error) === code
  }

  return {
    getErrorCode,
    getErrorDetails,
    translateErrorCode,
    parseError,
    showErrorToast,
    isErrorCode
  }
}
