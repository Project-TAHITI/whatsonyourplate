import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@libs': path.resolve(__dirname, '../../libs'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest.setup.js'],
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    css: false,
  // Force a single worker thread on Windows to avoid hangs/timeouts
  pool: 'threads',
  poolOptions: { threads: { singleThread: true } },
  // Keep test files isolated to prevent cross-file module cache and mock bleed
  isolate: true,
  testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/__tests__/**', 'src/main.jsx', 'src/**/*.test.{js,jsx}'],
    },
  },
});
