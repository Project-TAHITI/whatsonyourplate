import React, { useEffect, useState } from 'react';
import './index.css';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { supabase } from './supabaseClient';
import { Analytics } from "@vercel/analytics/next"

// Render vertical tally marks: 4 pipes + 1 slash for each group of 5, then up to 4 pipes

function TallySVG({ count }) {
  // count: 1-4 (vertical bars), 5 (4 bars + diagonal)
  const barX = [3, 8, 13, 18];
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{verticalAlign:'middle'}}>
      {/* Draw up to 4 vertical bars */}
      {Array.from({length: Math.min(count,4)}).map((_, i) => (
        <line key={i} x1={barX[i]} y1="3" x2={barX[i]} y2="19" stroke="currentColor" strokeWidth="2" />
      ))}
      {/* Diagonal strike for 5th */}
      {count === 5 && (
        <line x1="2" y1="18" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" />
      )}
    </svg>
  );
}

function tallyMarks(count) {
  if (count === 0) return '✔';
  let blocks = [];
  let fives = Math.floor(count / 5);
  let rest = count % 5;
  for (let i = 0; i < fives; i++) {
    blocks.push(
      <span className="tally-group" key={i} style={{display:'inline-block', verticalAlign:'middle', marginRight:2}}>
        <TallySVG count={5} />
      </span>
    );
  }
  if (rest > 0) {
    blocks.push(
      <span className="tally-group" key={fives} style={{display:'inline-block', verticalAlign:'middle', marginRight:2}}>
        <TallySVG count={rest} />
      </span>
    );
  }
  return <span className="tally-vertical">{blocks}</span>;
}

function getStrikeCount(goals) {
  let strikes = 0;
  Object.values(goals).forEach(goalArr => {
    goalArr.forEach(g => {
      if (!g.completed) strikes++;
    });
  });
  return strikes;
}

function App() {
  const [data, setData] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [openTip, setOpenTip] = useState(null);
  const dailyTableWrapperRef = React.useRef(null);
  const weeklyTableWrapperRef = React.useRef(null);

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

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch users
        const { data: users, error: userErr } = await supabase
          .from('users')
          .select('*');
        if (userErr) throw userErr;

        // Build user map
        const usersMap = {};
        users.forEach(u => {
          usersMap[u.user_id] = u.user_name || u.user_id;
        });

        // Fetch daily tracker


        // Fetch all daily tracker rows in batches if needed
        let daily = [];
        let from = 0, to = 999;
        let totalDaily = 0;
        do {
          const { data: batch, error: dailyErr, count } = await supabase
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
        from = 0; to = 999;
        let totalWeekly = 0;
        do {
          const { data: batch, error: weeklyErr, count } = await supabase
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
        const trackerData = users.map(u => {
          const user_id = u.user_id;
          // Group daily by date
          const dailyGoals = {};
          daily.filter(d => d.user_id === user_id).forEach(row => {
            if (!dailyGoals[row.date]) dailyGoals[row.date] = [];
            dailyGoals[row.date].push({ goal: row.goal, completed: row.completed, comments: row.comments });
          });
          // Group weekly by week
          const weeklyGoals = {};
          weekly.filter(w => w.user_id === user_id).forEach(row => {
            if (!weeklyGoals[row.week]) weeklyGoals[row.week] = [];
            weeklyGoals[row.week].push({ goal: row.goal, completed: row.completed, comments: row.comments });
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
    fetchData();
  }, []);

  // (selectedUserIndex is clamped when data is loaded)

  useEffect(() => {
    if (data.length || error) return;
    const t = setTimeout(() => setLoadingTimeout(true), 10000);
    return () => clearTimeout(t);
  }, [data.length, error]);

  if (error) return <div className="app-container">{error}</div>;
  if (!data.length) return (
    <div className="app-container">
      <div>Loading...</div>
      {loadingTimeout && <div style={{color:'red',marginTop:'1em'}}>Timeout: Data not loaded after 10 seconds.<br/>Check Supabase URL/key, network, and table data.</div>}
    </div>
  );
  const selectedUser = data[selectedUserIndex];

  return (
    <div className="app-container">
      <h1 className="app-title">Whats On Your Plate</h1>

      {/* Top-level navigation as ToggleButtonGroup */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v && setActiveTab(v)}
          aria-label="summary-tracker-toggle"
          color="primary"
        >
          <ToggleButton value="summary" aria-label="Summary">Summary</ToggleButton>
          <ToggleButton value="tracker" aria-label="Tracker">Tracker</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Summary view */}
      {activeTab === 'summary' && (
        <section className="strike-summary">
          <h2>Strikes Summary</h2>
          <div className="strike-grid">
            {data.map(user => {
              const dailyStrikes = getStrikeCount(user.daily_goals);
              const weeklyStrikes = getStrikeCount(user.weekly_goals);
              const totalStrikes = dailyStrikes + weeklyStrikes;
              return (
                <div className="strike-card" key={user.user_id} title={`${usersMap[user.user_id] || user.user_id}: ${totalStrikes} strikes`}>
                  <div className="strike-user">{usersMap[user.user_id] || user.user_id}</div>
                  <div className="strike-num">{totalStrikes}</div>
                  <div className="strike-count">{tallyMarks(totalStrikes)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tracker view as per-user MUI Tabs */}
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
                <Tab key={user.user_id} label={usersMap[user.user_id] || user.user_id} value={idx} />
              ))}
            </Tabs>
          </Box>

          {selectedUser ? (
            (() => {
              const user = selectedUser;


              // Only show daily goals for dates before today
              const today = new Date();
              const dates = Object.keys(user.daily_goals || {})
                .filter(date => {
                  // date is in YYYY-MM-DD
                  const d = new Date(date + 'T23:59:59');
                  return d < today;
                })
                .sort();
              const dailyGoalSet = new Set();
              dates.forEach(d => (user.daily_goals[d] || []).forEach(g => dailyGoalSet.add(g.goal)));
              const dailyGoalNames = Array.from(dailyGoalSet);

              // Only show weekly goals for weeks before current week
              const getWeekNum = d => {
                const dt = new Date(d);
                const firstJan = new Date(dt.getFullYear(), 0, 1);
                const days = Math.floor((dt - firstJan) / 86400000);
                return Math.ceil((days + firstJan.getDay() + 1) / 7);
              };
              const currentYear = today.getFullYear();
              const currentWeek = getWeekNum(today);
              const weeks = Object.keys(user.weekly_goals || {})
                .filter(week => {
                  // week is in YYYY-W##
                  const [yearStr, wStr] = week.split('-W');
                  const year = parseInt(yearStr, 10);
                  const w = parseInt(wStr, 10);
                  return year < currentYear || (year === currentYear && w < currentWeek);
                })
                .sort();
              const weeklyGoalSet = new Set();
              weeks.forEach(w => (user.weekly_goals[w] || []).forEach(g => weeklyGoalSet.add(g.goal)));
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
                      <table className="goal-table">
                        <thead>
                          <tr>
                            <th>Goal</th>
                            {dates.map(date => (
                              <th key={date}>{date}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dailyGoalNames.map(goalName => (
                            <tr key={goalName}>
                              <th>{goalName}</th>
                              {dates.map(date => {
                                const goalsForDate = user.daily_goals[date] || [];
                                const found = goalsForDate.find(g => g.goal === goalName);
                                const done = found ? !!found.completed : false;
                                const hasComment = found && found.comments;
                                const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
                                const tipKey = `daily|${goalName}|${date}`;
                                const handleTouch = e => {
                                  if (hasComment) {
                                    e.preventDefault();
                                    setOpenTip(openTip && openTip.key === tipKey ? null : { key: tipKey, comment: found.comments });
                                  }
                                };
                                return (
                                  <td
                                    key={date}
                                    className={done ? 'cell-yes' : 'cell-no'}
                                    title={!isTouch && hasComment ? found.comments : undefined}
                                    onPointerDown={handleTouch}
                                    style={{position:'relative'}}
                                  >
                                    {done ? '✔' : '✗'}
                                    {openTip && openTip.key === tipKey && hasComment && (
                                      <div style={{
                                        position:'absolute',
                                        left:'50%',
                                        top:'100%',
                                        transform:'translateX(-50%)',
                                        background:'#fff8e1',
                                        color:'#b71c1c',
                                        border:'1px solid #fbc02d',
                                        borderRadius:4,
                                        padding:'4px 8px',
                                        fontSize:'0.95em',
                                        zIndex:10,
                                        boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
                                        marginTop:2,
                                        minWidth:80,
                                        maxWidth:180,
                                        wordBreak:'break-word',
                                      }}>{found.comments}</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                      <table className="goal-table">
                        <thead>
                          <tr>
                            <th>Goal</th>
                            {weeks.map(week => (
                              <th key={week}>{week}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {weeklyGoalNames.map(goalName => (
                            <tr key={goalName}>
                              <th>{goalName}</th>
                              {weeks.map(week => {
                                const goalsForWeek = user.weekly_goals[week] || [];
                                const found = goalsForWeek.find(g => g.goal === goalName);
                                const done = found ? !!found.completed : false;
                                const hasComment = found && found.comments;
                                const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
                                const tipKey = `weekly|${goalName}|${week}`;
                                const handleTouch = e => {
                                  if (hasComment) {
                                    e.preventDefault();
                                    setOpenTip(openTip && openTip.key === tipKey ? null : { key: tipKey, comment: found.comments });
                                  }
                                };
                                return (
                                  <td
                                    key={week}
                                    className={done ? 'cell-yes' : 'cell-no'}
                                    title={!isTouch && hasComment ? found.comments : undefined}
                                    onPointerDown={handleTouch}
                                    style={{position:'relative'}}
                                  >
                                    {done ? '✔' : '✗'}
                                    {openTip && openTip.key === tipKey && hasComment && (
                                      <div style={{
                                        position:'absolute',
                                        left:'50%',
                                        top:'100%',
                                        transform:'translateX(-50%)',
                                        background:'#fff8e1',
                                        color:'#b71c1c',
                                        border:'1px solid #fbc02d',
                                        borderRadius:4,
                                        padding:'4px 8px',
                                        fontSize:'0.95em',
                                        zIndex:10,
                                        boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
                                        marginTop:2,
                                        minWidth:80,
                                        maxWidth:180,
                                        wordBreak:'break-word',
                                      }}>{found.comments}</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
      <Analytics />
    </div>
  );
}

export default App;
