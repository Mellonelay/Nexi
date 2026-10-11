import { MarketQuoteRetentionScheduler } from '../../src/market/market-quote-retention.scheduler';

describe('MarketQuoteRetentionScheduler', () => {
  const oldScheduler = process.env.NEXI_SCHEDULER_ENABLED;
  const oldRetention = process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED;
  const d1 = { isEnabled: jest.fn(() => true), $executeRaw: jest.fn(async () => 5) };

  afterEach(() => {
    if (oldScheduler === undefined) delete process.env.NEXI_SCHEDULER_ENABLED;
    else process.env.NEXI_SCHEDULER_ENABLED = oldScheduler;
    if (oldRetention === undefined) delete process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED;
    else process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED = oldRetention;
    jest.restoreAllMocks();
    d1.$executeRaw.mockClear();
  });

  it('does not delete until both scheduler and explicit retention flag are enabled', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    delete process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED;
    const scheduler = new MarketQuoteRetentionScheduler(d1 as never);
    expect(await scheduler.removeExpiredQuoteSnapshots()).toBe(0);
    expect(d1.$executeRaw).not.toHaveBeenCalled();
  });

  it('deletes in bounded batches with a 72-hour cutoff and protects the latest row', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED = 'true';
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-11T12:00:00.000Z'));
    const scheduler = new MarketQuoteRetentionScheduler(d1 as never);
    expect(await scheduler.removeExpiredQuoteSnapshots()).toBe(5);
    const [parts, cutoff, batchSize] = d1.$executeRaw.mock.calls[0] as unknown as [TemplateStringsArray, string, number];
    const sql = Array.from(parts).join('?');
    expect(cutoff).toBe('2026-10-08T12:00:00.000Z');
    expect(batchSize).toBe(1000);
    expect(sql).toContain('DELETE FROM "MarketQuoteSnapshot"');
    expect(sql).toContain('LEFT JOIN "MarketQuoteLatest"');
    expect(sql).toContain('latest."id" IS NULL');
    expect(sql).toContain('ORDER BY snapshot."receivedAt" ASC');
    expect(sql).not.toContain('MarketKline');
  });

  it('does not overlap concurrent cleanup calls', async () => {
    process.env.NEXI_SCHEDULER_ENABLED = 'true';
    process.env.NEXI_MARKET_QUOTE_RETENTION_ENABLED = 'true';
    let unblock!: (value: number) => void;
    d1.$executeRaw.mockImplementationOnce(() => new Promise<number>((resolve) => { unblock = resolve; }));
    const scheduler = new MarketQuoteRetentionScheduler(d1 as never);
    const first = scheduler.removeExpiredQuoteSnapshots();
    expect(await scheduler.removeExpiredQuoteSnapshots()).toBe(0);
    unblock(1);
    expect(await first).toBe(1);
    expect(d1.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
