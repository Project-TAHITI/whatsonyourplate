import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock date pickers to simplify interactions
vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <>{children}</>,
}));
vi.mock('@mui/x-date-pickers/DesktopDatePicker', () => ({
  DesktopDatePicker: ({ label, value, onChange, slotProps }) => (
    <input
      aria-label={slotProps?.textField?.inputProps?.['aria-label'] || 'Select date'}
      placeholder={label}
      value={value ? new Date(value).toISOString().slice(0, 10) : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
}));

import AddStrike from '../components/AddStrike.jsx';

const theme = createTheme();

function renderWithTheme(ui) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AddStrike', () => {
  it('disables Add Strike button until required fields are set (daily)', () => {
    const onEdit = vi.fn();
    renderWithTheme(
      <AddStrike
        users={[{ user_id: 'u1', user_name: 'Alice' }]}
        dailyGoals={{ u1: ['No Sugar'] }}
        weeklyGoals={{}}
        weeks={[]}
        onEdit={onEdit}
      />
    );
    const addBtn = screen.getByRole('button', { name: /add strike/i });
    expect(addBtn).toBeDisabled();

    // Select user
    fireEvent.mouseDown(screen.getByLabelText('Select user'));
    fireEvent.click(screen.getByText('Alice'));

    // Select goal
    fireEvent.mouseDown(screen.getByLabelText('Select goal'));
    fireEvent.click(screen.getByText('No Sugar'));

    // Select date
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2025-10-16' } });

    expect(addBtn).not.toBeDisabled();
  });

  it('submits daily strike with trimmed comments', () => {
    const onEdit = vi.fn();
    renderWithTheme(
      <AddStrike
        users={[{ user_id: 'u1', user_name: 'Alice' }]}
        dailyGoals={{ u1: ['No Sugar'] }}
        weeklyGoals={{}}
        weeks={[]}
        onEdit={onEdit}
      />
    );
    // User
    fireEvent.mouseDown(screen.getByLabelText('Select user'));
    fireEvent.click(screen.getByText('Alice'));
    // Goal
    fireEvent.mouseDown(screen.getByLabelText('Select goal'));
    fireEvent.click(screen.getByText('No Sugar'));
    // Date
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2025-10-16' } });
    // Comments (invalid chars should be filtered; allow comma, hyphen, apostrophe)
    const comments = screen.getByLabelText('Comments');
    fireEvent.change(comments, { target: { value: "  Hard day's, test!  " } });
    // '!' should be filtered out; spaces trimmed by component on submit

    fireEvent.click(screen.getByRole('button', { name: /add strike/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    const payload = onEdit.mock.calls[0][0];
    expect(payload).toMatchObject({
      user_id: 'u1',
      goalType: 'daily',
      goal: 'No Sugar',
      comments: "Hard day's, test",
    });
    // date is a Date object for daily
    expect(payload.date instanceof Date).toBe(true);
    expect(payload.week).toBeUndefined();
  });

  it('switching to weekly uses week selection and resets selected goal', () => {
    const onEdit = vi.fn();
    renderWithTheme(
      <AddStrike
        users={[{ user_id: 'u1', user_name: 'Alice' }]}
        dailyGoals={{ u1: ['No Sugar'] }}
        weeklyGoals={{ u1: ['Gym'] }}
        weeks={['2025-W42']}
        onEdit={onEdit}
      />
    );

    // Select user
    fireEvent.mouseDown(screen.getByLabelText('Select user'));
    fireEvent.click(screen.getByText('Alice'));

    // Select a daily goal first
    fireEvent.mouseDown(screen.getByLabelText('Select goal'));
    fireEvent.click(screen.getByText('No Sugar'));

    // Switch to weekly
    fireEvent.click(screen.getByLabelText('Weekly'));

    // Goal should be reset; open goal select and pick weekly goal
    fireEvent.mouseDown(screen.getByLabelText('Select goal'));
    fireEvent.click(screen.getByText('Gym'));

    // Select week
    fireEvent.mouseDown(screen.getByLabelText('Select week'));
    fireEvent.click(screen.getByText(/2025-W42/));

    // Button enabled now
    const addBtn = screen.getByRole('button', { name: /add strike/i });
    expect(addBtn).not.toBeDisabled();

    fireEvent.click(addBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    const payload = onEdit.mock.calls[0][0];
    expect(payload).toMatchObject({
      user_id: 'u1',
      goalType: 'weekly',
      goal: 'Gym',
      week: '2025-W42',
    });
    expect(payload.date).toBeUndefined();
  });
});
