import React from 'react';

// GoalTable - renders a table for daily or weekly goals.
export default function GoalTable({ type, goalNames, periods, userGoals, openTip, setOpenTip }) {
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  return (
    <table className="goal-table">
      <thead>
        <tr>
          <th>Goal</th>
          {periods.map(period => (
            <th key={period}>{period}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {goalNames.map(goalName => (
          <tr key={goalName}>
            <th>{goalName}</th>
            {periods.map(period => {
              const goalsForPeriod = userGoals[period] || [];
              const found = goalsForPeriod.find(g => g.goal === goalName);
              const done = found ? !!found.completed : false;
              const hasComment = found && found.comments;
              const tipKey = `${type}|${goalName}|${period}`;
              const handleTouch = e => {
                if (hasComment) {
                  e.preventDefault();
                  setOpenTip(openTip && openTip.key === tipKey ? null : { key: tipKey, comment: found.comments });
                }
              };
              return (
                <td
                  key={period}
                  className={done ? 'cell-yes' : 'cell-no'}
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
  );
}
