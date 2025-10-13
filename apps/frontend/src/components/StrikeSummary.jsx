import React from 'react';

// StrikeSummary - renders the summary of strikes for all users.
export default function StrikeSummary({ data, usersMap, getStrikeCount, tallyMarks }) {
  return (
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
  );
}
