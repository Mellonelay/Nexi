import { EventOutboxScheduler } from '../../src/events/event-outbox.scheduler';

describe('EventOutboxScheduler', () => {
  const previous = process.env.NEXI_SCHEDULER_ENABLED;

  afterEach(() => {
    if (previous === undefined) delete process.env.NEXI_SCHEDULER_ENABLED;
    else process.env.NEXI_SCHEDULER_ENABLED = previous;
  });

  it('does not publish when the scheduler is disabled', async () => {
    delete process.env.NEXI_SCHEDULER_ENABLED;
    const publishPending = jest.fn();
    const scheduler = new EventOutboxScheduler({ publishPending } as any, {} as any);
    await expect(scheduler.publishPending()).resolves.toEqual({ skipped: true, reason: 'scheduler-disabled' });
    expect(publishPending).not.toHaveBeenCalled();
  });

  it('does not publish without the Valkey coordination boundary', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    const publishPending = jest.fn();
    const scheduler = new EventOutboxScheduler({ publishPending } as any, { isAvailable: () => false } as any);
    await expect(scheduler.publishPending()).resolves.toEqual({ skipped: true, reason: 'redis-unavailable' });
    expect(publishPending).not.toHaveBeenCalled();
  });

  it('publishes a bounded batch under a distributed lock and releases the lock', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    const receipt = { claimed: 2, published: 2, retried: 0, deadLettered: 0 };
    const publishPending = jest.fn().mockResolvedValue(receipt);
    const redis = {
      isAvailable: jest.fn().mockReturnValue(true),
      tryAcquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(true),
    };
    const scheduler = new EventOutboxScheduler({ publishPending } as any, redis as any);
    await expect(scheduler.publishPending()).resolves.toEqual(receipt);
    expect(redis.tryAcquireLock).toHaveBeenCalledWith('nexi:scheduler:event-outbox:publish', expect.any(String), 9);
    expect(publishPending).toHaveBeenCalledWith(25);
    expect(redis.releaseLock).toHaveBeenCalledWith('nexi:scheduler:event-outbox:publish', expect.any(String));
  });
});
