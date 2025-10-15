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
import { getWeekRange } from '../utils/dateUtils.js';

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
