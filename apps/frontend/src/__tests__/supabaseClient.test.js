// Mock the supabase-js client to avoid loading real network code/timers in tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: vi.fn() })),
  })),
}));

import { supabase } from '@libs/supabaseClient.js';

describe('supabaseClient singleton', () => {
  it('exports a supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('maintains singleton pattern by checking global', () => {
    // The singleton is stored in globalThis['__supabase__']
    const globalKey = '__supabase__';
    expect(globalThis[globalKey]).toBeDefined();
    expect(globalThis[globalKey]).toBe(supabase);
  });
});
