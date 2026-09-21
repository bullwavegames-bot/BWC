import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api/otp': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
  '/api': {
    target: 'https://bullwavegames.onrender.com',
    changeOrigin: true,
  },
}

export default defineConfig({
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
})
