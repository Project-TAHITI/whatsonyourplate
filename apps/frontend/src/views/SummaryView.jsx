import React from 'react';
import StrikeSummary from '../components/StrikeSummary';
import { tallyMarks, getStrikeCount } from '../utils/strikeUtils.jsx';

export default function SummaryView({ data, usersMap }) {
  return (
    <StrikeSummary
      data={data}
      usersMap={usersMap}
      getStrikeCount={getStrikeCount}
      tallyMarks={tallyMarks}
    />
  );
}
