import {
  generateStrikeAddedMessage,
  sendStrikeNotification,
  generateStrikeSummaryMessage,
  sendStrikeSummaryReport,
} from '../utils/telegramUtils.js';
import { EMOJI } from '../constants/emojis.js';

describe('formatStrikeMessage', () => {
  it('formats daily strike message', () => {
    const msg = generateStrikeAddedMessage({
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
    const msg = generateStrikeAddedMessage({
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
});

// --- sendStrikeNotification tests (from extended) ---
vi.mock('@libs/telegramClient.js', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(true),
}));

describe('sendStrikeNotification', () => {
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

describe('generateStrikeSummaryMessage', () => {
  it('generates summary with header and sorted user lines', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {
          '2025-10-15': [{ goal: 'No Sugar', completed: false, comments: 'test' }],
        },
        weekly_goals: {},
      },
      {
        user_id: 'u2',
        daily_goals: {},
        weekly_goals: {
          '2025-W40': [{ goal: 'Gym', completed: false, comments: '' }],
        },
      },
    ];
    const usersMap = { u1: 'Alice', u2: 'Bob' };
    const message = generateStrikeSummaryMessage(data, usersMap);

    // Should include header with date/time
    expect(message).toMatch(/\d{2}-\w{3} \(\d{2} (AM|PM)\)/);
    // Should include sorted user lines
    expect(message).toContain('Alice: 1');
    expect(message).toContain('Bob: 1');
    // Should be sorted alphabetically
    const lines = message.split('\n');
    const aliceIndex = lines.findIndex((l) => l.includes('Alice'));
    const bobIndex = lines.findIndex((l) => l.includes('Bob'));
    expect(aliceIndex).toBeLessThan(bobIndex);
  });

  it('includes last strike info in brackets', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {
          '2025-10-15': [{ goal: 'No Sugar', completed: false, comments: 'latest comment' }],
        },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const message = generateStrikeSummaryMessage(data, usersMap);
    expect(message).toContain('Alice: 1 [latest comment]');
  });

  it('handles empty data gracefully', () => {
    const message = generateStrikeSummaryMessage([], {});
    // Should still have header
    expect(message).toMatch(/\d{2}-\w{3} \(\d{2} (AM|PM)\)/);
  });

  it('handles users with no incomplete strikes', () => {
    const data = [
      {
        user_id: 'u1',
        daily_goals: {
          '2025-10-15': [{ goal: 'No Sugar', completed: true, comments: '' }],
        },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };
    const message = generateStrikeSummaryMessage(data, usersMap);
    expect(message).toContain('Alice: 0');
  });

  it('uses user_id as fallback if name not in map', () => {
    const data = [
      {
        user_id: 'unknown_user',
        daily_goals: {
          '2025-10-15': [{ goal: 'Test', completed: false, comments: '' }],
        },
        weekly_goals: {},
      },
    ];
    const usersMap = {};
    const message = generateStrikeSummaryMessage(data, usersMap);
    expect(message).toContain('unknown_user: 1');
  });
});

describe('sendStrikeSummaryReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends summary message via telegram and returns result', async () => {
    const { sendTelegramMessage } = await import('@libs/telegramClient.js');
    sendTelegramMessage.mockResolvedValueOnce(true);

    const data = [
      {
        user_id: 'u1',
        daily_goals: { '2025-10-15': [{ goal: 'Test', completed: false, comments: '' }] },
        weekly_goals: {},
      },
    ];
    const usersMap = { u1: 'Alice' };

    const result = await sendStrikeSummaryReport(data, usersMap);
    expect(sendTelegramMessage).toHaveBeenCalled();
    expect(result).toBe(true);

    // Verify message contains expected content
    const callArg = sendTelegramMessage.mock.calls[0][0];
    expect(callArg).toContain('Alice: 1');
  });

  it('propagates error from telegram client', async () => {
    const { sendTelegramMessage } = await import('@libs/telegramClient.js');
    sendTelegramMessage.mockRejectedValueOnce(new Error('network fail'));

    await expect(sendStrikeSummaryReport([], {})).rejects.toThrow('network fail');
  });
});
