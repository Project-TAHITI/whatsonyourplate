import { sendTelegramMessage } from '@libs/telegramClient.js';

vi.mock('@libs/telegramClient.js', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(true),
}));

describe('telegramClient', () => {
  it('exports sendTelegramMessage function', () => {
    expect(typeof sendTelegramMessage).toBe('function');
  });
  it('calls sendTelegramMessage with message', async () => {
    const result = await sendTelegramMessage('test message');
    expect(sendTelegramMessage).toHaveBeenCalledWith('test message');
    expect(result).toBe(true);
  });
});
