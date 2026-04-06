import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite configuration for DevMate frontend.
 *
 * Dev server proxy:
 *   /api  →  http://localhost:5000
 *   Keeps the browser on the same origin so CORS is never an issue in dev.
 *   VITE_API_URL is intentionally NOT used as the proxy target here —
 *   it is only read at runtime by api.js for production builds.
 *
 * Production (Vercel):
 *   No proxy runs. api.js reads VITE_API_URL from Vercel env vars and
 *   makes direct requests to https://devmate-project.onrender.com/api.
 *   Set VITE_API_URL in Vercel → Project Settings → Environment Variables.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
