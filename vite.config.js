import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/request_proxy': {
        target: 'https://api.seomonitor.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/request_proxy/, ''),
      },
    },
  },
})
