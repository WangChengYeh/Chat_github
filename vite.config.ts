import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Avoid terser/minify issues in some environments
      minify: false,
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/Chat_github/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        skipWaiting: true,
        clientsClaim: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'maskable-icon-512x512.png', 'masked-icon.svg'],
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
            src: '/Chat_github/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/Chat_github/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/Chat_github/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/Chat_github/' : '/'
})
