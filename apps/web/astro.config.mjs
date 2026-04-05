import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://legalize.crafter.ing',
  adapter: vercel(),
  integrations: [sitemap()],
})
