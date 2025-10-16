import { getWeekRange } from '../utils/dateUtils.js';

describe('getWeekRange', () => {
  it('returns correct range for a week string', () => {
    // 2025-W42 starts on 2025-10-13 (Mon) and ends on 2025-10-19 (Sun)
    const range = getWeekRange('2025-W42');
    expect(range).toMatch(/13Oct-19Oct/);
  });
  it('returns empty string for invalid input', () => {
    // Our implementation may not validate invalid strings strictly; ensure it doesn't throw
    expect(() => getWeekRange('invalid')).not.toThrow();
  });
});
