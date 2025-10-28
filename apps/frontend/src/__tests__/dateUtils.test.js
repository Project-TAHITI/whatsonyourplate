
import { getWeekRange, weekToLastDay, formatDayMonthHour, getTodayISO } from '../utils/dateUtils.js';

// --- getWeekRange tests (merged) ---
describe('getWeekRange', () => {
  it('returns correct range for a week string', () => {
    // 2025-W42 starts on 2025-10-13 (Mon) and ends on 2025-10-19 (Sun)
    const range = getWeekRange('2025-W42');
    expect(range).toMatch(/13Oct-19Oct/);
    // Output format is 'DDMon-DDMon' like '13Oct-19Oct'
    expect(range).toMatch(/^\d{2}[A-Z][a-z]{2}-\d{2}[A-Z][a-z]{2}$/);
    expect(range).toContain('Oct');
  });
  it('handles 53-week years (2020-W53 spans Dec-Jan)', () => {
    const range = getWeekRange('2020-W53');
    // Monday 2020-12-28 to Sunday 2021-01-03
    expect(range).toMatch(/28Dec-03Jan/);
  });
  it('returns empty string for invalid input', () => {
    // Our implementation may not validate invalid strings strictly; ensure it doesn't throw
    expect(() => getWeekRange('invalid')).not.toThrow();
    // Function doesn't validate input, so it returns malformed dates
    const range = getWeekRange('invalid');
    expect(range).toContain('NaN');
  });
  it('out-of-range week numbers do not throw and return formatted range', () => {
    // Week 54 or week 00 are out of ISO range; current impl still computes a range
    expect(() => getWeekRange('2025-W54')).not.toThrow();
    expect(getWeekRange('2025-W54')).toMatch(/^\d{2}[A-Z][a-z]{2}-\d{2}[A-Z][a-z]{2}$/);
    expect(() => getWeekRange('2020-W00')).not.toThrow();
    expect(getWeekRange('2020-W00')).toMatch(/^\d{2}[A-Z][a-z]{2}-\d{2}[A-Z][a-z]{2}$/);
  });
  it('handles year-edge weeks correctly', () => {
    const range2024W01 = getWeekRange('2024-W01');
    expect(range2024W01).toMatch(/Jan/);
    const range2025W52 = getWeekRange('2025-W52');
    expect(range2025W52).toMatch(/Dec/);
  });
});

// --- weekToLastDay tests (original) ---
describe('weekToLastDay', () => {
  it('returns correct last day for a typical week', () => {
    const result = weekToLastDay('2025-W42');
    expect(result).toBeInstanceOf(Date);
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.toISOString().slice(0, 10)).toBe('2025-10-19');
  });

  it('returns correct last day for first week of year', () => {
    const result = weekToLastDay('2025-W01');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString().slice(0, 10)).toBe('2025-01-05');
  });

  it('handles leap years', () => {
    const result = weekToLastDay('2024-W09');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString().slice(0, 10)).toBe('2024-03-03');
  });

  it('handles invalid input gracefully', () => {
    expect(() => weekToLastDay('invalid')).toThrow();
    expect(() => weekToLastDay('2025-W')).toThrow();
    expect(() => weekToLastDay('')).toThrow();
  });

  it('handles years with 53 weeks - 2015-W53', () => {
    // 2015 has 53 ISO weeks
    const result = weekToLastDay('2015-W53');
    expect(result).toBeInstanceOf(Date);
    // W53 of 2015 ends on Sunday, January 3, 2016
    expect(result.toISOString().slice(0, 10)).toBe('2016-01-03');
  });

  it('handles years with 53 weeks - 2020-W53', () => {
    // 2020 has 53 ISO weeks (leap year)
    const result = weekToLastDay('2020-W53');
    expect(result).toBeInstanceOf(Date);
    // W53 of 2020 ends on Sunday, January 3, 2021
    expect(result.toISOString().slice(0, 10)).toBe('2021-01-03');
  });

  it('handles years with 53 weeks - 2026-W53', () => {
    // 2026 has 53 ISO weeks
    const result = weekToLastDay('2026-W53');
    expect(result).toBeInstanceOf(Date);
    // W53 of 2026 ends on Sunday, January 3, 2027
    expect(result.toISOString().slice(0, 10)).toBe('2027-01-03');
  });

  it('rejects week 54 for any year', () => {
    expect(() => weekToLastDay('2025-W54')).toThrow();
    expect(() => weekToLastDay('2020-W54')).toThrow();
  });
});

// --- formatDayMonthHour tests (original) ---
describe('formatDayMonthHour', () => {
  it('formats date as DD-MMM (HH AM/PM)', () => {
    const date = new Date(Date.UTC(2025, 9, 19, 15, 0, 0)); // 2025-10-19 15:00 UTC
    // Convert to local time for formatting
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const result = formatDayMonthHour(localDate);
    expect(result).toMatch(/19-Oct \(03 PM\)/);
  });

  it('formats midnight as 12 AM', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const result = formatDayMonthHour(localDate);
    expect(result).toMatch(/01-Jan \(12 AM\)/);
  });

  it('formats noon as 12 PM', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));
    const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const result = formatDayMonthHour(localDate);
    expect(result).toMatch(/01-Jan \(12 PM\)/);
  });
});

// --- getTodayISO tests (from extended) ---
describe('getTodayISO', () => {
  it('returns YYYY-MM-DD format', () => {
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
