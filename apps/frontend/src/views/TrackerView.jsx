import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import GoalTable from '../components/GoalTable';

export default function TrackerView({
  data,
  usersMap,
  selectedUserIndex,
  setSelectedUserIndex,
  openTip,
  setOpenTip,
}) {
  const dailyTableWrapperRef = useRef(null);
  const weeklyTableWrapperRef = useRef(null);

  const selectedUser = data[selectedUserIndex];

  // Auto-scroll to right for daily/weekly tables if columns > 10
  useEffect(() => {
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

  return (
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

          // Only show daily goals for dates up to and including today
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const dates = Object.keys(user.daily_goals || {})
            .filter((date) => {
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
  );
}
