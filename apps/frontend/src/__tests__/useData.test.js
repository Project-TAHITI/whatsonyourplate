import { renderHook, act, waitFor } from '@testing-library/react';
import { useData } from '../hooks/useData.js';

// Global state used by the supabase mock to simulate different scenarios per test
const initialMockState = () => ({
  users: [],
  daily: [],
  weekly: [],
  userError: null,
  dailyError: null,
  weeklyError: null,
  usersDelayMs: 0,
});

// Install a programmable supabase mock that reads from globalThis.__supabaseMock
vi.mock('@libs/supabaseClient.js', () => {
  const supabase = {
    from: (table) => {
      const state = globalThis.__supabaseMock || {};
      if (table === 'users') {
        return {
          select: async () => {
            if (state.userError) return { data: null, error: state.userError };
            const delay = state.usersDelayMs || 0;
            if (delay > 0) await new Promise((r) => setTimeout(r, delay));
            return { data: state.users || [], error: null };
          },
        };
      }
      if (table === 'daily_goal_tracker') {
        return {
          select: (_cols, _opts) => {
            const total = state.dailyCount ?? (state.daily || []).length;
            return {
              range: async (from, to) => {
                if (state.dailyError) return { data: null, error: state.dailyError, count: total };
                const arr = state.daily || [];
                const slice = arr.slice(from, Math.min((to ?? arr.length - 1) + 1, arr.length));
                return { data: slice, error: null, count: total };
              },
            };
          },
        };
      }
      if (table === 'weekly_goal_tracker') {
        return {
          select: (_cols, _opts) => {
            const total = state.weeklyCount ?? (state.weekly || []).length;
            return {
              range: async (from, to) => {
                if (state.weeklyError) return { data: null, error: state.weeklyError, count: total };
                const arr = state.weekly || [];
                const slice = arr.slice(from, Math.min((to ?? arr.length - 1) + 1, arr.length));
                return { data: slice, error: null, count: total };
              },
            };
          },
        };
      }
      return { select: async () => ({ data: [], error: null }) };
    },
  };
  return { supabase };
});

describe('useData', () => {
  beforeEach(() => {
    vi.useRealTimers();
    globalThis.__supabaseMock = initialMockState();
  });

  it('initializes with loading true and empty data', () => {
    const { result } = renderHook(() => useData());
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.usersMap).toEqual({});
    expect(result.current.error).toBe('');
  });

  it('loads users and groups daily/weekly data on success', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [
      { user_id: 'u1', user_name: 'Alice' },
      { user_id: 'u2', user_name: '' },
    ];
    state.daily = [
      { user_id: 'u1', date: '2025-10-27', goal: 'G1', completed: false, comments: 'a' },
      { user_id: 'u1', date: '2025-10-27', goal: 'G2', completed: true, comments: 'b' },
      { user_id: 'u2', date: '2025-10-28', goal: 'H1', completed: false, comments: '' },
    ];
    state.weekly = [
      { user_id: 'u1', week: '2025-W44', goal: 'WG', completed: false, comments: 'w' },
    ];

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // usersMap should map to user_name or fallback to user_id
    expect(result.current.usersMap).toEqual({ u1: 'Alice', u2: 'u2' });

    // data grouped per user, dates/weeks as keys
    const forU1 = result.current.data.find((d) => d.user_id === 'u1');
    expect(forU1.daily_goals['2025-10-27']).toHaveLength(2);
    expect(forU1.weekly_goals['2025-W44']).toHaveLength(1);

    const forU2 = result.current.data.find((d) => d.user_id === 'u2');
    expect(forU2.daily_goals['2025-10-28']).toHaveLength(1);
  });

  it('sets error when any fetch fails and stops loading', async () => {
    const state = globalThis.__supabaseMock;
    state.userError = new Error('boom');

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Could not load tracker or user data');
    expect(result.current.data).toEqual([]);
    expect(result.current.usersMap).toEqual({});
  });

  it('exposes refresh.run() to re-fetch data', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    state.daily = [
      { user_id: 'u1', date: '2025-10-27', goal: 'G1', completed: false, comments: '' },
    ];

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update mock to simulate more data on refresh
    state.daily = [
      { user_id: 'u1', date: '2025-10-27', goal: 'G1', completed: false, comments: '' },
      { user_id: 'u1', date: '2025-10-28', goal: 'G2', completed: true, comments: '' },
    ];

    await act(async () => {
      await result.current.refresh.run();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const forU1 = result.current.data.find((d) => d.user_id === 'u1');
    expect(forU1.daily_goals['2025-10-28']).toHaveLength(1);
  });

  it('sets loadingTimeout after 10s and resets when loading finishes', async () => {
    vi.useFakeTimers();
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    state.usersDelayMs = 11000; // delay users fetch to trigger timeout

    const { result } = renderHook(() => useData());

    // Advance time to just after timeout threshold to trigger loadingTimeout
    await act(async () => {
      vi.advanceTimersByTime(10050);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.loadingTimeout).toBe(true);

    // Let the users request resolve (remaining ~950ms) and any follow-up effects settle
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    // Flush microtasks queued by resolved promises/state updates
    await Promise.resolve();
    await Promise.resolve();

    // Switch back to real timers so waitFor can poll
    vi.useRealTimers();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadingTimeout).toBe(false);
  });

  it('fetches daily data in batches when count exceeds page size', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    // Create 1200 daily rows for u1 on the same date so they group into a single array
    state.daily = Array.from({ length: 1200 }, (_, i) => ({
      user_id: 'u1',
      date: '2025-10-27',
      goal: `G${i}`,
      completed: i % 2 === 0,
      comments: '',
    }));
    state.dailyCount = 1200; // ensure hook keeps paging until all fetched

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const forU1 = result.current.data.find((d) => d.user_id === 'u1');
    expect(forU1.daily_goals['2025-10-27']).toHaveLength(1200);
  });
});
