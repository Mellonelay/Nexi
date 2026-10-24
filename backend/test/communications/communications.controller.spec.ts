import { GoneException } from '@nestjs/common';
import { CommunicationsController } from '../../src/communications/communications.controller';

describe('CommunicationsController legacy recipient messaging', () => {
  it('retires the recipient-selected send route without creating a direct message', () => {
    const sendMessage = jest.fn().mockResolvedValue({ id: 'message-1' });
    const controller = new CommunicationsController({ sendMessage } as never);

    expect(() => controller.message()).toThrow(GoneException);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
