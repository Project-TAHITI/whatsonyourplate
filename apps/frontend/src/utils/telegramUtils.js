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
import { getWeekRange, formatDayMonthHour } from '../utils/dateUtils.js';
import { pickLastStrike, calculateStrikes } from './strikeUtils.jsx';

export function generateStrikeAddedMessage(strikeInfo) {
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

/**
 * Generate and send strike summary report using loaded data
 * @param {Array} data - Array of user objects with daily_goals and weekly_goals
 * @param {Object} usersMap - Map of user_id to user_name
 * @returns {Promise<boolean>} - True if successful
 */
export function generateStrikeSummaryMessage(data, usersMap) {
  // Generate report header
  const now = new Date();
  const header = formatDayMonthHour(now);

  // Generate lines for each user
  const lines =
    data?.map((goalData) => {
      const { daily, weekly, total } = calculateStrikes(goalData);
      const lastInfo = pickLastStrike(daily, weekly);
      return {
        user_id: goalData.user_id,
        name: usersMap[goalData.user_id] || goalData.user_id,
        total,
        bracket: lastInfo ? ` [${lastInfo}]` : '',
      };
    }) || [];

  // Sort alphabetically by user name
  lines.sort((a, b) => a.name.localeCompare(b.name));
  const body = lines.map((l) => `${l.name}: ${l.total}${l.bracket}`).join('\n');
  return `${header}\n${body}`;
}

export async function sendStrikeNotification(strikeInfo) {
  return await sendTelegramMessage(generateStrikeAddedMessage(strikeInfo));
}

export async function sendStrikeSummaryReport(data, usersMap) {
  return await sendTelegramMessage(generateStrikeSummaryMessage(data, usersMap));
}
