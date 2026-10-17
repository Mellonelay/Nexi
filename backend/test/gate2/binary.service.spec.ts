import { BinarySide, Gate2BinaryState } from '../../src/prisma/d1-client';
import { BinaryService } from '../../src/binary/binary.service';

describe('Gate 2 Binary authority', () => {
  const pair = {
    id: 'pair-1', symbol: 'BTCUSDT', baseAssetId: 'asset-btc', quoteAssetId: 'asset-usdt', status: 'ACTIVE',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
  };
  const quote = { id: 'quote-1', price: '100', state: 'LIVE', provider: 'deterministic-test', source: 'gate2', observedAt: new Date(), receivedAt: new Date(), sequence: 4n, freshnessMs: 2 };

  function createService(existing: unknown = null) {
    const position = { id: 'position-1', userId: 'user-1', state: Gate2BinaryState.ACTIVE, stake: '10', pair: 'BTCUSDT' };
    const d1: any = {
      getActiveMarketPair: jest.fn().mockResolvedValue(pair),
      getBinaryConfiguration: jest.fn().mockResolvedValue({ pair: 'BTCUSDT', durationSeconds: 30, payoutRate: '0.85', lossRate: '0', minStake: '1', maxStake: '1000', version: 7, enabled: true }),
      getLiveMarketQuote: jest.fn().mockResolvedValue(quote),
      openBinaryPosition: jest.fn().mockResolvedValue(existing ?? position),
    };
    const gateway = { emitPositionUpdate: jest.fn() };
    const service = new BinaryService({} as any, gateway as any, {
      findBinaryDirective: jest.fn().mockResolvedValue(null),
    } as any, d1);
    return { service, d1, position };
  }

  it('exposes crypto and canonical non-crypto configurations in production while preserving D1 terms', async () => {
    const { service, d1 } = createService();
    const configurations = [420, 30, 280, 60, 180].map((durationSeconds, index) => ({
      pair: 'BTCUSDT', durationSeconds, enabled: 1,
      payoutRate: String(0.8 + index / 100), minStake: String(index + 1), maxStake: String(1000 + index),
    }));
    const forex = { pair: 'EURUSD', durationSeconds: 30, enabled: 1, payoutRate: '0.9', minStake: '1', maxStake: '1000' };
    d1.listBinaryConfigurations = jest.fn().mockResolvedValue([...configurations, forex]);
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(service.getConfig()).resolves.toEqual({
        durations: [30, 60, 180, 280, 420], configurations: [...configurations, forex],
      });
      expect(d1.openBinaryPosition).not.toHaveBeenCalled();
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });

  it('opens non-crypto Binary positions using the canonical live market provider', async () => {
    const { service, d1 } = createService();
    d1.getActiveMarketPair.mockResolvedValueOnce({ ...pair, symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD' });
    d1.getBinaryConfiguration.mockResolvedValueOnce({ pair: 'EURUSD', durationSeconds: 30, payoutRate: '0.85', lossRate: '0', minStake: '1', maxStake: '1000', version: 2, enabled: true });
    d1.getLiveMarketQuote.mockResolvedValueOnce({ ...quote, provider: 'biquote' });
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await service.openPosition('user-1', { pair: 'EURUSD', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-2' });
      expect(d1.openBinaryPosition).toHaveBeenCalledWith(expect.objectContaining({ pair: 'EURUSD', entryProvider: 'biquote', configurationVersion: 2 }));
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });

  it('keeps a disabled canonical duration in the Public configuration response', async () => {
    const { service, d1 } = createService();
    d1.listBinaryConfigurations = jest.fn().mockResolvedValue([30, 60, 180, 280, 420].map((durationSeconds) => ({
      pair: 'BTCUSDT', durationSeconds, enabled: durationSeconds === 60 ? 0 : 1,
      payoutRate: '0.85', minStake: '1', maxStake: '1000',
    })));
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const result = await service.getConfig();
      expect(result.durations).toEqual([30, 60, 180, 280, 420]);
      expect(result.configurations.find((item: any) => item.durationSeconds === 60)?.enabled).toBe(0);
    } finally {
      if (previousEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnvironment;
    }
  });

  it('rejects stakes outside the current D1 configuration bounds', async () => {
    const { service, d1 } = createService();
    d1.getBinaryConfiguration.mockResolvedValueOnce({
      pair: 'BTCUSDT', durationSeconds: 30, payoutRate: '0.85', minStake: '11', maxStake: '1000', version: 7, enabled: true,
    });
    await expect(service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' })).rejects.toThrow('Stake is outside configured limits');
    expect(d1.openBinaryPosition).not.toHaveBeenCalled();
  });

  it('accepts a locked duration only after exact stake reservation and live quote evidence', async () => {
    const { service, d1 } = createService();
    await service.openPosition('user-1', { pair: 'BTC/USDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' });
    expect(d1.openBinaryPosition).toHaveBeenCalledWith(expect.objectContaining({ asset: 'USDT', stake: '10', entryPrice: '100', entryQuoteId: 'quote-1', configurationVersion: 7 }));
  });

  it('rejects a duration without an active configuration before value mutation', async () => {
    const { service, d1 } = createService();
    d1.getBinaryConfiguration.mockResolvedValueOnce(null);
    await expect(service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 90, idempotencyKey: 'binary-key-1' })).rejects.toThrow('Binary configuration unavailable');
    expect(d1.openBinaryPosition).not.toHaveBeenCalled();
  });

  it('rejects an entry quote from a provider that is not approved for settlement', async () => {
    const { service, d1 } = createService();
    d1.getLiveMarketQuote.mockResolvedValueOnce({ ...quote, provider: 'coingecko' });
    await expect(service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' })).rejects.toThrow('Approved settlement quote unavailable');
    expect(d1.openBinaryPosition).not.toHaveBeenCalled();
  });

  it('replays a duplicate open command without reserving twice', async () => {
    const existing = { id: 'existing-position', state: Gate2BinaryState.ACTIVE };
    const { service, d1 } = createService(existing);
    const result = await service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' });
    expect(result).toEqual(existing);
    expect(d1.openBinaryPosition).toHaveBeenCalledTimes(1);
  });
});

describe('D1 binary settlement sandbox directive', () => {
  const rawPosition = {
    id: 'position-d1-1', userId: 'user-1', state: Gate2BinaryState.ACTIVE, stake: '10',
    pair: 'BTCUSDT', side: BinarySide.CALL, entryPrice: '100', entrySequence: 3,
    durationSeconds: 30, expiresAt: new Date(Date.now() - 1000).toISOString(),
    configurationVersion: 7, idempotencyKey: 'idem-key-1', correlationId: 'corr-1',
  };
  const config = { pair: 'BTCUSDT', durationSeconds: 30, payoutRate: '0.85', lossRate: '0', minStake: '1', maxStake: '1000', version: 7, enabled: true };

  function createD1Service(directive: unknown, quotePrice = '90', side: BinarySide = BinarySide.CALL) {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      listBinaryPositions: jest.fn().mockResolvedValue([]),
      getBinaryPosition: jest.fn().mockResolvedValue({ ...rawPosition, side }),
      getActiveMarketPair: jest.fn().mockResolvedValue({ id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'quote-1', price: quotePrice, provider: 'deterministic-test', source: 'gate2', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString(), sequence: 4, freshnessMs: 2 }),
      getBinaryConfiguration: jest.fn().mockResolvedValue(config),
      settleBinaryPositionAtomic: jest.fn().mockResolvedValue({ ...rawPosition, state: 'WIN' }),
    };
    const prisma = { adminGovernanceCommand: { findMany: jest.fn() } };
    const sandboxScenarios = { findBinaryDirective: jest.fn().mockResolvedValue(directive) };
    const service = new BinaryService(prisma as any, { emitPositionUpdate: jest.fn() } as any, sandboxScenarios as any, d1 as any);
    return { service, d1, sandboxScenarios };
  }

  it.each([
    { side: BinarySide.CALL, mode: 'forced_win', result: 'WIN', quotePrice: '90', expiryAboveEntry: true },
    { side: BinarySide.CALL, mode: 'forced_loss', result: 'LOSS', quotePrice: '110', expiryAboveEntry: false },
    { side: BinarySide.PUT, mode: 'forced_win', result: 'WIN', quotePrice: '110', expiryAboveEntry: false },
    { side: BinarySide.PUT, mode: 'forced_loss', result: 'LOSS', quotePrice: '90', expiryAboveEntry: true },
  ])('keeps $side $mode settlement price and candles consistent with its result', async ({ side, mode, result, quotePrice, expiryAboveEntry }) => {
    const commandId = `cmd-${side}-${mode}`;
    const { service, d1 } = createD1Service(
      { commandId, mode, result, expiresAt: new Date(Date.now() + 60_000) },
      quotePrice,
      side,
    );
    const settled: any = await service.settlePosition('position-d1-1');
    expect(d1.getLiveMarketQuote).not.toHaveBeenCalled();
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        state: result,
        expiryQuoteId: null,
        expiryProvider: 'nexi-sandbox-simulation',
        expirySource: `sandbox:${commandId}:${mode}`,
      }),
    );
    const command = d1.settleBinaryPositionAtomic.mock.calls[0][0];
    const expiry = Number(command.expiryPrice);
    expect(expiry > 100).toBe(expiryAboveEntry);
    expect(settled.position.sandboxSimulation.entryPrice).toBe('100');
    expect(settled.position.sandboxSimulation.candles.length).toBeGreaterThan(0);
    expect(settled.position.sandboxSimulation.candles.at(-1).close).toBe(command.expiryPrice);
    for (const candle of settled.position.sandboxSimulation.candles) {
      const open = Number(candle.open);
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      expect(high).toBeGreaterThanOrEqual(Math.max(open, close));
      expect(low).toBeLessThanOrEqual(Math.min(open, close));
      expect(low).toBeGreaterThan(0);
    }
  });

  it('serves scoped simulation candles on active positions without changing market data', async () => {
    const directive = {
      commandId: 'active-command',
      mode: 'forced_win',
      result: 'WIN',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const { service, d1, sandboxScenarios } = createD1Service(directive);
    d1.listBinaryPositions = jest.fn().mockResolvedValue([rawPosition]);
    const positions: any[] = await service.getCurrentPositions('user-1');
    expect(sandboxScenarios.findBinaryDirective).toHaveBeenCalledWith(expect.anything(), 'user-1', rawPosition.id);
    expect(positions[0].sandboxSimulation).toMatchObject({
      source: 'nexi-sandbox-simulation',
      plannedResult: 'WIN',
      entryPrice: '100',
    });
    expect(positions[0].sandboxSimulation.candles.length).toBeGreaterThan(0);
    expect(d1.getLiveMarketQuote).not.toHaveBeenCalled();
  });

  it('rebuilds the same sandbox candle sequence from the persisted settlement receipt', async () => {
    const { service, d1 } = createD1Service(null);
    const persisted = {
      ...rawPosition,
      state: 'WIN',
      expiryPrice: '100.1',
      expiryProvider: 'nexi-sandbox-simulation',
      expirySource: 'sandbox:cmd-1:forced_win',
    };
    d1.getBinaryPosition.mockResolvedValue(persisted);
    const result: any = await service.settlePosition('position-d1-1', 'user-1');
    expect(result).toMatchObject({ replayed: true, position: { state: 'WIN' } });
    expect(result.position.sandboxSimulation.candles.at(-1).close).toBe('100.1');
    expect(d1.settleBinaryPositionAtomic).not.toHaveBeenCalled();
  });

  it('settles from the opened configuration version after that version is disabled', async () => {
    const { service, d1 } = createD1Service(null, '110');
    d1.getBinaryConfiguration.mockResolvedValueOnce({ ...config, payoutRate: '0.9', enabled: 0 });
    await service.settlePosition('position-d1-1');
    expect(d1.getBinaryConfiguration).toHaveBeenCalledWith('BTCUSDT', 30, 7);
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'WIN', payout: '19' }),
    );
  });

  it('D1 settlement falls back to computed outcome when no sandbox directive', async () => {
    const { service, d1 } = createD1Service(null, '110');
    await service.settlePosition('position-d1-1');
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'WIN' }),
    );
  });

  it('calculates the configured nonzero LOSS payout with exact decimal amounts', async () => {
    const { service, d1 } = createD1Service(null, '90');
    d1.getBinaryConfiguration.mockResolvedValueOnce({ ...config, lossRate: '0.15' });
    await service.settlePosition('position-d1-1');
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'LOSS', payout: '1.5', realizedProfit: '-8.5' }),
    );
  });
});
