import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  // Default dev proxy to point API calls at local backend (AI or storage)
  // Use environment variable VITE_API_URL in prod or set to '' in host env
  const proxyTarget = 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy /api/* to local backend when running `npm run dev` to avoid CORS
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path // keep /api as-is
        }
      }
    }
  }
})
