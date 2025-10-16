import React from 'react';
import { render } from '@testing-library/react';
import SummaryView from '../views/SummaryView.jsx';

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
