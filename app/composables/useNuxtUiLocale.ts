import { computed } from 'vue'
import { fr, en } from '@nuxt/ui/locale'

/**
 * Maps i18n locale codes to Nuxt UI locale objects
 */
const localeMap = {
  fr,
  en
} as const

type NuxtUiLocale = typeof fr

/**
 * Composable to get the Nuxt UI locale based on current i18n locale
 * Keeps Nuxt UI components in sync with the app language
 */
export const useNuxtUiLocale = () => {
  const { locale } = useI18n()

  return computed<NuxtUiLocale>(() => localeMap[locale.value as keyof typeof localeMap] || en)
}
