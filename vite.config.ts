import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'unmodulative-jeremy-alpinely.ngrok-free.dev',
        'calm-kids-prove.loca.lt',
        'eligibility-television-soa-cbs.trycloudflare.com',
      ],
      proxy: {
        '/.netlify/functions': 'http://localhost:8888'
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        // Use existing manifest.json from public folder
        manifest: false,
        workbox: {
          // Precache all JS, CSS, and HTML
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Don't cache API calls
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/.netlify/, /^\/api/],
          // Runtime caching for external resources
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
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore'
            ],
            'vendor-ui': ['framer-motion', 'lucide-react'],
            'vendor-capacitor': [
              '@capacitor/app',
              '@capacitor/preferences',
              '@capacitor/status-bar'
            ]
          }
        }
      },
      // Increase warning threshold since we're chunking vendors
      chunkSizeWarningLimit: 600
    }
  };
});