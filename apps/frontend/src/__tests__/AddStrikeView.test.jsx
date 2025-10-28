import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
let AddStrikeView;

// Silence logger to avoid stderr noise during error-path tests
vi.mock('../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@libs/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    match: vi.fn().mockResolvedValue({ error: null }),
  },
}));

vi.mock('../utils/telegramUtils.js', () => ({
  sendStrikeNotification: vi.fn().mockResolvedValue(true),
  sendStrikeSummaryReport: vi.fn().mockResolvedValue(true),
}));

// Mock AddStrike to expose and trigger onEdit from the test
vi.mock('../components/AddStrike.jsx', () => ({
  default: (props) => (
    <button data-testid="trigger-onedit" onClick={() => props.onEdit(globalThis.__mockInfo)}>
      trigger
    </button>
  ),
}));

describe('AddStrikeView', () => {
  beforeAll(async () => {
    // Ensure a fresh module graph so our mocks apply even when running full suite
    vi.resetModules();
    ({ default: AddStrikeView } = await import('../views/AddStrikeView.jsx'));
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders AddStrike component with user/goal data', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const { container } = render(
      <AddStrikeView
        data={data}
        usersMap={usersMap}
        setSnackbar={() => {}}
        refresh={{ run: () => {} }}
      />
    );
    // AddStrike itself is responsible for rendering forms; here we just assert it's present
    expect(container.querySelector('.add-strike') || container.textContent).toBeTruthy();
  });

  it('calls supabase update and sends Telegram messages on daily success', async () => {
    const { supabase } = await import('@libs/supabaseClient.js');
    const { sendStrikeNotification, sendStrikeSummaryReport } = await import(
      '../utils/telegramUtils.js'
    );
    // Arrange supabase success
    supabase.match.mockResolvedValueOnce({ error: null });

    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const setSnackbar = vi.fn();
    const refresh = { run: vi.fn() };

    // Provide daily onEdit info via mock button
    globalThis.__mockInfo = {
      user_id: 'u1',
      goalType: 'daily',
      date: '2025-10-16',
      goal: 'No Sugar',
      comments: 'Tough day',
    };

    render(
      <AddStrikeView data={data} usersMap={usersMap} setSnackbar={setSnackbar} refresh={refresh} />
    );

    fireEvent.click(screen.getByTestId('trigger-onedit'));

    // Assert DB update call chain
    expect(supabase.from).toHaveBeenCalledWith('daily_goal_tracker');
    expect(supabase.update).toHaveBeenCalledWith({ completed: false, comments: 'Tough day' });
    expect(supabase.match).toHaveBeenCalledWith({
      user_id: 'u1',
      date: '2025-10-16',
      goal: 'No Sugar',
    });

    // Snackbar success and refresh (async updates)
    await waitFor(() =>
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: 'Strike added!',
        severity: 'success',
      })
    );
    expect(refresh.run).toHaveBeenCalled();

    // Telegram notifications
    expect(sendStrikeNotification).toHaveBeenCalledWith({
      userName: 'Alice',
      goal: 'No Sugar',
      goalType: 'daily',
      date: '2025-10-16',
      comments: 'Tough day',
    });
    expect(sendStrikeSummaryReport).toHaveBeenCalledWith(data, usersMap);
  });

  it('handles weekly error path without sending Telegram', async () => {
    const { supabase } = await import('@libs/supabaseClient.js');
    const { sendStrikeNotification, sendStrikeSummaryReport } = await import(
      '../utils/telegramUtils.js'
    );
    // Arrange supabase failure
    supabase.match.mockResolvedValueOnce({ error: { message: 'boom' } });

    const data = [
      {
        user_id: 'u2',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u2: 'Bob' };
    const setSnackbar = vi.fn();
    const refresh = { run: vi.fn() };

    // Provide weekly onEdit info
    globalThis.__mockInfo = {
      user_id: 'u2',
      goalType: 'weekly',
      week: '2025-W42',
      goal: 'Gym',
      comments: '',
    };

    render(
      <AddStrikeView data={data} usersMap={usersMap} setSnackbar={setSnackbar} refresh={refresh} />
    );

    fireEvent.click(screen.getByTestId('trigger-onedit'));

    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_tracker');
    expect(supabase.update).toHaveBeenCalledWith({ completed: false, comments: '' });
    expect(supabase.match).toHaveBeenCalledWith({ user_id: 'u2', week: '2025-W42', goal: 'Gym' });

  // Snackbar shows error message (async)
  await waitFor(() => expect(setSnackbar).toHaveBeenCalled());
  const last = setSnackbar.mock.calls.at(-1)[0];
  expect(last.severity).toBe('error');
    // No refresh or telegram on error
    expect(refresh.run).not.toHaveBeenCalled();
    expect(sendStrikeNotification).not.toHaveBeenCalled();
    expect(sendStrikeSummaryReport).not.toHaveBeenCalled();
  });

  it('formats Date for daily, falls back to user_id, and does not require refresh', async () => {
    const { supabase } = await import('@libs/supabaseClient.js');
    const { sendStrikeNotification, sendStrikeSummaryReport } = await import(
      '../utils/telegramUtils.js'
    );
    // Ensure success
    supabase.match.mockResolvedValueOnce({ error: null });

    const data = [
      {
        user_id: 'u3',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    // usersMap missing entry -> fallback to user_id
    const usersMap = {};
    const setSnackbar = vi.fn();
    // Pass no refresh to cover optional chaining branch
    const refresh = undefined;

    // Provide daily info with Date instance
    globalThis.__mockInfo = {
      user_id: 'u3',
      goalType: 'daily',
      date: new Date('2025-10-17T12:34:56Z'),
      goal: 'Meditate',
      comments: 'note',
    };

    render(
      <AddStrikeView data={data} usersMap={usersMap} setSnackbar={setSnackbar} refresh={refresh} />
    );

    fireEvent.click(screen.getByTestId('trigger-onedit'));

    // Expect daily tracker with ISO date sliced
    expect(supabase.from).toHaveBeenCalledWith('daily_goal_tracker');
    expect(supabase.match).toHaveBeenCalledWith({
      user_id: 'u3',
      date: '2025-10-17',
      goal: 'Meditate',
    });

    // Snackbar success
    await waitFor(() =>
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: 'Strike added!',
        severity: 'success',
      })
    );

    // Telegram called with userName fallback (user_id) and formatted date
    expect(sendStrikeNotification).toHaveBeenCalledWith({
      userName: 'u3',
      goal: 'Meditate',
      goalType: 'daily',
      date: '2025-10-17',
      comments: 'note',
    });
    expect(sendStrikeSummaryReport).toHaveBeenCalledWith(data, usersMap);
  });

  it('handles weekly success and sends Telegram messages', async () => {
    const { supabase } = await import('@libs/supabaseClient.js');
    const { sendStrikeNotification, sendStrikeSummaryReport } = await import(
      '../utils/telegramUtils.js'
    );
    supabase.match.mockResolvedValueOnce({ error: null });

    const data = [
      {
        user_id: 'u4',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u4: 'Dora' };
    const setSnackbar = vi.fn();
    const refresh = { run: vi.fn() };

    globalThis.__mockInfo = {
      user_id: 'u4',
      goalType: 'weekly',
      week: '2025-W43',
      goal: 'Run',
      comments: 'easy',
    };

    render(
      <AddStrikeView data={data} usersMap={usersMap} setSnackbar={setSnackbar} refresh={refresh} />
    );

    fireEvent.click(screen.getByTestId('trigger-onedit'));

    await waitFor(() =>
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: 'Strike added!',
        severity: 'success',
      })
    );
    expect(refresh.run).toHaveBeenCalled();

    expect(sendStrikeNotification).toHaveBeenCalledWith({
      userName: 'Dora',
      goal: 'Run',
      goalType: 'weekly',
      date: '2025-W43',
      comments: 'easy',
    });
    expect(sendStrikeSummaryReport).toHaveBeenCalledWith(data, usersMap);
  });

  it('logs warnings when Telegram sends fail', async () => {
    const { supabase } = await import('@libs/supabaseClient.js');
    const { sendStrikeNotification, sendStrikeSummaryReport } = await import(
      '../utils/telegramUtils.js'
    );
    const log = (await import('../utils/logger')).default;
    supabase.match.mockResolvedValueOnce({ error: null });

    // Make both Telegram calls reject
    sendStrikeNotification.mockRejectedValueOnce(new Error('notify-fail'));
    sendStrikeSummaryReport.mockRejectedValueOnce(new Error('summary-fail'));

    const data = [
      { user_id: 'u5', daily_goals: {}, weekly_goals: {} },
    ];
    const usersMap = { u5: 'Eve' };
    const setSnackbar = vi.fn();

    globalThis.__mockInfo = {
      user_id: 'u5',
      goalType: 'daily',
      date: '2025-10-18',
      goal: 'Read',
      comments: '',
    };

    render(<AddStrikeView data={data} usersMap={usersMap} setSnackbar={setSnackbar} />);
    fireEvent.click(screen.getByTestId('trigger-onedit'));

    // Snackbar success still occurs
    await waitFor(() =>
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: 'Strike added!',
        severity: 'success',
      })
    );

    // Warn logs happen for both failed telegram promises
    await waitFor(() => expect(log.warn).toHaveBeenCalled());
    expect(log.warn.mock.calls.filter(([msg]) => String(msg).includes('Failed to send'))).toHaveLength(
      2
    );
  });
});
