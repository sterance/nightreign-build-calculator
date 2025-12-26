import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(async () => {
  let basicSsl = null
  if (process.env.VITE_HTTPS === 'true') {
    try {
      const sslModule = await import('@vitejs/plugin-basic-ssl')
      basicSsl = sslModule.default
    } catch (e) {
      console.warn('@vitejs/plugin-basic-ssl not available, HTTPS disabled')
    }
  }

  return {
    base: process.env.VITE_BASE || '/',
    plugins: [
      ...(process.env.VITE_HTTPS === 'true' && basicSsl ? [basicSsl()] : []),
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
  }
})
