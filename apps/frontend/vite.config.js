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
  // Give CI a bit more breathing room
  testTimeout: process.env.CI ? 60000 : 30000,
  hookTimeout: process.env.CI ? 30000 : 15000,
  // A tiny retry can smooth out rare, non-deterministic flake in CI without masking real issues
  retry: process.env.CI ? 1 : 0,
  ci: process.env.CI === 'true',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/__tests__/**', 'src/main.jsx', 'src/**/*.test.{js,jsx}'],
    },
  },
});
