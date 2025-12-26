import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    // Only enable SSL if HTTPS env var is set
    ...(process.env.VITE_HTTPS === 'true' ? [basicSsl()] : []),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2}'],
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
  server: {
    https: process.env.VITE_HTTPS === 'true',
    host: '0.0.0.0',
    port: process.env.VITE_HTTPS === 'true' ? 5174 : 5173
  },
  test: {
    environment: 'node',
    globals: true,
  },
  worker: {
    format: 'es',
  },
})
