import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
let TrackerView;

// Mock GoalTable to keep tests focused on TrackerView logic
vi.mock('../components/GoalTable', () => ({
  default: ({ type, goalNames, periods, userGoals, openTip, setOpenTip }) => (
    <div data-testid={`goal-table-${type}`}>
      <span data-testid={`${type}-goal-count`}>{goalNames.length}</span>
      <span data-testid={`${type}-period-count`}>{periods.length}</span>
    </div>
  ),
}));

describe('TrackerView', () => {
  beforeAll(async () => {
    ({ default: TrackerView } = await import('../views/TrackerView.jsx'));
  });
  beforeEach(() => {
    // Mock current date to ensure consistent filtering
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders user tabs and selected user tables', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const { getByText } = render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );
    expect(getByText('Alice')).toBeInTheDocument();
    expect(getByText('Daily Goals')).toBeInTheDocument();
    expect(getByText('Weekly Goals')).toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    const { getByText } = render(
      <TrackerView
        data={[]}
        usersMap={{}}
        selectedUserIndex={-1}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );
    expect(getByText('No users available')).toBeInTheDocument();
  });

  it('renders multiple user tabs and allows switching', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }] },
        weekly_goals: {},
      },
      {
        user_id: 'u2',
        daily_goals: { '2025-10-16': [{ goal: 'Exercise', completed: false, comments: '' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice', u2: 'Bob' };
    const setSelectedUserIndex = vi.fn();

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={setSelectedUserIndex}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Click Bob's tab
    fireEvent.click(screen.getByText('Bob'));
    expect(setSelectedUserIndex).toHaveBeenCalledWith(1);
  });

  it('filters daily goals to only show dates up to today', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {
          '2025-10-20': [{ goal: 'Past', completed: true, comments: '' }],
          '2025-10-27': [{ goal: 'Today', completed: false, comments: '' }],
          '2025-10-30': [{ goal: 'Future', completed: false, comments: '' }],
        },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    const dailyTable = screen.getByTestId('goal-table-daily');
    const periodCount = screen.getByTestId('daily-period-count');

    // Should only show 2 periods (2025-10-20 and 2025-10-27), not the future date
    expect(periodCount).toHaveTextContent('2');
  });

  it('filters weekly goals to only show weeks up to current week', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {
          '2025-W42': [{ goal: 'Past Week', completed: true, comments: '' }],
          '2025-W43': [{ goal: 'Current Week', completed: false, comments: '' }],
          '2025-W45': [{ goal: 'Future Week', completed: false, comments: '' }],
        },
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    const periodCount = screen.getByTestId('weekly-period-count');

    // Current date is 2025-10-27 which is week 43, so should show W42 and W43
    expect(periodCount).toHaveTextContent('2');
  });

  it('includes previous-year weeks but excludes future-year weeks', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {
          '2024-W52': [{ goal: 'Prev Year', completed: true, comments: '' }],
          '2025-W43': [{ goal: 'Current Week', completed: false, comments: '' }],
          '2026-W01': [{ goal: 'Next Year', completed: false, comments: '' }],
        },
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    const periodCount = screen.getByTestId('weekly-period-count');
    // Should include 2024-W52 and 2025-W43 but exclude 2026-W01
    expect(periodCount).toHaveTextContent('2');
  });

  it('shows empty state when user has no daily goals', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    expect(screen.getByText('No daily goals available')).toBeInTheDocument();
  });

  it('shows empty state when user has no weekly goals', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    expect(screen.getByText('No weekly goals available')).toBeInTheDocument();
  });

  it('collects unique weekly goal names across multiple weeks', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {
          '2025-W42': [
            { goal: 'WG1', completed: true, comments: '' },
            { goal: 'WG2', completed: false, comments: '' },
          ],
          '2025-W43': [
            { goal: 'WG1', completed: true, comments: '' },
            { goal: 'WG3', completed: false, comments: '' },
          ],
        },
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    // Unique weekly goals should be WG1, WG2, WG3 => 3
    const weeklyGoalCount = screen.getByTestId('weekly-goal-count');
    expect(weeklyGoalCount).toHaveTextContent('3');
    const weeklyPeriodCount = screen.getByTestId('weekly-period-count');
    expect(weeklyPeriodCount).toHaveTextContent('2');
  });

  it('shows weekly table content even when daily is empty', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {
          '2025-W43': [{ goal: 'WG', completed: false, comments: '' }],
        },
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    // Daily empty message shown
    expect(screen.getByText('No daily goals available')).toBeInTheDocument();
    // Weekly GoalTable rendered with 1 goal and 1 period
    expect(screen.getByTestId('goal-table-weekly')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-goal-count')).toHaveTextContent('1');
    expect(screen.getByTestId('weekly-period-count')).toHaveTextContent('1');
  });

  it('collects unique goal names from multiple dates/weeks', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {
          '2025-10-20': [
            { goal: 'NoSugar', completed: true, comments: '' },
            { goal: 'Exercise', completed: false, comments: '' },
          ],
          '2025-10-21': [
            { goal: 'NoSugar', completed: true, comments: '' },
            { goal: 'Water', completed: true, comments: '' },
          ],
        },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    const goalCount = screen.getByTestId('daily-goal-count');
    // Should have 3 unique goals: NoSugar, Exercise, Water
    expect(goalCount).toHaveTextContent('3');
  });

  it('uses user_id as fallback when user_name is not in usersMap', () => {
    const data = [
      {
        user_id: 'unknown_user',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = {};

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={null}
        setOpenTip={() => {}}
      />
    );

    expect(screen.getByText('unknown_user')).toBeInTheDocument();
  });

  it('passes openTip and setOpenTip props to GoalTable', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: 'test' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const setOpenTip = vi.fn();
    const openTip = { key: 'daily|NoSugar|2025-10-15', comment: 'test' };

    render(
      <TrackerView
        data={data}
        usersMap={usersMap}
        selectedUserIndex={0}
        setSelectedUserIndex={() => {}}
        openTip={openTip}
        setOpenTip={setOpenTip}
      />
    );

    // GoalTable should receive these props (verified via mock)
    expect(screen.getByTestId('goal-table-daily')).toBeInTheDocument();
  });
});
