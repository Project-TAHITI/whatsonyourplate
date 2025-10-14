import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { supabase } from './supabaseClient';
import StrikeSummary from './components/StrikeSummary';
import GoalTable from './components/GoalTable';
import AddStrike from './components/AddStrike.jsx';
import { tallyMarks, getStrikeCount } from './utils/strikeUtils.jsx';
import './index.css';

function App() {
  const [data, setData] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [openTip, setOpenTip] = useState(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminStep, setAdminStep] = useState(0); // 0: ask, 1: password, 2: not admin
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const dailyTableWrapperRef = useRef(null);
  const weeklyTableWrapperRef = useRef(null);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Auto-scroll to right for daily/weekly tables if columns > 10
  React.useEffect(() => {
    const user = data[selectedUserIndex];
    if (dailyTableWrapperRef.current && user && Object.keys(user.daily_goals || {}).length > 10) {
      const el = dailyTableWrapperRef.current;
      el.scrollLeft = el.scrollWidth;
    }
    if (weeklyTableWrapperRef.current && user && Object.keys(user.weekly_goals || {}).length > 10) {
      const el = weeklyTableWrapperRef.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, [selectedUserIndex, data]);

  async function fetchData() {
    try {
      // Fetch users
      const { data: users, error: userErr } = await supabase.from('users').select('*');
      if (userErr) throw userErr;

      // Build user map
      const usersMap = {};
      users.forEach((u) => {
        usersMap[u.user_id] = u.user_name || u.user_id;
      });

      // Fetch all daily tracker rows in batches if needed
      let daily = [];
      let from = 0,
        to = 999;
      let totalDaily = 0;
      do {
        const {
          data: batch,
          error: dailyErr,
          count,
        } = await supabase
          .from('daily_goal_tracker')
          .select('*', { count: 'exact' })
          .range(from, to);
        if (dailyErr) throw dailyErr;
        if (batch) daily = daily.concat(batch);
        if (count !== null) totalDaily = count;
        from += 1000;
        to += 1000;
      } while (from < totalDaily);

      // Fetch all weekly tracker rows in batches if needed
      let weekly = [];
      from = 0;
      to = 999;
      let totalWeekly = 0;
      do {
        const {
          data: batch,
          error: weeklyErr,
          count,
        } = await supabase
          .from('weekly_goal_tracker')
          .select('*', { count: 'exact' })
          .range(from, to);
        if (weeklyErr) throw weeklyErr;
        if (batch) weekly = weekly.concat(batch);
        if (count !== null) totalWeekly = count;
        from += 1000;
        to += 1000;
      } while (from < totalWeekly);

      // Group daily/weekly by user
      const trackerData = users.map((u) => {
        const user_id = u.user_id;
        // Group daily by date
        const dailyGoals = {};
        daily
          .filter((d) => d.user_id === user_id)
          .forEach((row) => {
            if (!dailyGoals[row.date]) dailyGoals[row.date] = [];
            dailyGoals[row.date].push({
              goal: row.goal,
              completed: row.completed,
              comments: row.comments,
            });
          });
        // Group weekly by week
        const weeklyGoals = {};
        weekly
          .filter((w) => w.user_id === user_id)
          .forEach((row) => {
            if (!weeklyGoals[row.week]) weeklyGoals[row.week] = [];
            weeklyGoals[row.week].push({
              goal: row.goal,
              completed: row.completed,
              comments: row.comments,
            });
          });
        return {
          user_id,
          daily_goals: dailyGoals,
          weekly_goals: weeklyGoals,
        };
      });

      setData(trackerData);
      setUsersMap(usersMap);
    } catch (err) {
      setError('Could not load tracker or user data');
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length || error) return;
    const t = setTimeout(() => setLoadingTimeout(true), 10000);
    return () => clearTimeout(t);
  }, [data.length, error]);

  if (error)
    return (
      <div className="app-container" role="alert" aria-live="assertive">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      </div>
    );
  if (!data.length)
    return (
      <div className="app-container" aria-busy="true" aria-live="polite">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
          <CircularProgress color="secondary" aria-label="Loading data" />
          <div style={{ marginTop: 16 }}>Loading...</div>
          {loadingTimeout && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Timeout: Data not loaded after 10 seconds.<br />Check Supabase URL/key, network, and table data.
            </Alert>
          )}
        </Box>
      </div>
    );
  const selectedUser = data[selectedUserIndex];

  // Tab change handler: open AddStrike with admin dialog
  const handleTabChange = (_, v) => {
    if (v === 'addStrike') {
      setAdminDialogOpen(true);
      setAdminStep(0);
      setAdminPassword('');
      setAdminError('');
    } else {
      setActiveTab(v);
    }
  };

  // Admin dialog actions
  const handleAdminYes = () => setAdminStep(1);
  const handleAdminNo = () => {
    setAdminStep(2);
  };

  // Handler for closing the roast dialog and redirecting to summary
  const handleRoastClose = () => {
    setAdminDialogOpen(false);
    setActiveTab('summary');
  };
  const handleAdminPassword = () => {
    if (adminPassword === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAdminDialogOpen(false);
      setActiveTab('addStrike');
    } else {
      setAdminError('Incorrect password');
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Whats On Your Plate</h1>

      {/* Top-level navigation as ToggleButtonGroup */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={handleTabChange}
          aria-label="Main navigation tabs"
          color="primary"
          sx={{
            fontFamily:
              "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif !important",
          }}
        >
          <ToggleButton
            value="summary"
            aria-label="Summary Tab"
            tabIndex={0}
            sx={{
              fontFamily:
                "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif !important",
              fontWeight: 700,
              fontSize: '1.08em',
            }}
          >
            Summary
          </ToggleButton>
          <ToggleButton
            value="tracker"
            aria-label="Tracker Tab"
            tabIndex={0}
            sx={{
              fontFamily:
                "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif !important",
              fontWeight: 700,
              fontSize: '1.08em',
            }}
          >
            Tracker
          </ToggleButton>
          <ToggleButton
            value="addStrike"
            aria-label="Add Strike Tab"
            tabIndex={0}
            sx={{
              fontFamily:
                "'Comic Sans MS', 'Comic Sans', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif !important",
              fontWeight: 700,
              fontSize: '1.08em',
            }}
          >
            Add Strike
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary view */}
      {activeTab === 'summary' && (
        <StrikeSummary
          data={data}
          usersMap={usersMap}
          getStrikeCount={(goals, type) => getStrikeCount(goals, type)}
          tallyMarks={tallyMarks}
        />
      )}

      {/* Tracker view */}
      {activeTab === 'tracker' && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={selectedUserIndex}
              onChange={(_, v) => setSelectedUserIndex(v)}
              aria-label="user-tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {data.map((user, idx) => (
                <Tab
                  key={user.user_id}
                  label={usersMap[user.user_id] || user.user_id}
                  value={idx}
                />
              ))}
            </Tabs>
          </Box>

          {selectedUser ? (
            (() => {
              const user = selectedUser;

              // Only show daily goals for dates up to and including today
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              const dates = Object.keys(user.daily_goals || {})
                .filter((date) => {
                  // date is in YYYY-MM-DD
                  const d = new Date(date + 'T23:59:59');
                  return d <= today;
                })
                .sort();
              const dailyGoalSet = new Set();
              dates.forEach((d) =>
                (user.daily_goals[d] || []).forEach((g) => dailyGoalSet.add(g.goal))
              );
              const dailyGoalNames = Array.from(dailyGoalSet);

              // Only show weekly goals for weeks upto and including current week
              const getWeekNum = (d) => {
                const dt = new Date(d);
                const firstJan = new Date(dt.getFullYear(), 0, 1);
                const days = Math.floor((dt - firstJan) / 86400000);
                return Math.ceil((days + firstJan.getDay() + 1) / 7);
              };
              const currentYear = today.getFullYear();
              const currentWeek = getWeekNum(today);
              const weeks = Object.keys(user.weekly_goals || {})
                .filter((week) => {
                  // week is in YYYY-W##
                  const [yearStr, wStr] = week.split('-W');
                  const year = parseInt(yearStr, 10);
                  const w = parseInt(wStr, 10);
                  return year < currentYear || (year === currentYear && w <= currentWeek);
                })
                .sort();
              const weeklyGoalSet = new Set();
              weeks.forEach((w) =>
                (user.weekly_goals[w] || []).forEach((g) => weeklyGoalSet.add(g.goal))
              );
              const weeklyGoalNames = Array.from(weeklyGoalSet);

              return (
                <section className="user-section" key={user.user_id}>
                  {/* Daily Goals Table */}
                  <div
                    className={dates.length > 10 ? 'table-scroll-x' : ''}
                    ref={dailyTableWrapperRef}
                    style={dates.length > 10 ? { overflowX: 'auto', maxWidth: '100%' } : {}}
                  >
                    <h3>Daily Goals</h3>
                    {dates.length === 0 || dailyGoalNames.length === 0 ? (
                      <div>No daily goals available</div>
                    ) : (
                      <GoalTable
                        type="daily"
                        goalNames={dailyGoalNames}
                        periods={dates}
                        userGoals={user.daily_goals}
                        openTip={openTip}
                        setOpenTip={setOpenTip}
                      />
                    )}
                  </div>
                  {/* Weekly Goals Table */}
                  <div
                    className={weeks.length > 10 ? 'table-scroll-x' : ''}
                    ref={weeklyTableWrapperRef}
                    style={weeks.length > 10 ? { overflowX: 'auto', maxWidth: '100%' } : {}}
                  >
                    <h3>Weekly Goals</h3>
                    {weeks.length === 0 || weeklyGoalNames.length === 0 ? (
                      <div>No weekly goals available</div>
                    ) : (
                      <GoalTable
                        type="weekly"
                        goalNames={weeklyGoalNames}
                        periods={weeks}
                        userGoals={user.weekly_goals}
                        openTip={openTip}
                        setOpenTip={setOpenTip}
                      />
                    )}
                  </div>
                </section>
              );
            })()
          ) : (
            <div>No users available</div>
          )}
        </>
      )}

      {/* AddStrike view */}
      {activeTab === 'addStrike' && (
        <AddStrike
          users={data.map((u) => ({ user_id: u.user_id, user_name: usersMap[u.user_id] }))}
          dailyGoals={(() => {
            const obj = {};
            data.forEach((u) => {
              // Collect all daily goals for this user
              const goals = Object.values(u.daily_goals || {})
                .flat()
                .map((g) => g.goal);
              obj[u.user_id] = Array.from(new Set(goals));
            });
            return obj;
          })()}
          weeklyGoals={(() => {
            const obj = {};
            data.forEach((u) => {
              // Collect all weekly goals for this user
              const goals = Object.values(u.weekly_goals || {})
                .flat()
                .map((g) => g.goal);
              obj[u.user_id] = Array.from(new Set(goals));
            });
            return obj;
          })()}
          weeks={Array.from(new Set(data.flatMap((u) => Object.keys(u.weekly_goals || {})))).sort()}
          onEdit={async (info) => {
            // info: { user_id, goalType, goal, date, week, comments }
            let table, matchObj;
            if (info.goalType === 'daily') {
              table = 'daily_goal_tracker';
              matchObj = {
                user_id: info.user_id,
                date: info.date instanceof Date ? info.date.toISOString().slice(0, 10) : info.date,
                goal: info.goal,
              };
            } else {
              table = 'weekly_goal_tracker';
              matchObj = {
                user_id: info.user_id,
                week: info.week,
                goal: info.goal,
              };
            }
            const { error } = await supabase
              .from(table)
              .update({ completed: false, comments: info.comments })
              .match(matchObj);
            if (error) {
              setSnackbar({ open: true, message: 'Failed to update DB: ' + error.message, severity: 'error' });
            } else {
              setSnackbar({ open: true, message: 'Strike added!', severity: 'success' });
              fetchData();
            }
          }}
        />
      )}

      {/* Admin Dialogs */}
  <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} aria-modal="true" aria-labelledby="admin-dialog-title">
        {adminStep === 0 && (
          <>
            <DialogTitle id="admin-dialog-title">
              Do you think you have enough <span style={{ color: '#a855f7' }}>Aura</span> to add a
              Strike?
            </DialogTitle>
            <DialogActions>
              <Button onClick={handleAdminYes} color="primary">
                Bet 💫
              </Button>
              <Button onClick={handleAdminNo} color="secondary">
                Nah 😅
              </Button>
            </DialogActions>
          </>
        )}
        {adminStep === 1 && (
          <>
            <DialogTitle id="admin-dialog-title">Drop your secret sauce to prove your vibe</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdminPassword();
                  }
                }}
                error={!!adminError}
                helperText={adminError}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAdminPassword} color="primary">
                Flex 💪
              </Button>
              <Button onClick={() => setAdminDialogOpen(false)} color="secondary">
                Back Out 🚪
              </Button>
            </DialogActions>
          </>
        )}
        {adminStep === 2 && (
          <>
            <DialogTitle id="admin-dialog-title">
              Touch grass, come back with some real main character energy.{' '}
              <span role="img" aria-label="skull">
                💀
              </span>
            </DialogTitle>
            <DialogActions>
              <Button onClick={handleRoastClose} color="primary">
                Skibidi Out!! 😭
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
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
    </div>
  );
}

export default App;
