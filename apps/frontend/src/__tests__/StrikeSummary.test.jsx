import React from 'react';
import { render, screen } from '@testing-library/react';
import StrikeSummary from '../components/StrikeSummary.jsx';
import { tallyMarks, getStrikeCount } from '../utils/strikeUtils.jsx';
import log from '../utils/logger';

describe('StrikeSummary', () => {
  it('displays strike totals for each user', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'A', completed: false }] },
        weekly_goals: { '2025-W42': [{ goal: 'B', completed: false }] },
      },
      {
        user_id: 'u2',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice', u2: 'Bob' };
    const { getByText } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(getByText('Alice')).toBeInTheDocument();
    expect(getByText('Bob')).toBeInTheDocument();
    expect(getByText('2')).toBeInTheDocument(); // Alice: 2 strikes
    expect(getByText('0')).toBeInTheDocument(); // Bob: 0 strikes
  });

  it('highlights leader with crown when user has max strikes', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { d: [{ goal: 'A', completed: false }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Leader' };
    const { container } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const leaderCard = container.querySelector('.leader-strike-card');
    expect(leaderCard).toBeTruthy();
    const crown = container.querySelector('.crown-emoji');
    expect(crown).toBeTruthy();
  });

  it('renders empty state message when no data provided', () => {
    render(
      <StrikeSummary
        data={[]}
        usersMap={{}}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(screen.getByText('No strike data available')).toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    render(
      <StrikeSummary
        data={null}
        usersMap={{}}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(screen.getByText('No strike data available')).toBeInTheDocument();
  });

  it('renders empty state when data is not an array', () => {
    // @ts-expect-error testing non-array fallback
    render(
      <StrikeSummary
        data={{}}
        usersMap={{}}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(screen.getByText('No strike data available')).toBeInTheDocument();
  });

  it('highlights multiple leaders when tied for max strikes', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { d1: [{ goal: 'A', completed: false }] },
        weekly_goals: { w1: [{ goal: 'B', completed: false }] },
      },
      {
        user_id: 'u2',
        daily_goals: { d2: [{ goal: 'C', completed: false }] },
        weekly_goals: { w2: [{ goal: 'D', completed: false }] },
      },
      {
        user_id: 'u3',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice', u2: 'Bob', u3: 'Charlie' };
    const { container } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const leaderCards = container.querySelectorAll('.leader-strike-card');
    expect(leaderCards.length).toBe(2); // Alice and Bob both tied at 2 strikes
    const crowns = container.querySelectorAll('.crown-emoji');
    expect(crowns.length).toBe(2);
  });

  it('does not highlight leader when all users have 0 strikes', () => {
    const data = [
      { user_id: 'u1', daily_goals: {}, weekly_goals: {} },
      { user_id: 'u2', daily_goals: {}, weekly_goals: {} },
    ];
    const usersMap = { u1: 'Alice', u2: 'Bob' };
    const { container } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const leaderCard = container.querySelector('.leader-strike-card');
    expect(leaderCard).toBeFalsy();
    const crown = container.querySelector('.crown-emoji');
    expect(crown).toBeFalsy();
  });

  it('displays user_id as fallback when user not in usersMap', () => {
    const data = [
      {
        user_id: 'unknown_user',
        daily_goals: { d: [{ goal: 'A', completed: false }] },
        weekly_goals: {},
      },
    ];
    const usersMap = {};
    render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(screen.getByText('unknown_user')).toBeInTheDocument();
  });

  it('renders tally marks using the provided tallyMarks function', () => {
    const mockTallyMarks = vi.fn((num) => `${num} tallies`);
    const data = [
      {
        user_id: 'u1',
        daily_goals: { d: [{ goal: 'A', completed: false }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={mockTallyMarks}
      />
    );
    expect(mockTallyMarks).toHaveBeenCalledWith(1);
    expect(screen.getByText('1 tallies')).toBeInTheDocument();
  });

  it('uses custom getStrikeCount for calculating strikes and calls it for daily and weekly', () => {
    const mockGetStrikeCount = vi.fn(() => 5);
    const data = [
      { user_id: 'u1', daily_goals: { d: [{}] }, weekly_goals: { w: [{}] } },
    ];
    const usersMap = { u1: 'Alice' };
    render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={mockGetStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    // Called twice during summary calculation plus twice during render for the user
    expect(mockGetStrikeCount).toHaveBeenCalledTimes(4);
    expect(screen.getByText('10')).toBeInTheDocument(); // 5 daily + 5 weekly = 10
  });

  it('renders with correct Box class for styling', () => {
    const data = [
      { user_id: 'u1', daily_goals: {}, weekly_goals: {} },
    ];
    const usersMap = { u1: 'Alice' };
    const { container } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const box = container.querySelector('.strike-card');
    expect(box).toBeInTheDocument();
  });

  it('includes tooltip title with user name and strike count', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { d: [{ goal: 'A', completed: false }] },
        weekly_goals: { w: [{ goal: 'B', completed: false }] },
      },
    ];
    const usersMap = { u1: 'Alice' };
    const { container } = render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const box = container.querySelector('.strike-card');
    expect(box).toHaveProperty('title', 'Alice: 2 strikes');
  });

  it('renders crown with proper accessibility attributes', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: { d: [{ goal: 'A', completed: false }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Leader' };
    render(
      <StrikeSummary
        data={data}
        usersMap={usersMap}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    const crown = screen.getByRole('img', { name: /crown/i });
    expect(crown).toBeInTheDocument();
  });

  it('logs a warning when data is empty', () => {
    const warnSpy = vi.spyOn(log, 'warn');
    render(
      <StrikeSummary
        data={[]}
        usersMap={{}}
        getStrikeCount={getStrikeCount}
        tallyMarks={tallyMarks}
      />
    );
    expect(warnSpy).toHaveBeenCalledWith('StrikeSummary: No data provided or data is empty');
    warnSpy.mockRestore();
  });
});
