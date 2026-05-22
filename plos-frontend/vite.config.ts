import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // When VITE_API_BASE_URL is unset, `api.ts` calls same-origin `/api/*` which lands here.
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  /** Same `/api` → backend routing as dev, so production bundles work under `vite preview` on localhost. */
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  // @react-three/drei marks react-dom as an optional peer dep, which causes
  // Vite to generate a "could not resolve" shim. Force-include the real
  // module so Html / ScrollControls work at runtime and in production.
  optimizeDeps: {
    include: ['react-dom', 'react-dom/client'],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
