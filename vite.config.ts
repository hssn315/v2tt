
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/iotype': {
        target: 'https://www.iotype.com/developer',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iotype/, '')
      }
    }
  }
});
