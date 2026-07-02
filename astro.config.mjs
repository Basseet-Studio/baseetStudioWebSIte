import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://baseetstudio.com',
  integrations: [tailwind(), sitemap()],
  output: 'static',
  build: { assets: 'assets' },
  redirects: {
    '/projects/zaryn': '/projects/baseetims/',
    '/projects/zaryn/features': '/projects/baseetims/features/',
    '/projects/zaryn/demo': '/projects/baseetims/demo/',
    '/projects/zaryn/terms': '/projects/baseetims/terms/',
  },
})
