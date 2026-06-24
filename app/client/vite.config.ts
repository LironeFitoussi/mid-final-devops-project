import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the API + health endpoints are proxied to the Express server on :8080.
// In the production image the Express server serves the built assets directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/healthz': 'http://localhost:8080',
      '/readyz': 'http://localhost:8080',
      '/version': 'http://localhost:8080',
    },
  },
  build: {
    outDir: 'dist',
  },
});
