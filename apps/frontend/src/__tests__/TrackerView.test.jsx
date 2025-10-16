import React from 'react';
import { render } from '@testing-library/react';
import TrackerView from '../views/TrackerView.jsx';

describe('TrackerView', () => {
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
});
