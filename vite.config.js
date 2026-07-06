import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
// base: используем VITE_BASE_URL из env, либо '/' (для Vercel/localhost)
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5013',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
