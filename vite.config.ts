import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-utils': ['lucide-react', 'react-helmet-async', 'react-hot-toast'],
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  }
})