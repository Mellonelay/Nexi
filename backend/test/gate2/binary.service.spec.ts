import { BinarySide, Gate2BinaryState } from '@prisma/client';
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

  function createD1Service(directive: unknown, quotePrice = '90') {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      getBinaryPosition: jest.fn().mockResolvedValue(rawPosition),
      getActiveMarketPair: jest.fn().mockResolvedValue({ id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'quote-1', price: quotePrice, provider: 'deterministic-test', source: 'gate2', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString(), sequence: 4, freshnessMs: 2 }),
      getBinaryConfiguration: jest.fn().mockResolvedValue(config),
      settleBinaryPositionAtomic: jest.fn().mockResolvedValue({ ...rawPosition, state: 'WIN' }),
    };
    const prisma = { adminGovernanceCommand: { findMany: jest.fn() } };
    const service = new BinaryService(prisma as any, { emitPositionUpdate: jest.fn() } as any, { findBinaryDirective: jest.fn().mockResolvedValue(directive) } as any, d1 as any);
    return { service, d1 };
  }

  it('D1 settlement honors forced_win directive overriding computed LOSS', async () => {
    const { service, d1 } = createD1Service(
      { commandId: 'cmd-1', mode: 'forced_win', result: 'WIN', expiresAt: new Date(Date.now() + 60_000) },
      '90',
    );
    await service.settlePosition('position-d1-1');
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'WIN' }),
    );
  });

  it('D1 settlement honors forced_loss directive overriding computed WIN', async () => {
    const { service, d1 } = createD1Service(
      { commandId: 'cmd-2', mode: 'forced_loss', result: 'LOSS', expiresAt: new Date(Date.now() + 60_000) },
      '110',
    );
    await service.settlePosition('position-d1-1');
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'LOSS' }),
    );
  });

  it('D1 settlement falls back to computed outcome when no sandbox directive', async () => {
    const { service, d1 } = createD1Service(null, '110');
    await service.settlePosition('position-d1-1');
    expect(d1.settleBinaryPositionAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'WIN' }),
    );
  });
});
