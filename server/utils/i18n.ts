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
