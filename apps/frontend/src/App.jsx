import React, { useEffect, useState } from 'react';
import log from './utils/logger';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { COMIC_FONT_FAMILY } from './constants/fonts';
import SummaryView from './views/SummaryView.jsx';
import TrackerView from './views/TrackerView.jsx';
import AddStrikeView from './views/AddStrikeView.jsx';
import { useData } from './hooks/useData.js';
import ThemeToggleButton from './components/ui/ThemeToggleButton.jsx';
import AdminDialog from './components/AdminDialog.jsx';
import './index.css';

function App() {
  // Log app mount
  useEffect(() => {
    log.debug('App mounted');
    return () => log.debug('App unmounted');
  }, []);
  const { data, usersMap, error, loading, loadingTimeout, refresh } = useData();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [openTip, setOpenTip] = useState(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  // Admin dialog state (must be before any return)
  const [adminOpen, setAdminOpen] = useState(false);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const next = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', next);
          return next;
        });
      },
    }),
    []
  );
  const theme = React.useMemo(() => {
    let palette = {};
    if (mode === 'dark') {
      palette = {
        mode: 'dark',
        background: {
          default: '#181825',
          paper: '#232336',
        },
        primary: { main: '#a855f7' },
        secondary: { main: '#f59e42' },
        text: { primary: '#f3e8ff' },
        divider: '#3a3a4d',
        success: { main: '#2e7d32', light: '#388e3c', dark: '#b9f6ca' },
        error: { main: '#b71c1c', light: '#ff8a80', dark: '#ff5252' },
        info: { main: '#38bdf8' },
        warning: { main: '#f59e42' },
        shadow: '0 2px 12px #000a',
        cellSuccessBg: '#223c2a',
        cellErrorBg: '#3a2323',
      };
    } else {
      palette = {
        mode: 'light',
        background: {
          default: '#f6f7fa',
          paper: '#fff7f7',
        },
        primary: { main: '#a855f7' },
        secondary: { main: '#f59e42' },
        text: { primary: '#7c3aed' },
        divider: '#bdbdbd',
        success: { main: '#388e3c', light: '#e8f5e9', dark: '#2e7d32' },
        error: { main: '#d32f2f', light: '#ffebee', dark: '#b71c1c' },
        info: { main: '#38bdf8' },
        warning: { main: '#f59e42' },
        shadow: '0 2px 12px #f59e4299',
        tableCell: '#f9f9fb',
        cellSuccessBg: '#eafaf0',
        cellErrorBg: '#fff3f3',
      };
    }
    return createTheme({
      palette,
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
              fontWeight: 600,
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
              fontWeight: 700,
              fontSize: '1.08em',
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
              fontWeight: 600,
            },
          },
        },
        MuiToggleButtonGroup: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiFormControl: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiFormLabel: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiFormControlLabel: {
          styleOverrides: {
            label: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiRadio: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              fontFamily: `${COMIC_FONT_FAMILY} !important`,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: palette.background.paper,
              color: palette.text.primary,
              transition: 'background 0.3s, color 0.3s',
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: {
              color: palette.text.primary,
            },
          },
        },
        MuiDialogContent: {
          styleOverrides: {
            root: {
              color: palette.text.primary,
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              color: palette.text.primary,
            },
          },
        },
      },
    });
  }, [mode]);

  // Set body background color on theme change
  React.useEffect(() => {
    document.body.style.background = theme.palette.background.default;
    document.body.style.color = theme.palette.text.primary;

    // Add/remove dark theme class for CSS styling
    if (mode === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [theme, mode]);

  // no-op: loadingTimeout handled in hook

  if (error) {
    log.error('App error:', error);
    return (
      <div className="app-container" role="alert" aria-live="assertive">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </div>
    );
  }
  if (loading) {
    log.debug('App loading...');
    if (loadingTimeout) {
      log.warn('Loading timeout detected: possible server issue.');
    }
    return (
      <div className="app-container" aria-busy="true" aria-live="polite">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
          <CircularProgress color="secondary" aria-label="Loading data" />
          <div style={{ marginTop: 16 }}>Loading...</div>
          {loadingTimeout && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Internal Server Error :: Please reach out to admin.
            </Alert>
          )}
        </Box>
      </div>
    );
  }
  // Tab change handler: open AddStrike with admin dialog
  const handleTabChange = (_, v) => {
    if (v === 'addStrike') {
      log.debug('Admin dialog opened from Add Strike tab.');
      setAdminOpen(true);
    } else {
      log.debug(`Tab changed to: ${v}`);
      setActiveTab(v);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <ThemeToggleButton
          mode={mode}
          onToggle={colorMode.toggleColorMode}
          color={theme.palette.text.primary}
        />
      </Box>
      <Box
        className="app-container"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        <h1 className="app-title">What&apos;s On Your Plate</h1>

        {/* Top-level navigation as ToggleButtonGroup */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={handleTabChange}
            aria-label="Main navigation tabs"
            color="primary"
          >
            <ToggleButton value="summary" aria-label="Summary Tab" tabIndex={0}>
              Summary
            </ToggleButton>
            <ToggleButton value="tracker" aria-label="Tracker Tab" tabIndex={0}>
              Tracker
            </ToggleButton>
            <ToggleButton value="addStrike" aria-label="Add Strike Tab" tabIndex={0}>
              Add Strike
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Summary view */}
        {activeTab === 'summary' && <SummaryView data={data} usersMap={usersMap} />}

        {/* Tracker view */}
        {activeTab === 'tracker' && (
          <TrackerView
            data={data}
            usersMap={usersMap}
            selectedUserIndex={selectedUserIndex}
            setSelectedUserIndex={setSelectedUserIndex}
            openTip={openTip}
            setOpenTip={setOpenTip}
          />
        )}

        {/* AddStrike view */}
        {activeTab === 'addStrike' && (
          <AddStrikeView
            data={data}
            usersMap={usersMap}
            setSnackbar={setSnackbar}
            refresh={refresh}
          />
        )}

        {/* Admin Dialog */}
        <AdminDialog
          open={adminOpen}
          onClose={() => {
            log.debug('Admin dialog closed.');
            setAdminOpen(false);
            setActiveTab('summary');
          }}
          onApproved={() => {
            log.debug('Admin dialog approved. Switching to Add Strike.');
            setAdminOpen(false);
            setActiveTab('addStrike');
          }}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          role="status"
          aria-live="polite"
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
