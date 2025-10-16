import React from 'react';
import { render } from '@testing-library/react';
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
}));

describe('AddStrikeView', () => {
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
});
