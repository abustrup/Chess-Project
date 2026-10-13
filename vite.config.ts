import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the built site working from any folder (GitHub Pages, a USB stick, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 1500 },
})
