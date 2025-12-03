import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tailwind()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            gsap: ['gsap'],
            socketio: ['socket.io-client'],
          },
        },
      },
      // CDN support for static assets
      assetsDir: 'assets',
      // Enable asset optimization (using esbuild - faster and default)
      minify: 'esbuild',
    },
    // Base path for CDN (can be overridden by env)
    base: env.VITE_BASE_URL || '/',
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
  };
});
