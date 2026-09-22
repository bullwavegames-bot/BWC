import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = (env.VITE_API_URL || 'https://bwc-wgbu.onrender.com').replace(/\/$/, '')
  const proxy = {
    '/api': {
      target: api,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  }
})
