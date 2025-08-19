import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: (() => {
    // Build timestamp in Asia/Taipei (UTC+8), minute precision
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date())
      const get = (type: string) => parts.find(p => p.type === type)?.value || '00'
      const yyyy = get('year')
      const mm = get('month')
      const dd = get('day')
      const hh = get('hour')
      const mi = get('minute')
      const friendly = `${yyyy}-${mm}-${dd} ${hh}:${mi} Taipei`
      return { __BUILD_TIME__: JSON.stringify(friendly) }
    } catch {
      // Fallback to UTC if Intl is unavailable
      const d = new Date()
      const yyyy = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mi = String(d.getUTCMinutes()).padStart(2, '0')
      const friendly = `${yyyy}-${mm}-${dd} ${hh}:${mi} Taipei`
      return { __BUILD_TIME__: JSON.stringify(friendly) }
    }
  })(),
  plugins: [
    react(),
    VitePWA({
      // Avoid terser/minify issues in some environments
      minify: false,
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/Chat_github/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              plugins: [
                {
                  handlerDidError: async () => {
                    return await caches.match('/Chat_github/offline.html')
                  }
                }
              ]
            }
          }
        ]
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
