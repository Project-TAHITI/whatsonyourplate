import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('logger', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...import.meta.env };
    // Clear module cache to get fresh logger instance
    vi.resetModules();
  });

  afterEach(() => {
    // Restore env
    Object.keys(import.meta.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete import.meta.env[key];
      }
    });
    Object.assign(import.meta.env, originalEnv);
    vi.resetModules();
  });

  it('exports a logger instance with standard log methods', async () => {
    const { default: log } = await import('../utils/logger.js');
    
    expect(log).toBeDefined();
    expect(typeof log.trace).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
  });

  it('sets debug level when DEBUG_MODE is true', async () => {
    import.meta.env.DEBUG_MODE = 'true';
    const { default: log } = await import('../utils/logger.js');
    
    expect(log.getLevel()).toBe(1); // 1 = debug level
  });

  it('sets debug level when VITE_DEBUG_MODE is true', async () => {
    import.meta.env.VITE_DEBUG_MODE = 'true';
    const { default: log } = await import('../utils/logger.js');
    
    expect(log.getLevel()).toBe(1); // 1 = debug level
  });

  it('sets warn level in production when DEBUG_MODE is false', async () => {
    import.meta.env.PROD = true;
    import.meta.env.DEBUG_MODE = '';
    import.meta.env.VITE_DEBUG_MODE = '';
    const { default: log } = await import('../utils/logger.js');
    
    expect(log.getLevel()).toBe(3); // 3 = warn level
  });

  it('sets info level in development when DEBUG_MODE is false', async () => {
    import.meta.env.PROD = false;
    import.meta.env.DEBUG_MODE = '';
    import.meta.env.VITE_DEBUG_MODE = '';
    const { default: log } = await import('../utils/logger.js');
    
    expect(log.getLevel()).toBe(2); // 2 = info level
  });
});
