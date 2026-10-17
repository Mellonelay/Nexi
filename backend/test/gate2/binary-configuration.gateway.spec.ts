import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';

describe('D1 Binary configuration reads', () => {
  function createGateway(row: Record<string, unknown>) {
    const gateway: any = Object.create(D1FinancialCommandGateway.prototype);
    gateway.isEnabled = jest.fn().mockReturnValue(true);
    gateway.bridge = { select: jest.fn().mockResolvedValue({ results: [row] }) };
    return gateway;
  }

  it('loads a position configuration version even after it is disabled', async () => {
    const row = { pair: 'BTCUSDT', durationSeconds: 60, version: 2, enabled: 0, payoutRate: '0.85' };
    const gateway = createGateway(row);

    await expect(gateway.getBinaryConfiguration('BTCUSDT', 60, 2)).resolves.toEqual(row);

    const [sql, params] = gateway.bridge.select.mock.calls[0];
    expect(sql).toContain('AND "version"=?');
    expect(sql).not.toContain('"enabled"=1');
    expect(params).toEqual(['BTCUSDT', 60, 2]);
  });

  it('loads the latest configuration for Admin even when disabled', async () => {
    const row = { pair: 'BTCUSDT', durationSeconds: 60, version: 2, enabled: 0 };
    const gateway = createGateway(row);

    await expect(gateway.getBinaryConfiguration('BTCUSDT', 60, undefined, true)).resolves.toEqual(row);

    const [sql, params] = gateway.bridge.select.mock.calls[0];
    expect(sql).toContain('ORDER BY "version" DESC');
    expect(sql).not.toContain('"enabled"=1');
    expect(params).toEqual(['BTCUSDT', 60]);
  });

  it('derives the Admin payout summary from canonical Binary configuration', async () => {
    const gateway = createGateway({ totalVolume: '0', activeUsers: 1, globalPayoutRate: '0.85' });

    await expect(gateway.getAdminStats()).resolves.toEqual({
      totalVolume: '0', activeUsers: 1, globalPayoutRate: '0.85',
    });

    const [sql] = gateway.bridge.select.mock.calls[0];
    expect(sql).toContain('AVG("payoutRate")');
    expect(sql).toContain('FROM "Gate2BinaryConfiguration"');
    expect(sql).not.toContain('"BinaryTimeframe"');
  });

  it('writes a new enabled version from a disabled latest row', async () => {
    const current = { id: 'config-2', pair: 'BTCUSDT', durationSeconds: 60, version: 2, enabled: 0, lossRate: '0', settlementDelaySeconds: 0 };
    const next = { ...current, id: 'config-3', version: 3, enabled: 1 };
    const gateway = createGateway(current);
    gateway.bridge.select
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [current] })
      .mockResolvedValueOnce({ results: [next] });
    gateway.bridge.batch = jest.fn().mockResolvedValue({ results: [{ meta: { changes: 1 } }] });
    gateway.eventOutboxStatement = jest.fn().mockReturnValue({ sql: 'SELECT 1', params: [] });

    await expect(gateway.updateBinaryConfiguration({
      pair: 'BTCUSDT',
      sourceDurationSeconds: 60,
      durationSeconds: 60,
      payoutRate: 0.85,
      minStake: 1,
      maxStake: 1000,
      enabled: true,
      adminId: 'admin-1',
      reason: 'Re-enable duration',
      idempotencyKey: 'binary-enable-60',
    })).resolves.toEqual(next);

    const statements = gateway.bridge.batch.mock.calls[0][0];
    expect(statements[0].sql).toContain('WHERE "id"=?');
    expect(statements[0].params).toEqual(['config-2']);
    expect(statements[1].params[9]).toBe(1);
  });

  it('returns the latest configuration version per pair and duration, including disabled rows', async () => {
    const row = { pair: 'BTCUSDT', durationSeconds: 60, version: 2, enabled: 0 };
    const gateway = createGateway(row);

    await expect(gateway.listBinaryConfigurations()).resolves.toEqual([row]);

    const [sql] = gateway.bridge.select.mock.calls[0];
    expect(sql).toContain('ROW_NUMBER() OVER (PARTITION BY "pair","durationSeconds" ORDER BY "version" DESC)');
    expect(sql).not.toContain('WHERE "enabled"=1');
  });
});
