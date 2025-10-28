import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock MUI Select and MenuItem for reliable jsdom interactions
vi.mock('@mui/material/Select', () => ({
  default: ({ label, value, onChange, children, inputProps = {}, ...props }) => (
    <select
      aria-label={inputProps['aria-label'] || props['aria-label'] || label}
      value={value ?? ''}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
      disabled={props.disabled}
    >
      <option value=""></option>
      {children}
    </select>
  ),
}));
vi.mock('@mui/material/MenuItem', () => ({
  default: ({ value, children, disabled }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}));

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
  it('disables Add Strike button until required fields are set (daily)', async () => {
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
    const userSelect = screen.getByLabelText('Select user');
    fireEvent.change(userSelect, { target: { value: 'u1' } });

    // Select goal
    const goalSelect = screen.getByLabelText('Select goal');
    fireEvent.change(goalSelect, { target: { value: 'No Sugar' } });

    // Select date
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2025-10-16' } });

    await waitFor(() => expect(addBtn).not.toBeDisabled());
  });

  it('submits daily strike with trimmed comments', async () => {
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
    const userSelect = screen.getByLabelText('Select user');
    fireEvent.change(userSelect, { target: { value: 'u1' } });
    // Goal
    const goalSelect = screen.getByLabelText('Select goal');
    fireEvent.change(goalSelect, { target: { value: 'No Sugar' } });
    // Date
    const dateInput = screen.getByLabelText('Select date');
    fireEvent.change(dateInput, { target: { value: '2025-10-16' } });
    // Comments (invalid chars should be filtered; allow comma, hyphen, apostrophe)
    const comments = screen.getByLabelText('Comments');
    fireEvent.change(comments, { target: { value: "  Hard day's, test!  " } });
    // '!' should be filtered out; spaces trimmed by component on submit

  const addBtn = screen.getByRole('button', { name: /add strike/i });
  await waitFor(() => expect(addBtn).not.toBeDisabled());
  fireEvent.click(addBtn);

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

  it('switching to weekly uses week selection and resets selected goal', async () => {
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
    const userSelect = screen.getByLabelText('Select user');
    fireEvent.change(userSelect, { target: { value: 'u1' } });

    // Select a daily goal first
    const goalSelect1 = screen.getByLabelText('Select goal');
    fireEvent.change(goalSelect1, { target: { value: 'No Sugar' } });

    // Switch to weekly
    fireEvent.click(screen.getByLabelText('Weekly'));

    // Goal should be reset; open goal select and pick weekly goal
    const goalSelect2 = screen.getByLabelText('Select goal');
    fireEvent.change(goalSelect2, { target: { value: 'Gym' } });

    // Select week
    const weekSelect = screen.getByLabelText('Select week');
    fireEvent.change(weekSelect, { target: { value: '2025-W42' } });

    // Button enabled now
    const addBtn = screen.getByRole('button', { name: /add strike/i });
    await waitFor(() => expect(addBtn).not.toBeDisabled());

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
