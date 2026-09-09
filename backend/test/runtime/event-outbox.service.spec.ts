import { EventOutboxService } from '../../src/events/event-outbox.service';

describe('EventOutboxService retry and replay contract', () => {
  const row = {
    id: 'outbox-1', eventType: 'MESSAGE_READ', eventVersion: 1,
    idempotencyKey: 'idem-1', correlationId: 'corr-1',
    payload: JSON.stringify({ userId: 'user-1' }), leaseToken: 'lease-1', attempts: 1,
  };

  afterEach(() => { jest.restoreAllMocks(); });

  it('marks a claimed event published only after Queue bridge acceptance', async () => {
    const d1: any = {
      isEnabled: () => true,
      claimPendingEventOutbox: jest.fn().mockResolvedValue([row]),
      markEventOutboxPublished: jest.fn().mockResolvedValue(true),
      markEventOutboxRetry: jest.fn(),
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    const result = await new EventOutboxService(d1).publishPending(1);
    expect(result).toEqual({ claimed: 1, published: 1, retried: 0, deadLettered: 0 });
    expect(d1.markEventOutboxPublished).toHaveBeenCalledWith('outbox-1', 'lease-1');
    expect(d1.markEventOutboxRetry).not.toHaveBeenCalled();
  });

  it('returns claimed events to retry state after Queue bridge failure', async () => {
    const d1: any = {
      isEnabled: () => true,
      claimPendingEventOutbox: jest.fn().mockResolvedValue([row]),
      markEventOutboxPublished: jest.fn(),
      markEventOutboxRetry: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503 } as Response);
    const result = await new EventOutboxService(d1).publishPending(1);
    expect(result).toEqual({ claimed: 1, published: 0, retried: 1, deadLettered: 0 });
    expect(d1.markEventOutboxRetry).toHaveBeenCalledWith('outbox-1', 'lease-1', 'QUEUE_HTTP_503');
  });

  it('classifies the terminal publish attempt as dead-lettered', async () => {
    const terminal = { ...row, attempts: 10 };
    const d1: any = {
      isEnabled: () => true,
      claimPendingEventOutbox: jest.fn().mockResolvedValue([terminal]),
      markEventOutboxPublished: jest.fn(),
      markEventOutboxRetry: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('queue unavailable'));
    const result = await new EventOutboxService(d1).publishPending(1);
    expect(result).toEqual({ claimed: 1, published: 0, retried: 0, deadLettered: 1 });
  });
});
