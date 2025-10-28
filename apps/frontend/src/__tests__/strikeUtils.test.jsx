import { tallyMarks, getStrikeCount, TallySVG, pickLastStrike, calculateStrikes } from '../utils/strikeUtils.jsx';
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
    it('renders 2 groups for count 10', () => {
      const { container } = render(<div>{tallyMarks(10)}</div>);
      const groups = container.querySelectorAll('.tally-group');
      expect(groups.length).toBe(2);
    });
    it('renders 3 groups for count 11', () => {
      const { container } = render(<div>{tallyMarks(11)}</div>);
      const groups = container.querySelectorAll('.tally-group');
      expect(groups.length).toBe(3);
    });
  });

  describe('TallySVG', () => {
    it('draws 4 vertical lines for count 4', () => {
      const { container } = render(<TallySVG count={4} />);
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(4);
    });
    it('draws 5 lines (4 vertical + 1 diagonal) for count 5', () => {
      const { container } = render(<TallySVG count={5} />);
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBe(5);
    });
  });

  describe('pickLastStrike', () => {
    it('returns null for empty input', () => {
      expect(pickLastStrike([], [])).toBeNull();
    });
    it('returns last daily comment if present', () => {
      const daily = [
        { date: '2025-10-01', goal: 'A', comments: '' },
        { date: '2025-10-02', goal: 'B', comments: 'latest daily' },
      ];
      expect(pickLastStrike(daily, [])).toBe('latest daily');
    });
    it('returns last weekly comment if present', () => {
      const weekly = [
        { week: '2025-W40', goal: 'C', comments: 'weekly comment' },
      ];
      expect(pickLastStrike([], weekly)).toBe('weekly comment');
    });
    it('returns last goal if no comment', () => {
      const daily = [
        { date: '2025-10-01', goal: 'A', comments: '' },
        { date: '2025-10-02', goal: 'B', comments: '' },
      ];
      expect(pickLastStrike(daily, [])).toBe('B');
    });
    it('sorts by date/last day of week', () => {
      const daily = [
        { date: '2025-10-01', goal: 'A', comments: '' },
      ];
      const weekly = [
        { week: '2025-W41', goal: 'C', comments: 'latest week' },
        { week: '2025-W40', goal: 'B', comments: '' },
      ];
      // 2025-W41 is later than 2025-10-01
      expect(pickLastStrike(daily, weekly)).toBe('latest week');
    });
  });

  describe('calculateStrikes', () => {
    it('returns empty arrays and zero count for empty goal data', () => {
      const result = calculateStrikes({ daily_goals: {}, weekly_goals: {} });
      expect(result.daily).toEqual([]);
      expect(result.weekly).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('counts only incomplete daily goals', () => {
      const goalData = {
        daily_goals: {
          '2025-10-15': [
            { goal: 'No Sugar', completed: false, comments: 'Hard day' },
            { goal: 'Exercise', completed: true, comments: '' },
          ],
          '2025-10-16': [
            { goal: 'No Sugar', completed: false, comments: '' },
          ],
        },
        weekly_goals: {},
      };
      const result = calculateStrikes(goalData);
      expect(result.daily).toHaveLength(2);
      expect(result.weekly).toHaveLength(0);
      expect(result.total).toBe(2);
      expect(result.daily[0]).toEqual({ goal: 'No Sugar', comments: 'Hard day', date: '2025-10-15' });
    });

    it('counts only incomplete weekly goals', () => {
      const goalData = {
        daily_goals: {},
        weekly_goals: {
          '2025-W40': [
            { goal: 'Gym', completed: false, comments: 'Missed' },
            { goal: 'Read', completed: true, comments: '' },
          ],
          '2025-W41': [
            { goal: 'Gym', completed: false, comments: '' },
          ],
        },
      };
      const result = calculateStrikes(goalData);
      expect(result.daily).toHaveLength(0);
      expect(result.weekly).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.weekly[0]).toEqual({ goal: 'Gym', comments: 'Missed', week: '2025-W40' });
    });

    it('counts both daily and weekly incomplete goals', () => {
      const goalData = {
        daily_goals: {
          '2025-10-15': [{ goal: 'No Sugar', completed: false, comments: '' }],
        },
        weekly_goals: {
          '2025-W40': [{ goal: 'Gym', completed: false, comments: '' }],
        },
      };
      const result = calculateStrikes(goalData);
      expect(result.daily).toHaveLength(1);
      expect(result.weekly).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('handles null or undefined goals gracefully', () => {
      const result = calculateStrikes({});
      expect(result.daily).toEqual([]);
      expect(result.weekly).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
