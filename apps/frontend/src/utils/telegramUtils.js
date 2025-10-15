/**
 * Sends a message to a Telegram chat using the Bot API
 * @param {string} message - The message text to send
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function sendTelegramMessage(message) {
  const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

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
