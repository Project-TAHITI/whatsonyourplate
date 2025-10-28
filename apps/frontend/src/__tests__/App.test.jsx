import React from 'react';
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';

// Mock child views to keep App tests focused on wiring/flows
vi.mock('../views/SummaryView.jsx', () => ({
  default: ({ data, usersMap }) => (
    <div data-testid="summary-view">Summary {Object.keys(usersMap || {}).length}</div>
  ),
}));
vi.mock('../views/TrackerView.jsx', () => ({
  default: () => <div data-testid="tracker-view">Tracker</div>,
}));
vi.mock('../views/AddStrikeView.jsx', () => ({
  default: ({ setSnackbar }) => (
    <div data-testid="addstrike-view">
      AddStrike
      <button
        type="button"
        onClick={() =>
          setSnackbar({ open: true, message: 'Strike added!', severity: 'success' })
        }
      >
        Trigger Snackbar
      </button>
    </div>
  ),
}));
// Mock ThemeToggleButton to a simple button
vi.mock('../components/ui/ThemeToggleButton.jsx', () => ({
  default: ({ onToggle }) => (
    <button aria-label="Toggle Theme" onClick={onToggle}>
      Toggle
    </button>
  ),
}));
// Mock AdminDialog to expose open state via role
vi.mock('../components/AdminDialog.jsx', () => ({
  default: ({ open, onClose, onApproved }) =>
    open ? (
      <div role="dialog" aria-label="Admin Dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={onApproved}>Approve</button>
      </div>
    ) : null,
}));

// Programmable mock for useData
const setUseDataState = (state) => {
  globalThis.__useDataState = state;
};
vi.mock('../hooks/useData.js', () => ({
  useData: () =>
    globalThis.__useDataState || {
      data: [],
      usersMap: {},
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    },
}));

import App from '../App.jsx';

describe('App', () => {
  beforeEach(() => {
    setUseDataState({
      data: [],
      usersMap: {},
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });
    // Ensure localStorage doesn't throw
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => null);
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading UI and timeout warning when loading and loadingTimeout', () => {
    setUseDataState({
      data: [],
      usersMap: {},
      error: '',
      loading: true,
      loadingTimeout: true,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    expect(screen.getByLabelText(/loading data/i)).toBeInTheDocument();
    expect(screen.getByText(/loading\.{3}/i)).toBeInTheDocument();
    expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
  });

  it('renders error alert when hook returns error', () => {
    setUseDataState({
      data: [],
      usersMap: {},
      error: 'Boom',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.queryByTestId('summary-view')).not.toBeInTheDocument();
  });

  it('renders summary by default and opens AdminDialog when Add Strike tab clicked', () => {
    setUseDataState({
      data: [{ user_id: 'u1', daily_goals: {}, weekly_goals: {} }],
      usersMap: { u1: 'Alice' },
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);
    // Tabs are present
    expect(screen.getByRole('button', { name: /summary tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tracker tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add strike tab/i })).toBeInTheDocument();

    // Summary view rendered
    expect(screen.getByTestId('summary-view')).toBeInTheDocument();

    // Click Add Strike tab -> AdminDialog should open
    fireEvent.click(screen.getByRole('button', { name: /add strike tab/i }));
    expect(screen.getByRole('dialog', { name: /admin dialog/i })).toBeInTheDocument();
  });

  it('approving AdminDialog switches to AddStrike view', () => {
    setUseDataState({
      data: [{ user_id: 'u1', daily_goals: {}, weekly_goals: {} }],
      usersMap: { u1: 'Alice' },
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    // Click Add Strike tab to open dialog
    fireEvent.click(screen.getByRole('button', { name: /add strike tab/i }));
    const dialog = screen.getByRole('dialog', { name: /admin dialog/i });

    // Approve the dialog
    const approveBtn = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveBtn);

    // Dialog should close and AddStrike view should render
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('addstrike-view')).toBeInTheDocument();
  });

  it('closing AdminDialog returns to summary view', () => {
    setUseDataState({
      data: [{ user_id: 'u1', daily_goals: {}, weekly_goals: {} }],
      usersMap: { u1: 'Alice' },
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    // Click Add Strike tab to open dialog
    fireEvent.click(screen.getByRole('button', { name: /add strike tab/i }));
    expect(screen.getByRole('dialog', { name: /admin dialog/i })).toBeInTheDocument();

    // Close without approving
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    // Dialog should close and return to summary
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('summary-view')).toBeInTheDocument();
  });

  it('switches to tracker view when Tracker tab clicked', () => {
    setUseDataState({
      data: [{ user_id: 'u1', daily_goals: {}, weekly_goals: {} }],
      usersMap: { u1: 'Alice' },
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    // Click Tracker tab
    fireEvent.click(screen.getByRole('button', { name: /tracker tab/i }));

    // Tracker view should render
    expect(screen.getByTestId('tracker-view')).toBeInTheDocument();
    expect(screen.queryByTestId('summary-view')).not.toBeInTheDocument();
  });

  it('initializes light mode from localStorage and toggles to dark, updating body classes and storage', () => {
    // Make initial theme light
    const getSpy = vi
      .spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation((key) => (key === 'themeMode' ? 'light' : null));
    const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');

    setUseDataState({
      data: [],
      usersMap: {},
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    // Body gets light-theme class
    expect(document.body.classList.contains('light-theme')).toBe(true);
    expect(document.body.classList.contains('dark-theme')).toBe(false);

    // Toggle to dark
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    // localStorage updated to dark
    expect(setSpy).toHaveBeenCalledWith('themeMode', 'dark');

    // Body classes flip
    expect(document.body.classList.contains('dark-theme')).toBe(true);
    expect(document.body.classList.contains('light-theme')).toBe(false);

    getSpy.mockRestore();
    setSpy.mockRestore();
  });

  it('opens snackbar from AddStrikeView and closes via Alert close button', async () => {
    setUseDataState({
      data: [{ user_id: 'u1', daily_goals: {}, weekly_goals: {} }],
      usersMap: { u1: 'Alice' },
      error: '',
      loading: false,
      loadingTimeout: false,
      refresh: { run: vi.fn() },
    });

    render(<App />);

    // Open Admin dialog by clicking Add Strike tab
    fireEvent.click(screen.getByRole('button', { name: /add strike tab/i }));
    // Approve to navigate into AddStrike view
    fireEvent.click(screen.getByRole('button', { name: /approve/i }));
    expect(screen.getByTestId('addstrike-view')).toBeInTheDocument();

    // Trigger snackbar from inside AddStrikeView mock
    fireEvent.click(screen.getByRole('button', { name: /trigger snackbar/i }));

    // Snackbar shows success message
    const msg = screen.getByText('Strike added!');
    expect(msg).toBeInTheDocument();

    // Click the Alert close button (aria-label="close") if present
    const closeBtn = screen.queryByRole('button', { name: /close/i });
    if (closeBtn) {
      fireEvent.click(closeBtn);
    }

    // Wait for the snackbar content to be removed from the DOM
    await waitForElementToBeRemoved(() => screen.queryByText('Strike added!'));
  });
});
