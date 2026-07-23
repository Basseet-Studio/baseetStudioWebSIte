import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

const LOCALES = ['en', 'ar', 'ur', 'hi', 'fil']

export default defineConfig({
  site: 'https://baseetstudio.com',
  integrations: [
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-AE',
          ar: 'ar-AE',
          ur: 'ur-PK',
          hi: 'hi-IN',
          fil: 'fil-PH',
        },
      },
    }),
  ],
  output: 'static',
  build: { assets: 'assets' },
  i18n: {
    defaultLocale: 'en',
    locales: LOCALES,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    '/projects/zaryn': '/projects/baseetims/',
    '/projects/zaryn/features': '/projects/baseetims/features/',
    '/projects/zaryn/demo': '/projects/baseetims/demo/',
    '/projects/zaryn/terms': '/projects/baseetims/terms/',
  },
})
