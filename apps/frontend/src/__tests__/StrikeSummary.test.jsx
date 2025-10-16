import React from 'react';
import { render } from '@testing-library/react';
import StrikeSummary from '../components/StrikeSummary.jsx';
import { tallyMarks, getStrikeCount } from '../utils/strikeUtils.jsx';

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
});
