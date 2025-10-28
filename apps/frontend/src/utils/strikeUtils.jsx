import React from 'react';
import { weekToLastDay } from './dateUtils.js';

export function TallySVG({ count }) {
  const barX = [3, 8, 13, 18];
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ verticalAlign: 'middle' }}>
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <line
          key={i}
          x1={barX[i]}
          y1="3"
          x2={barX[i]}
          y2="19"
          stroke="currentColor"
          strokeWidth="2"
        />
      ))}
      {count === 5 && (
        <line x1="2" y1="18" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" />
      )}
    </svg>
  );
}

export function tallyMarks(count) {
  if (count === 0) return '\u2714';
  let blocks = [];
  let fives = Math.floor(count / 5);
  let rest = count % 5;
  for (let i = 0; i < fives; i++) {
    blocks.push(
      <span
        className="tally-group"
        key={i}
        style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}
      >
        <TallySVG count={5} />
      </span>
    );
  }
  if (rest > 0) {
    blocks.push(
      <span
        className="tally-group"
        key={fives}
        style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }}
      >
        <TallySVG count={rest} />
      </span>
    );
  }
  return <span className="tally-vertical">{blocks}</span>;
}

export function getStrikeCount(goals) {
  let strikes = 0;
  Object.values(goals).forEach((goalArr) => {
    goalArr.forEach((g) => {
      if (!g.completed) strikes++;
    });
  });
  return strikes;
}

/**
 * Calculate strikes for a user from their daily and weekly goals
 * @param {Object} goalInfo - User object with daily_goals and weekly_goals
 * @returns {{ daily: Array, weekly: Array, total: number }} - Arrays of incomplete strikes and total count
 */
export function calculateStrikes(goalInfo) {
  const d = [];
  Object.entries(goalInfo.daily_goals || {}).forEach(([date, goals]) => {
    (goals || []).forEach((g) => {
      // Only count incomplete strikes
      if (g.completed === false) {
        d.push({ goal: g.goal, comments: g.comments || '', date });
      }
    });
  });

  const w = [];
  Object.entries(goalInfo.weekly_goals || {}).forEach(([week, goals]) => {
    (goals || []).forEach((g) => {
      // Only count incomplete strikes
      if (g.completed === false) {
        w.push({ goal: g.goal, comments: g.comments || '', week });
      }
    });
  });

  return {
    daily: d,
    weekly: w,
    total: d.length + w.length,
  };
}

/**
 *  Pick last incomplete item by actual date (weekly items use last day of week).
 */
export function pickLastStrike(dailyStrikes = [], weeklyStrikes = []) {
  // Convert daily items to {date, goal, comments}
  const dailyWithDate = dailyStrikes.map((d) => ({
    sortDate: new Date(d.date),
    goal: d.goal,
    comments: d.comments,
  }));
  // Convert weekly items to {date (last day of week), goal, comments}
  const weeklyWithDate = weeklyStrikes.map((w) => ({
    sortDate: weekToLastDay(w.week),
    goal: w.goal,
    comments: w.comments,
  }));
  const combined = [...dailyWithDate, ...weeklyWithDate];
  if (!combined.length) return null;
  // Sort by date descending (most recent first)
  combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  const last = combined[0];
  return last.comments?.trim() ? last.comments.trim() : last.goal;
}
