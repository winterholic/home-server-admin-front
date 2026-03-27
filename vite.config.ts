import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = 'https://homeops-api.winterholic.net'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __API_BASE_URL__: JSON.stringify(command === 'serve' ? '/api' : `${API_TARGET}/api`),
  },
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
}))
