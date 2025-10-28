import React from 'react';
import { render } from '@testing-library/react';
import SummaryView from '../views/SummaryView.jsx';

// Silence logger used inside StrikeSummary to avoid noisy stdout in CI
vi.mock('../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SummaryView', () => {
  it('renders StrikeSummary with correct props', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {},
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const { getByText } = render(<SummaryView data={data} usersMap={usersMap} />);
    expect(getByText('Alice')).toBeInTheDocument();
  });
});
