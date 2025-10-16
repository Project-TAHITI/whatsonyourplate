import { tallyMarks, getStrikeCount, TallySVG } from '../utils/strikeUtils.jsx';
import React from 'react';
import { render } from '@testing-library/react';

describe('strikeUtils', () => {
  describe('getStrikeCount', () => {
    it('counts incomplete goals across days/weeks', () => {
      const goals = {
        '2025-10-15': [
          { goal: 'A', completed: false },
          { goal: 'B', completed: true },
        ],
        '2025-10-16': [
          { goal: 'C', completed: false },
          { goal: 'D', completed: false },
        ],
      };
      expect(getStrikeCount(goals)).toBe(3);
    });
    it('returns 0 for empty', () => {
      expect(getStrikeCount({})).toBe(0);
    });
  });

  describe('tallyMarks', () => {
    it('renders a checkmark for zero', () => {
      const { container } = render(<div>{tallyMarks(0)}</div>);
      expect(container.textContent).toContain('✔');
    });
    it('renders up to 5 as SVG tally', () => {
      const { container } = render(<div>{tallyMarks(5)}</div>);
      // Should render at least one svg
      expect(container.querySelector('svg')).toBeTruthy();
    });
    it('renders multiple groups when >5', () => {
      const { container } = render(<div>{tallyMarks(7)}</div>);
      // Two groups: a 5-group and a 2-group
      const groups = container.querySelectorAll('.tally-group');
      expect(groups.length).toBe(2);
    });
  });
});
