/**
 * Returns the current date in ISO format (YYYY-MM-DD).
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Convert Date to the format: DD-MMM (HH AM/PM)
 * @param {Date} now
 * @returns {string}
 */
export function formatDayMonthHour(now) {
  const day = String(now.getDate()).padStart(2, '0');
  const monthShort = now.toLocaleString('en-US', { month: 'short' });
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, '0');
  return `${day}-${monthShort} (${hourStr} ${ampm})`;
}

/**
 * Given a string like 'YYYY-W##', returns the date range for that ISO week (Mon-Sun)
 * in the format 'DDMMM-DDMMM'.
 * @param {string} weekStr - e.g., "2025-W42"
 * @returns {string}
 */
export function getWeekRange(weekStr) {
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
 * Convert ISO week string (YYYY-W##) to last day (Sunday) of that week
 * @param {string} weekStr - e.g., "2025-W42"
 * @returns {Date}
 */
export function weekToLastDay(weekStr) {
  if (typeof weekStr !== 'string' || !/^\d{4}-W\d{2}$/.test(weekStr)) {
    throw new Error('Invalid week string format. Expected YYYY-W##');
  }
  const [yearStr, wStr] = weekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  
  // Calculate number of ISO weeks in the year
  const maxWeeks = getISOWeeksInYear(year);
  if (isNaN(year) || isNaN(week) || week < 1 || week > maxWeeks) {
    throw new Error('Invalid week string values.');
  }
  
  // Find Monday of week 1 (week containing Jan 4)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  
  // Monday of target week
  const weekMonday = new Date(week1Monday);
  weekMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  
  // Sunday (last day) is Monday + 6 days
  const weekSunday = new Date(weekMonday);
  weekSunday.setUTCDate(weekMonday.getUTCDate() + 6);
  return weekSunday;
}

/**
 * Calculate number of ISO weeks in a given year (52 or 53)
 * @param {number} year
 * @returns {number}
 */
function getISOWeeksInYear(year) {
  const week1Monday = getWeek1Monday(year);
  const nextWeek1Monday = getWeek1Monday(year + 1);
  const diffMs = nextWeek1Monday.getTime() - week1Monday.getTime();
  return Math.round(diffMs / (7 * 86400000)); // 52 or 53
}

/**
 * Get the Monday of ISO week 1 for a given year
 * @param {number} year
 * @returns {Date}
 */
function getWeek1Monday(year) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 1=Mon..7=Sun
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  return week1Monday;
}
