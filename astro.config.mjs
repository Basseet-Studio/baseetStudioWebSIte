import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import cloudPlaygroundDev from './src/integrations/cloud-playground-dev'

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
    cloudPlaygroundDev(),
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
    '/projects/zaryn': '/projects/invexo/',
    '/projects/zaryn/features': '/projects/invexo/features/',
    '/projects/zaryn/demo': '/projects/invexo/demo/',
    '/projects/zaryn/terms': '/projects/invexo/terms/',
    '/projects/baseetims': '/projects/invexo/',
    '/projects/baseetims/features': '/projects/invexo/features/',
    '/projects/baseetims/demo': '/projects/invexo/demo/',
    '/projects/baseetims/terms': '/projects/invexo/terms/',
    '/projects/deshikitchen': '/projects/ordelo/',
    '/projects/deshikitchen/features': '/projects/ordelo/features/',
    '/projects/deshikitchen/demo': '/projects/ordelo/demo/',
    '/projects/deshikitchen/terms': '/projects/ordelo/terms/',
  },
})
