import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode: _mode }) => ({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/pages',
      generatedRouteTree: './src/app/router/routeTree.gen.ts',
    }),
    react(),
    // Bundle analysis — run with ANALYZE=true pnpm build
    ...(process.env.ANALYZE === 'true'
      ? [
          import('rollup-plugin-visualizer').then((m) =>
            m.visualizer({ open: true, filename: 'dist/bundle-stats.html', gzipSize: true }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
}));
