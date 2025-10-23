import { sendTelegramMessage } from '@libs/telegramClient.js';

/**
 * Formats and sends a strike notification to Telegram
 * @param {object} strikeInfo - Strike details
 * @param {string} strikeInfo.userName - Name of the user
 * @param {string} strikeInfo.goal - The goal name
 * @param {string} strikeInfo.goalType - 'daily' or 'weekly'
 * @param {string} strikeInfo.date - Date (for daily) or week (for weekly)
 * @param {string} strikeInfo.comments - Optional comments
 * @returns {Promise<boolean>} - True if successful
 */
import { EMOJI } from '../constants/emojis.js';
import { getWeekRange, weekToLastDay, formatDayMonthHour } from '../utils/dateUtils.js';

export function formatStrikeMessage(strikeInfo) {
  const { userName, goal, goalType, date, comments } = strikeInfo;

  let message = `${EMOJI.KNIFE} <b>New Strike Added!</b>\n\n`;
  message += `${EMOJI.USER} ${userName}\n`;
  message += `${EMOJI.TARGET} ${goal}\n`;
  if (goalType === 'weekly') {
    const range = getWeekRange(date);
    message += `${EMOJI.CALENDAR_DAY} ${date} (${range})\n`;
  } else {
    message += `${EMOJI.CALENDAR_DAY} ${date}\n`;
  }

  if (comments) {
    message += `${EMOJI.COMMENT} ${comments}\n`;
  }

  message += `\n${EMOJI.SUCCESS} Strike has been recorded successfully!`;
  return message;
}

export async function sendStrikeNotification(strikeInfo) {
  const message = formatStrikeMessage(strikeInfo);
  return await sendTelegramMessage(message);
}



/**
 * Pick last incomplete item by actual date (weekly items use last day of week).
 */
function pickLastStrike(dailyStrikes = [], weeklyStrikes = []) {
  // Convert daily items to {date, goal, comments}
  const dailyWithDate = dailyStrikes.map((d) => ({
    sortDate: new Date(d.date),
    goal: d.goal,
    comments: d.comments,
  }));
  // Convert weekly items to {date (last day of week), goal, comments}
  const weeklyWithDate = weeklyStrikes.map((w) => ({
    sortDate: weekToLastDay(w.week),
    goal: w.goal,
    comments: w.comments,
  }));
  const combined = [...dailyWithDate, ...weeklyWithDate];
  if (!combined.length) return null;
  // Sort by date descending (most recent first)
  combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  const last = combined[0];
  return last.comments?.trim() ? last.comments.trim() : last.goal;
}

/**
 * Generate and send strike summary report using loaded data
 * @param {Array} data - Array of user objects with daily_goals and weekly_goals
 * @param {Object} usersMap - Map of user_id to user_name
 * @returns {Promise<boolean>} - True if successful
 */
export async function sendStrikeSummaryReport(data, usersMap) {
  try {
    // Generate report header
    const now = new Date();
  const header = formatDayMonthHour(now);

    // Generate lines for each user
    const lines =
      data?.map((user) => {
        const d = [];
        Object.entries(user.daily_goals || {}).forEach(([date, goals]) => {
          (goals || []).forEach((g) => d.push({ goal: g.goal, comments: g.comments || '', date }));
        });
        const w = [];
        Object.entries(user.weekly_goals || {}).forEach(([week, goals]) => {
          (goals || []).forEach((g) => w.push({ goal: g.goal, comments: g.comments || '', week }));
        });
        const total = d.length + w.length;
        const lastInfo = pickLastStrike(d, w);
        return {
          user_id: user.user_id,
          name: usersMap[user.user_id] || user.user_id,
          total,
          bracket: lastInfo ? ` [${lastInfo}]` : '',
        };
      }) || [];

    // Sort alphabetically by user name
    lines.sort((a, b) => a.name.localeCompare(b.name));
    const body = lines.map((l) => `${l.name}: ${l.total}${l.bracket}`).join('\n');
    const message = `${header}\n${body}`;

    // Send report to Telegram
    return await sendTelegramMessage(message);
  } catch (error) {
    console.error('Failed to send strike summary report:', error);
    return false;
  }
}
