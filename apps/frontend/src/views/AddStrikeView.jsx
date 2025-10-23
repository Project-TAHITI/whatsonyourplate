import React from 'react';
import AddStrike from '../components/AddStrike.jsx';
import { supabase } from '@libs/supabaseClient.js';
import { sendStrikeNotification, sendStrikeSummaryReport } from '../utils/telegramUtils.js';

export default function AddStrikeView({ data, usersMap, setSnackbar, refresh }) {
  return (
    <AddStrike
      users={data.map((u) => ({ user_id: u.user_id, user_name: usersMap[u.user_id] }))}
      dailyGoals={(() => {
        const obj = {};
        data.forEach((u) => {
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
          const goals = Object.values(u.weekly_goals || {})
            .flat()
            .map((g) => g.goal);
          obj[u.user_id] = Array.from(new Set(goals));
        });
        return obj;
      })()}
      weeks={Array.from(new Set(data.flatMap((u) => Object.keys(u.weekly_goals || {})))).sort()}
      onEdit={async (info) => {
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
          matchObj = { user_id: info.user_id, week: info.week, goal: info.goal };
        }
        const { error } = await supabase
          .from(table)
          .update({ completed: false, comments: info.comments })
          .match(matchObj);
        if (error) {
          setSnackbar({
            open: true,
            message: 'Failed to update DB: ' + error.message,
            severity: 'error',
          });
        } else {
          setSnackbar({ open: true, message: 'Strike added!', severity: 'success' });
          refresh?.run?.();

          // Send Telegram notification (best effort)
          const userName = usersMap[info.user_id] || info.user_id;
          const dateStr =
            info.goalType === 'daily'
              ? info.date instanceof Date
                ? info.date.toISOString().slice(0, 10)
                : info.date
              : info.week;

          sendStrikeNotification({
            userName,
            goal: info.goal,
            goalType: info.goalType,
            date: dateStr,
            comments: info.comments,
          }).catch(() => {});

          // Send strike summary report (best effort)
          sendStrikeSummaryReport(data, usersMap).catch(() => {});
        }
      }}
    />
  );
}
