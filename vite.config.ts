import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/Chat_github/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Phone AI + GitHub',
        short_name: 'Chat GitHub',
        description: 'Mobile-First AI CLI & Text Editor for GitHub',
        theme_color: '#000000',
        background_color: '#ffffff',
        scope: '/Chat_github/',
        display: 'standalone',
        start_url: '/Chat_github/',
        icons: [
          {
            src: '/Chat_github/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/Chat_github/' : '/'
})