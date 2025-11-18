import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';

// Normalize timezone to make date-related tests deterministic across CI/local
process.env.TZ = process.env.TZ || 'UTC';

// Optional: global fetch mock if needed
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

// Silence console errors for React act warnings in tests if any
const error = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  error(...args);
};
