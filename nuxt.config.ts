import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxtjs/i18n'
  ],

  // Runtime configuration (environment variables)
  runtimeConfig: {
    public: {
      // Guest Mode: allows using the app without authentication
      // Set via NUXT_PUBLIC_GUEST_MODE=true
      guestMode: false,

      // Registration: enables/disables user registration
      // Set via NUXT_PUBLIC_ENABLE_REGISTER=false
      enableRegister: true
    }
  },

  i18n: {
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'fr',
    lazy: true,
    langDir: '../i18n/locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  },

  devtools: {
    enabled: true
  },

  css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],

  // Nuxt UI automatically generates the required palettes based on app.config.ts

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
