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
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        skipWaiting: true,
        clientsClaim: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Phone AI + GitHub',
        short_name: 'Chat GitHub',
        description: 'Mobile-First AI CLI & Text Editor for GitHub',
        theme_color: '#000000',
        background_color: '#000000',
        scope: '/Chat_github/',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/Chat_github/',
        categories: ['developer', 'productivity', 'utilities'],
        lang: 'zh-TW',
        prefer_related_applications: false,
        icons: [
          {
            src: '/Chat_github/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/Chat_github/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/Chat_github/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/Chat_github/' : '/'
})