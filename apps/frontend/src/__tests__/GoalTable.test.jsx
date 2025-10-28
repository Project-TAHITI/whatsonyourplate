import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GoalTable from '../components/GoalTable.jsx';

const theme = createTheme();

describe('GoalTable', () => {
  it('renders rows for each goal and columns for each period', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={['No Sugar', 'Gym']}
          periods={['2025-10-15', '2025-10-16']}
          userGoals={{
            '2025-10-15': [{ goal: 'No Sugar', completed: true, comments: '' }],
            '2025-10-16': [{ goal: 'Gym', completed: false, comments: 'Skipped' }],
          }}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2); // two goals
  });

  it('shows ✔ for completed goals and ✗ for incomplete', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={['NoSugar']}
          periods={['2025-10-15', '2025-10-16']}
          userGoals={{
            '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }],
            '2025-10-16': [{ goal: 'NoSugar', completed: false, comments: '' }],
          }}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    const cells = container.querySelectorAll('td');
    expect(cells[0].textContent).toBe('✔');
    expect(cells[1].textContent).toBe('✗');
  });

  it('displays empty state when no goals are present', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={[]}
          periods={[]}
          userGoals={{}}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    // When no goals, GoalTable returns a message div instead of a table
    expect(container.textContent).toContain('No goals to display');
  });

  it('displays empty periods message when periods array is empty', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={['No Sugar']}
          periods={[]}
          userGoals={{}}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    expect(container.textContent).toContain('No periods to display');
  });

  it('renders weekly headers using getWeekRange', () => {
    // Mock getWeekRange to return a stable label
    vi.doMock('../utils/dateUtils', () => ({
      getWeekRange: () => '13Oct-19Oct',
    }));
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="weekly"
          goalNames={['Gym']}
          periods={['2025-W42']}
          userGoals={{ '2025-W42': [{ goal: 'Gym', completed: false, comments: '' }] }}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    const ths = container.querySelectorAll('thead th');
    expect(ths[1].textContent).toBe('13Oct-19Oct');
  });

  it('toggles comment tooltip on click and sets correct key', async () => {
    const setOpenTip = vi.fn();
    const goalName = 'NoSugar';
    const period = '2025-10-16';
    const tipKey = `daily|${goalName}|${period}`;
    const { container, rerender } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={[goalName]}
          periods={[period]}
          userGoals={{ [period]: [{ goal: goalName, completed: false, comments: 'Hello' }] }}
          openTip={null}
          setOpenTip={setOpenTip}
        />
      </ThemeProvider>
    );

    const cell = container.querySelector('tbody td');
    fireEvent.click(cell);
    expect(setOpenTip).toHaveBeenCalledWith({ key: tipKey, comment: 'Hello' });

    // When openTip is already this key, clicking should request to close (null)
    setOpenTip.mockClear();
    rerender(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={[goalName]}
          periods={[period]}
          userGoals={{ [period]: [{ goal: goalName, completed: false, comments: 'Hello' }] }}
          openTip={{ key: tipKey, comment: 'Hello' }}
          setOpenTip={setOpenTip}
        />
      </ThemeProvider>
    );
    const cell2 = container.querySelector('tbody td');
    fireEvent.click(cell2);
    expect(setOpenTip).toHaveBeenCalledWith(null);
  });

  it('applies cell-yes and cell-no classes based on completion', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <GoalTable
          type="daily"
          goalNames={['NoSugar']}
          periods={['2025-10-15', '2025-10-16']}
          userGoals={{
            '2025-10-15': [{ goal: 'NoSugar', completed: true, comments: '' }],
            '2025-10-16': [{ goal: 'NoSugar', completed: false, comments: '' }],
          }}
          openTip={null}
          setOpenTip={() => {}}
        />
      </ThemeProvider>
    );
    const cells = container.querySelectorAll('tbody td');
    expect(cells[0].className).toContain('cell-yes');
    expect(cells[1].className).toContain('cell-no');
  });
});
