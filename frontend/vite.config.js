import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, resolve(root, '..'), ''),
    ...loadEnv(mode, root, ''),
  }
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
