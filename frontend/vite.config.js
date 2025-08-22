import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        // stability during backend restarts
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[vite-proxy] socket error:', err?.code || err?.message);
          });
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive');
          });
        },
        timeout: 60_000,
        proxyTimeout: 60_000,
      },
    },
  },
})
