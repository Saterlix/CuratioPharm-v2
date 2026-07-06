import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/CuratioPharm-v2/',
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
