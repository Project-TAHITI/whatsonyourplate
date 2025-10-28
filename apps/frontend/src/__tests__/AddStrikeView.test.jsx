import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AddStrikeView from '../views/AddStrikeView.jsx';

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

    // Snackbar success and refresh
    // allow pending promises to flush
    await Promise.resolve();
    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Strike added!',
      severity: 'success',
    });
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

    // allow pending promises to flush
    await Promise.resolve();
    expect(setSnackbar).toHaveBeenCalled();
    const last = setSnackbar.mock.calls.at(-1)[0];
    expect(last.severity).toBe('error');
    // No refresh or telegram on error
    expect(refresh.run).not.toHaveBeenCalled();
    expect(sendStrikeNotification).not.toHaveBeenCalled();
    expect(sendStrikeSummaryReport).not.toHaveBeenCalled();
  });
});
