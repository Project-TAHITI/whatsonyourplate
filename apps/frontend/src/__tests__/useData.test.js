import { renderHook, act } from '@testing-library/react';
import { useData } from '../hooks/useData.js';

vi.mock('@libs/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    // Simulate .select().range().then()
    then: vi.fn(),
  },
}));

describe('useData', () => {
  it('should initialize with loading true and empty data', () => {
    const { result } = renderHook(() => useData());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.usersMap).toEqual({});
  });
  // More tests can be added for fetch success, error, refresh, etc.
});
