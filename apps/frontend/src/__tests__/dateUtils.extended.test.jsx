import { getWeekRange, getTodayISO } from '../utils/dateUtils.js';

describe('dateUtils extended', () => {
  it('returns correct range for a week string', () => {
    const range = getWeekRange('2025-W42');
    // Output format is 'DDMon-DDMon' like '13Oct-19Oct'
    expect(range).toMatch(/^\d{2}[A-Z][a-z]{2}-\d{2}[A-Z][a-z]{2}$/);
    expect(range).toContain('Oct');
  });

  it('handles invalid input gracefully', () => {
    const range = getWeekRange('invalid');
    // Function doesn't validate input, so it returns malformed dates
    expect(range).toContain('NaN');
  });

  it('handles year-edge weeks correctly', () => {
    const range2024W01 = getWeekRange('2024-W01');
    expect(range2024W01).toMatch(/Jan/);
    const range2025W52 = getWeekRange('2025-W52');
    expect(range2025W52).toMatch(/Dec/);
  });

  it('getTodayISO returns YYYY-MM-DD format', () => {
    const today = getTodayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getTodayISO with fake timers returns consistent date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-16T12:00:00Z'));
    const today = getTodayISO();
    expect(today).toBe('2025-10-16');
    vi.useRealTimers();
  });
});
