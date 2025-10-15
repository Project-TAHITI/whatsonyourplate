import React from 'react';
import Box from '@mui/material/Box';
import { EMOJI } from '../constants/emojis';

export default function StrikeSummary({ data, usersMap, getStrikeCount, tallyMarks }) {
  // Find the user(s) with the highest strikes
  const userStrikes = data.map((user) => {
    const dailyStrikes = getStrikeCount(user.daily_goals);
    const weeklyStrikes = getStrikeCount(user.weekly_goals);
    return { user_id: user.user_id, total: dailyStrikes + weeklyStrikes };
  });
  const maxStrikes = Math.max(...userStrikes.map((u) => u.total), 0);
  const topUsers = userStrikes.filter((u) => u.total === maxStrikes).map((u) => u.user_id);

  return (
    <section className="strike-summary">
      <div className="strike-grid">
        {data.map((user) => {
          const dailyStrikes = getStrikeCount(user.daily_goals);
          const weeklyStrikes = getStrikeCount(user.weekly_goals);
          const totalStrikes = dailyStrikes + weeklyStrikes;
          const isTop = topUsers.includes(user.user_id) && maxStrikes > 0;
          return (
            <Box
              className={`strike-card${isTop ? ' leader-strike-card' : ''}`}
              key={user.user_id}
              title={`${usersMap[user.user_id] || user.user_id}: ${totalStrikes} strikes`}
              sx={{
                bgcolor: 'background.paper',
                color: 'text.primary',
                transition: 'background 0.3s, color 0.3s',
              }}
            >
              <div className="strike-user">
                {usersMap[user.user_id] || user.user_id}
                {isTop && (
                  <span
                    role="img"
                    aria-label="crown"
                    className="crown-emoji"
                    style={{ marginLeft: 8 }}
                  >
                    {EMOJI.CROWN}
                  </span>
                )}
              </div>
              <div className="strike-num">{totalStrikes}</div>
              <div className="strike-count">{tallyMarks(totalStrikes)}</div>
            </Box>
          );
        })}
      </div>
      <style>{`
        .leader-strike-card {
          box-shadow: 0 0 16px 4px gold, 0 0 8px 2px #ffd70099;
          border: 2px solid gold;
          animation: leader-glow 1.2s infinite alternate;
        }
        .crown-emoji {
          font-size: 2em;
          vertical-align: middle;
          animation: crown-bounce 1s infinite alternate;
        }
        @keyframes leader-glow {
          0% { box-shadow: 0 0 8px 2px gold, 0 0 4px 1px #ffd70099; }
          100% { box-shadow: 0 0 24px 8px gold, 0 0 16px 4px #ffd70099; }
        }
        @keyframes crown-bounce {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-8px) scale(1.15); }
        }
      `}</style>
    </section>
  );
}
