import { formatStrikeMessage, sendStrikeNotification } from '../utils/telegramUtils.js';
import { EMOJI } from '../constants/emojis.js';

vi.mock('@libs/telegramClient.js', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(true),
}));

describe('telegramUtils extended', () => {
  it('formats daily strike message', () => {
    const msg = formatStrikeMessage({
      userName: 'Alice',
      goal: 'No Sugar',
      goalType: 'daily',
      date: '2025-10-16',
      comments: 'Tough day',
    });
    expect(msg).toContain(EMOJI.KNIFE);
    expect(msg).toContain('Alice');
    expect(msg).toContain('No Sugar');
    expect(msg).toContain('2025-10-16');
    expect(msg).toContain('Tough day');
  });

  it('formats weekly strike message with week range', () => {
    const msg = formatStrikeMessage({
      userName: 'Bob',
      goal: 'Gym',
      goalType: 'weekly',
      date: '2025-W42',
      comments: '',
    });
    expect(msg).toContain(EMOJI.KNIFE);
    expect(msg).toContain('Bob');
    expect(msg).toContain('Gym');
    expect(msg).toContain('2025-W42');
    expect(msg).toMatch(/\(.*\)/); // week range in brackets
  });

  it('sendStrikeNotification calls telegramClient and returns result', async () => {
    const { sendTelegramMessage } = await import('@libs/telegramClient.js');
    const result = await sendStrikeNotification({
      userName: 'Test',
      goal: 'Goal',
      goalType: 'daily',
      date: '2025-10-01',
      comments: '',
    });
    expect(sendTelegramMessage).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sendStrikeNotification propagates error', async () => {
    const { sendTelegramMessage } = await import('@libs/telegramClient.js');
    sendTelegramMessage.mockRejectedValueOnce(new Error('fail'));
    await expect(
      sendStrikeNotification({
        userName: 'Err',
        goal: 'G',
        goalType: 'daily',
        date: '2025-10-01',
        comments: '',
      })
    ).rejects.toThrow('fail');
  });
});
