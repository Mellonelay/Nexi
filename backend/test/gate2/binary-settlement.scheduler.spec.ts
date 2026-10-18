import { BinarySettlementScheduler } from '../../src/binary/binary-settlement.scheduler';
import { ConfigService } from '@nestjs/config';

describe('BinarySettlementScheduler', () => {
  afterEach(() => {
    delete process.env.NEXI_SCHEDULER_ENABLED;
    delete process.env.NEXI_B7_ENABLED;
  });

  it('uses the distributed Redis lock before settling expired positions', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    process.env.NEXI_B7_ENABLED = 'false';
    const binary = { checkExpiredPositions: jest.fn().mockResolvedValue([{}, {}]) };
    const redis = {
      tryAcquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(undefined),
    };
    const result = await new BinarySettlementScheduler(binary as never, new ConfigService(), redis as never).settleExpiredPositions();
    expect(result).toEqual({ processed: 2 });
    expect(redis.tryAcquireLock).toHaveBeenCalledWith(
      'nexi:scheduler:binary-settlement:poll',
      expect.any(String),
      9,
    );
    expect(redis.releaseLock).toHaveBeenCalled();
  });

  it('fails closed when another runtime owns the lock', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    process.env.NEXI_B7_ENABLED = 'false';
    const binary = { checkExpiredPositions: jest.fn() };
    const redis = {
      tryAcquireLock: jest.fn().mockResolvedValue(false),
      releaseLock: jest.fn(),
    };
    const result = await new BinarySettlementScheduler(binary as never, new ConfigService(), redis as never).settleExpiredPositions();
    expect(result).toEqual({ skipped: true, reason: 'scheduler-lock-unavailable' });
    expect(binary.checkExpiredPositions).not.toHaveBeenCalled();
  });
});
