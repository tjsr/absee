import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// import svgrPlugin from 'vite-plugin-svgr';
// import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  server: {
    port: 5175,
    proxy: {
      '/^/(login|logout|session|debugHeaders|submit).*': {
        changeOrigin: true,
        target: 'http://localhost:8283/(\\1)',
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
