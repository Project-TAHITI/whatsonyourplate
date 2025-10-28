import React from 'react';
import log from '../utils/logger';
import { EMOJI } from '../constants/emojis';
import { getWeekRange } from '../utils/dateUtils';
import { useTheme } from '@mui/material/styles';
// ...existing code...

// GoalTable - renders a table for daily or weekly goals.
export default function GoalTable({ type, goalNames, periods, userGoals, openTip, setOpenTip }) {
  const theme = useTheme();

  if (!goalNames || goalNames.length === 0) {
    log.warn('GoalTable: No goal names provided');
    return <div>No goals to display</div>;
  }
  if (!periods || periods.length === 0) {
    log.warn('GoalTable: No periods provided');
    return <div>No periods to display</div>;
  }
  log.debug('GoalTable rendered', {
    type,
    goalCount: goalNames.length,
    periodCount: periods.length,
  });

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
        {goalNames.map((goalName, rowIdx) => (
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
            {periods.map((period, colIdx) => {
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
              // Tooltip positioning logic
              const isLastRow = rowIdx === goalNames.length - 1;
              const isLastCol = colIdx === periods.length - 1;
              let tooltipClass = 'goal-tooltip';
              if (isLastRow && isLastCol) tooltipClass += ' tooltip-above-left';
              else if (isLastRow) tooltipClass += ' tooltip-above';
              else if (isLastCol) tooltipClass += ' tooltip-left';
              else tooltipClass += ' tooltip-below';
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
                  {done ? EMOJI.CHECK : EMOJI.CROSS}
                  {openTip && openTip.key === tipKey && hasComment && (
                    <div
                      className={tooltipClass}
                      style={{
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[2],
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
