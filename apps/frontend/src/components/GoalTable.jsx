import React from 'react';
import { getWeekRange } from '../utils/dateUtils';
import { useTheme } from '@mui/material/styles';

// GoalTable - renders a table for daily or weekly goals.
export default function GoalTable({ type, goalNames, periods, userGoals, openTip, setOpenTip }) {
  const theme = useTheme();

  return (
    <table className="goal-table">
      <thead>
        <tr>
          <th
            style={{
              minWidth: 140,
              fontSize: '0.97em',
              background:
                theme.palette.mode === 'light'
                  ? theme.palette.tableCell
                  : theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            Goal
          </th>
          {periods.map((period) =>
            type === 'weekly' ? (
              <th
                key={period}
                style={{
                  fontSize: '0.97em',
                  background:
                    theme.palette.mode === 'light'
                      ? theme.palette.tableCell
                      : theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                {getWeekRange(period)}
              </th>
            ) : (
              <th
                key={period}
                style={{
                  fontSize: '0.97em',
                  background:
                    theme.palette.mode === 'light'
                      ? theme.palette.tableCell
                      : theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'background 0.3s, color 0.3s',
                }}
              >
                {period}
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody>
        {goalNames.map((goalName) => (
          <tr key={goalName}>
            <th
              style={{
                minWidth: 140,
                fontSize: '0.97em',
                background:
                  theme.palette.mode === 'light'
                    ? theme.palette.tableCell
                    : theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'background 0.3s, color 0.3s',
                whiteSpace: 'pre-line',
              }}
            >
              {goalName}
            </th>
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
                  style={{
                    position: 'relative',
                    fontSize: '0.95em',
                    background: done ? theme.palette.cellSuccessBg : theme.palette.cellErrorBg,
                    color: done ? theme.palette.success.dark : theme.palette.error.dark,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: theme.palette.shadow,
                    transition: 'background 0.3s, color 0.3s',
                  }}
                >
                  {done ? '✔' : '✗'}
                  {openTip && openTip.key === tipKey && hasComment && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.95em',
                        zIndex: 10,
                        boxShadow: theme.shadows[2],
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
