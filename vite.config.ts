import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Base URL for deployment - Portal is deployed at root (/)
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    force: true,
  },
  server: {
    host: true,
    port: 3049,
    strictPort: true,
    open: true,
    proxy: {
      '/solicitacao-de-viagem': {
        target: 'http://localhost:3029',
        changeOrigin: true,
      },
      '/calibracoes': {
        target: 'http://localhost:3039',
        changeOrigin: true,
      },
    },
  },
});

