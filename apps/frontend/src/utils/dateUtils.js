// utils/dateUtils.js
// Utility for ISO week calculations

/**
 * Given a string like 'YYYY-W##', returns the date range for that ISO week (Mon-Sun)
 * in the format 'DDMMM-DDMMM'.
 */
export function getWeekRange(weekStr) {
  // weekStr: 'YYYY-W##'
  const [year, w] = weekStr.split('-W').map(Number);
  // Find the Monday of week 1 (the week with Jan 4th)
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // 1=Mon, 7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (jan4Day - 1));
  // Monday of week w
  const weekStart = new Date(week1Monday);
  weekStart.setDate(week1Monday.getDate() + (w - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  // Format: DDMMM-DDMMM
  const fmt = (d) =>
    `${d.getDate().toString().padStart(2, '0')}${d.toLocaleString('en-US', { month: 'short' })}`;
  return `${fmt(weekStart)}-${fmt(weekEnd)}`;
}

/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 */
export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}
