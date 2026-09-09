import { BinarySide, Gate2BinaryState } from '@prisma/client';
import { BinaryService } from '../../src/binary/binary.service';

describe('Gate 2 Binary authority', () => {
  const pair = {
    id: 'pair-1', symbol: 'BTCUSDT', baseAssetId: 'asset-btc', quoteAssetId: 'asset-usdt', status: 'ACTIVE',
    baseAsset: { id: 'asset-btc', symbol: 'BTC', status: 'ACTIVE' },
    quoteAsset: { id: 'asset-usdt', symbol: 'USDT', status: 'ACTIVE' },
  };
  const quote = { id: 'quote-1', price: '100', state: 'LIVE', provider: 'deterministic-test', source: 'gate2', observedAt: new Date(), receivedAt: new Date(), sequence: 4n, freshnessMs: 2 };

  function createService(existing: unknown = null) {
    const position = { id: 'position-1', userId: 'user-1', state: Gate2BinaryState.ACTIVE, stake: '10', pair: 'BTCUSDT' };
    const tx = { gate2BinaryPosition: { create: jest.fn().mockResolvedValue(position) } };
    const prisma = {
      marketPair: { findUnique: jest.fn().mockResolvedValue(pair) },
      marketAssetCapability: { findMany: jest.fn().mockResolvedValue([{ id: 'cap-1' }, { id: 'cap-2' }]) },
      marketQuoteLatest: { findUnique: jest.fn().mockResolvedValue(quote) },
    gate2BinaryConfiguration: { findUnique: jest.fn(), findFirst: jest.fn().mockResolvedValue({ pair: 'BTCUSDT', durationSeconds: 30, payoutRate: '0.85', lossRate: '0', minStake: '1', maxStake: '1000', version: 7, enabled: true }) },
      gate2BinaryPosition: { findUnique: jest.fn().mockResolvedValue(existing), findMany: jest.fn() },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const ledger = { getAccountForUser: jest.fn().mockResolvedValue({ id: 'ledger-1' }), reserve: jest.fn().mockResolvedValue({ postingId: 'posting-1' }) };
    const gateway = { emitPositionUpdate: jest.fn() };
    const service = new BinaryService(prisma as any, ledger as any, gateway as any, {
      findBinaryDirective: jest.fn().mockResolvedValue(null),
    } as any);
    return { service, prisma, ledger, tx, position };
  }

  it('accepts a locked duration only after exact stake reservation and live quote evidence', async () => {
    const { service, ledger, tx } = createService();
    await service.openPosition('user-1', { pair: 'BTC/USDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' });
    expect(ledger.reserve).toHaveBeenCalledWith(expect.objectContaining({ asset: 'USDT', amount: '10', referenceType: 'GATE2_BINARY_STAKE_RESERVE' }), tx);
    const created = tx.gate2BinaryPosition.create.mock.calls[0][0].data;
    expect(created.entryPrice.toString()).toBe('100');
    expect(created.entryQuoteId).toBe('quote-1');
    expect(created.configurationVersion).toBe(7);
  });

  it('rejects a duration without an active configuration before value mutation', async () => {
    const { service, prisma, ledger } = createService();
    prisma.gate2BinaryConfiguration.findFirst.mockResolvedValueOnce(null);
    await expect(service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 90, idempotencyKey: 'binary-key-1' })).rejects.toThrow('Binary configuration unavailable');
    expect(ledger.reserve).not.toHaveBeenCalled();
  });

  it('replays a duplicate open command without reserving twice', async () => {
    const existing = { id: 'existing-position', state: Gate2BinaryState.ACTIVE };
    const { service, ledger } = createService(existing);
    const result = await service.openPosition('user-1', { pair: 'BTCUSDT', side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: 'binary-key-1' });
    expect(result).toEqual({ ...existing, replayed: true });
    expect(ledger.reserve).not.toHaveBeenCalled();
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
    const service = new BinaryService(
      prisma as any,
      {} as any,
      { emitPositionUpdate: jest.fn() } as any,
      { findBinaryDirective: jest.fn().mockResolvedValue(directive) } as any,
      d1 as any,
    );
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
