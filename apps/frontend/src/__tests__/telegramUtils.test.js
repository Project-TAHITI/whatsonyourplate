import { formatStrikeMessage } from '../utils/telegramUtils.js';
import { EMOJI } from '../constants/emojis.js';

describe('formatStrikeMessage', () => {
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
    expect(msg).toMatch(/\([^)]*\)/); // week range in brackets
  });
});
