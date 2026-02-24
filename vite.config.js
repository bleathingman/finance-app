import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',

      // Active le SW en dev aussi pour tester
      devOptions: { enabled: false },

      // Fichiers à mettre en cache dès l'install
      workbox: {
        skipWaiting: false,      // on gère manuellement via SKIP_WAITING
        clientsClaim: true,      // le nouveau SW prend le contrôle immédiatement après activation
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Cache Firestore + Google Fonts en réseau d'abord
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },

      // Manifest de l'app
      manifest: {
        name: 'FinanceFlow',
        short_name: 'FinanceFlow',
        description: 'Gérez vos finances personnelles intelligemment',
        theme_color: '#0c0e14',
        background_color: '#0c0e14',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Ajouter une dépense',
            short_name: 'Dépense',
            url: '/depenses',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Ajouter un revenu',
            short_name: 'Revenu',
            url: '/revenus',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            url: '/',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  }
})
