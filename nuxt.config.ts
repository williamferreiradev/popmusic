// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  runtimeConfig: {
    public: { appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000' }
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
        'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
      }
    },
    '/api/contrato/**': {
      headers: {
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/supabase',
    '@nuxt/eslint'
  ],
  colorMode: {
    classSuffix: ''
  },
  supabase: {
    useSsrCookies: true,
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: undefined,
      exclude: [],
      saveRedirectToCookie: false,
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: true,
    },
    types: '~/types/database.types.ts'
  }
})
