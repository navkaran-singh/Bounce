import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'unmodulative-jeremy-alpinely.ngrok-free.dev'
      ],
      proxy: {
        '/.netlify/functions': 'http://localhost:8888'
      },
    },
    plugins: [react()],
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