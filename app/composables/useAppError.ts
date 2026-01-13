/**
 * Composable pour la gestion des erreurs de l'application
 *
 * Permet de :
 * - Parser les erreurs API standardisées
 * - Traduire les codes d'erreur
 * - Afficher des toasts d'erreur
 */

/**
 * Interface pour les erreurs capturées
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
   * Extrait le code d'erreur d'une erreur API
   */
  const getErrorCode = (error: unknown): string => {
    if (!error || typeof error !== 'object') {
      return 'UNKNOWN_ERROR'
    }

    const err = error as Record<string, unknown>

    // Format $fetch error: error.data.code
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>
      if (data.code && typeof data.code === 'string') {
        return data.code
      }
    }

    // Format direct: error.code
    if (err.code && typeof err.code === 'string') {
      return err.code
    }

    return 'UNKNOWN_ERROR'
  }

  /**
   * Extrait les détails d'une erreur API
   */
  const getErrorDetails = (error: unknown): Record<string, unknown> | undefined => {
    if (!error || typeof error !== 'object') {
      return undefined
    }

    const err = error as Record<string, unknown>

    // Format $fetch error: error.data.details
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>
      if (data.details && typeof data.details === 'object') {
        return data.details as Record<string, unknown>
      }
    }

    return undefined
  }

  /**
   * Traduit un code d'erreur
   * Retourne le message traduit ou le code si pas de traduction
   */
  const translateErrorCode = (code: string): string => {
    const key = `errors.${code}`
    if (te(key)) {
      return t(key)
    }
    // Fallback : retourner le code formaté
    return code.replace(/_/g, ' ').toLowerCase()
  }

  /**
   * Parse une erreur et retourne les informations structurées
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
   * Affiche une erreur dans un toast
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
   * Vérifie si l'erreur correspond à un code spécifique
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
