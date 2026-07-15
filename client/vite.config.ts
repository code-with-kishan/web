/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Dev proxy target: the local API server. */
const API_PROXY_TARGET = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // No production source maps: original source stays out of the live bundle.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the router/runtime vendor bundle from app code so the initial
        // route ships less JavaScript.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': API_PROXY_TARGET,
      '/healthz': API_PROXY_TARGET,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx is the DOM bootstrap; api-types.ts holds only type
      // declarations (no executable code to cover).
      exclude: ['src/main.tsx', 'src/lib/api-types.ts', 'src/vite-env.d.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
});
