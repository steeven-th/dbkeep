import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Favicons and meta tags

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },

  css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],

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
  }
})
