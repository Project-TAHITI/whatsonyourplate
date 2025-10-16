import React from 'react';
import { render } from '@testing-library/react';
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
    const tbody = container.querySelector('tbody');
    expect(tbody?.children).toHaveLength(0);
  });
});
