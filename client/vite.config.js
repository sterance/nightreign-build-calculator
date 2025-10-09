import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{png,jpg,jpeg,svg,ico}'],
        runtimeCaching: [{
          urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        }]
      }
    })
  ],
  test: {
    environment: 'node',
    globals: true,
  },
  worker: {
    format: 'es',
  },
})