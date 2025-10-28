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
                if (state.dailyReturnNull) return { data: null, error: null, count: total };
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
                if (state.weeklyError)
                  return { data: null, error: state.weeklyError, count: total };
                if (state.weeklyReturnNull) return { data: null, error: null, count: total };
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

  it('initializes with loading true and empty data', async () => {
    const { result } = renderHook(() => useData());
    // Assert initial state immediately after mount
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.usersMap).toEqual({});
    expect(result.current.error).toBe('');

    // Wait for the async effect to settle to avoid act warnings
    await waitFor(() => expect(result.current.loading).toBe(false));
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

  it('fetches weekly data in batches when count exceeds page size', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    state.weekly = Array.from({ length: 1500 }, (_, i) => ({
      user_id: 'u1',
      week: '2025-W44',
      goal: `WG${i}`,
      completed: i % 2 === 0,
      comments: '',
    }));
    state.weeklyCount = 1500;

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const forU1 = result.current.data.find((d) => d.user_id === 'u1');
    expect(forU1.weekly_goals['2025-W44']).toHaveLength(1500);
  });

  it('handles null count (no exact count) by fetching first page only', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    // Provide some rows but set count to null to exercise branch
    state.daily = [
      { user_id: 'u1', date: '2025-10-27', goal: 'G1', completed: false, comments: '' },
      { user_id: 'u1', date: '2025-10-27', goal: 'G2', completed: true, comments: '' },
    ];
    state.dailyCount = null;
    state.weekly = [
      { user_id: 'u1', week: '2025-W44', goal: 'W1', completed: false, comments: '' },
    ];
    state.weeklyCount = null;

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const forU1 = result.current.data.find((d) => d.user_id === 'u1');
    expect(forU1.daily_goals['2025-10-27']).toHaveLength(2);
    expect(forU1.weekly_goals['2025-W44']).toHaveLength(1);
  });

  it('handles zero count (no rows) by doing a single request and exiting', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    state.daily = []; // no rows
    state.dailyCount = 0; // explicit zero triggers do-while once then exit
    state.weekly = [];
    state.weeklyCount = 0;

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should produce user entry with empty goal maps
    expect(result.current.data).toHaveLength(1);
    const forU1 = result.current.data[0];
    expect(forU1.daily_goals).toEqual({});
    expect(forU1.weekly_goals).toEqual({});
  });

  it('treats null daily/weekly batches as no-op (if batch falsy branch)', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    // Configure mock to return null for both daily and weekly batches
    state.dailyReturnNull = true;
    state.dailyCount = 0; // do-while executes once
    state.weeklyReturnNull = true;
    state.weeklyCount = 0;

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // No crashes and empty grouped data
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].daily_goals).toEqual({});
    expect(result.current.data[0].weekly_goals).toEqual({});
  });

  it('cleans up timeout when unmounted during loading (no lingering timers)', async () => {
    vi.useFakeTimers();
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    // Delay long enough so component stays in loading
    state.usersDelayMs = 20000;

    const clearSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useData());

    // Let some time pass but below the 10s threshold
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Unmount while still loading -> cleanup path in effect should run and clearTimeout called
    unmount();
    expect(clearSpy).toHaveBeenCalled();

    // Even if we advance time beyond the threshold, there should be no updates (component is unmounted)
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    vi.useRealTimers();
    clearSpy.mockRestore();
  });

  it('does not set loadingTimeout if load completes before threshold', async () => {
    vi.useFakeTimers();
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    // Quick fetch under the 10s threshold
    state.usersDelayMs = 1000;

    const { result } = renderHook(() => useData());

    // Advance beyond the fetch delay but below threshold at first
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Switch back to real timers so waitFor can poll resolved promises
    vi.useRealTimers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadingTimeout).toBe(false);
  });

  it('sets error when daily or weekly fetch fails', async () => {
    const state = globalThis.__supabaseMock;
    state.users = [{ user_id: 'u1', user_name: 'Alice' }];
    state.dailyError = new Error('daily failed');

    const { result } = renderHook(() => useData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Could not load tracker or user data');
    // Now try weekly error path
    globalThis.__supabaseMock = initialMockState();
    const st2 = globalThis.__supabaseMock;
    st2.users = [{ user_id: 'u1', user_name: 'Alice' }];
    st2.weeklyError = new Error('weekly failed');
    const { result: result2 } = renderHook(() => useData());
    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.error).toBe('Could not load tracker or user data');
  });
});
