import frTranslations from '../locales/fr.json'
import enTranslations from '../locales/en.json'

export type SupportedLocale = 'fr' | 'en'

const translations: Record<SupportedLocale, typeof frTranslations> = {
  fr: frTranslations,
  en: enTranslations
}

/**
 * Get a nested value from an object using dot notation
 * Example: getNestedValue(obj, 'email.password_reset.title')
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj) as string | undefined
}

/**
 * Server-side translation function
 *
 * @param locale - The locale to use ('fr' or 'en')
 * @param key - The translation key (dot notation, e.g., 'email.password_reset.title')
 * @param params - Optional parameters to interpolate (e.g., { app_name: 'DBKeep' })
 * @returns The translated string with interpolated parameters
 */
export function t(locale: SupportedLocale, key: string, params?: Record<string, string | number>): string {
  const localeTranslations = translations[locale] || translations.en
  let value = getNestedValue(localeTranslations, key)

  // Fallback to English if key not found in requested locale
  if (!value && locale !== 'en') {
    value = getNestedValue(translations.en, key)
  }

  // Return key if translation not found
  if (!value) {
    console.warn(`[i18n] Missing translation for key: ${key}`)
    return key
  }

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
    })
  }

  return value
}

/**
 * Check if a locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return locale === 'fr' || locale === 'en'
}

/**
 * Get a valid locale, defaulting to 'en' if invalid
 */
export function getValidLocale(locale?: string): SupportedLocale {
  if (locale && isValidLocale(locale)) {
    return locale
  }
  return 'en'
}

/**
 * Extract the preferred locale from an incoming request.
 *
 * Detection order:
 * 1. The `i18n_redirected` cookie (set by the front-end i18n module,
 *    reflects the user's chosen/detected language)
 * 2. The `Accept-Language` header (browser language)
 * 3. Fallback to the default locale
 *
 * Useful for transactional emails sent during flows where the user is not
 * yet persisted (e.g. sign-up), so their language cannot be read from the DB.
 *
 * @param request - The incoming web Request (may be undefined)
 * @returns A supported locale
 */
export function getLocaleFromRequest(request?: Request): SupportedLocale {
  if (!request) {
    return getValidLocale()
  }

  // 1. Try the i18n cookie
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)i18n_redirected=([^;]+)/)
    if (match && match[1]) {
      const cookieLocale = decodeURIComponent(match[1])
      if (isValidLocale(cookieLocale)) {
        return cookieLocale
      }
    }
  }

  // 2. Fallback to the Accept-Language header (first language tag)
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.trim().slice(0, 2).toLowerCase()
    if (primary && isValidLocale(primary)) {
      return primary
    }
  }

  // 3. Default locale
  return getValidLocale()
}
