import React from 'react';

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
