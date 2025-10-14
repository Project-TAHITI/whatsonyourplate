import React from 'react';
import { getWeekRange } from '../utils/dateUtils';

// GoalTable - renders a table for daily or weekly goals.
export default function GoalTable({ type, goalNames, periods, userGoals, openTip, setOpenTip }) {
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

  // State for week header tip
  const [weekTip, setWeekTip] = React.useState(null); // { key, range }

  return (
    <table className="goal-table">
      <thead>
        <tr>
          <th>Goal</th>
          {periods.map((period) =>
            type === 'weekly' ? (
              <th
                key={period}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setWeekTip(
                    weekTip && weekTip.key === period
                      ? null
                      : { key: period, range: getWeekRange(period) }
                  );
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setWeekTip(
                    weekTip && weekTip.key === period
                      ? null
                      : { key: period, range: getWeekRange(period) }
                  );
                }}
              >
                {period}
                {weekTip && weekTip.key === period && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '100%',
                      transform: 'translateX(-50%)',
                      background: '#fff8e1',
                      color: '#b71c1c',
                      border: '1px solid #fbc02d',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: '0.95em',
                      zIndex: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      marginTop: 2,
                      minWidth: 80,
                      maxWidth: 180,
                      wordBreak: 'break-word',
                    }}
                  >
                    {weekTip.range}
                  </div>
                )}
              </th>
            ) : (
              <th key={period}>{period}</th>
            )
          )}
        </tr>
      </thead>
      <tbody>
        {goalNames.map((goalName) => (
          <tr key={goalName}>
            <th>{goalName}</th>
            {periods.map((period) => {
              const goalsForPeriod = userGoals[period] || [];
              const found = goalsForPeriod.find((g) => g.goal === goalName);
              const done = found ? !!found.completed : false;
              const hasComment = found && found.comments;
              const tipKey = `${type}|${goalName}|${period}`;
              const handleShowComment = (e) => {
                if (hasComment) {
                  e.stopPropagation();
                  setOpenTip(
                    openTip && openTip.key === tipKey
                      ? null
                      : { key: tipKey, comment: found.comments }
                  );
                }
              };
              return (
                <td
                  key={period}
                  className={done ? 'cell-yes' : 'cell-no'}
                  onPointerDown={hasComment ? handleShowComment : undefined}
                  onClick={hasComment ? handleShowComment : undefined}
                  onTouchStart={hasComment ? handleShowComment : undefined}
                  style={{ position: 'relative' }}
                >
                  {done ? '✔' : '✗'}
                  {openTip && openTip.key === tipKey && hasComment && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        background: '#fff8e1',
                        color: '#b71c1c',
                        border: '1px solid #fbc02d',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.95em',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        marginTop: 2,
                        minWidth: 80,
                        maxWidth: 180,
                        wordBreak: 'break-word',
                      }}
                    >
                      {found.comments}
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
