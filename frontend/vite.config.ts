import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/documents': 'http://127.0.0.1:8000',
      '/insights': 'http://127.0.0.1:8000',
      '/themes': 'http://127.0.0.1:8000',
      '/reports': 'http://127.0.0.1:8000',
    },
  },
})
