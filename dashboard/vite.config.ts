import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works when served from a subpath
  // (deployed to /var/www/honeypot/, not a root domain).
  base: './',
  build: {
    rollupOptions: {
      output: {
        // Split heavy charting/mapping libs into their own cacheable chunks.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'recharts'
          if (id.includes('leaflet')) return 'leaflet'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          )
            return 'react'
          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      // During `npm run dev`, forward /api/* to the live honeypot backend.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
