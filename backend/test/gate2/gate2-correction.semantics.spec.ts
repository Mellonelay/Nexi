import { BinarySide, Gate2BinaryState, MarketQuoteState, Prisma } from '../../src/prisma/d1-client';
import { BinaryService } from '../../src/binary/binary.service';

describe('Gate 2 binary settlement correction semantics', () => {
  function createSettlement(positionState: Gate2BinaryState = Gate2BinaryState.ACTIVE, config: any = { payoutRate: new Prisma.Decimal('0.8'), lossRate: new Prisma.Decimal('0'), enabled: false }) {
    const expiresAt = new Date(Date.now() - 1000);
    const position: any = {
      id: 'position-1', userId: 'user-1', pair: 'BTCUSDT', side: BinarySide.CALL, stake: new Prisma.Decimal('10'), entryPrice: new Prisma.Decimal('100'),
      durationSeconds: 30, expiresAt, state: positionState, entrySequence: 4n, configurationVersion: 7, idempotencyKey: 'binary-key-1', correlationId: 'binary-key-1',
    };
    const quote = { id: 'quote-expiry', price: new Prisma.Decimal('101'), state: MarketQuoteState.LIVE, provider: 'deterministic-test', source: 'quote-feed', observedAt: expiresAt, receivedAt: new Date(), sequence: 5n };
    const d1: any = {
      getBinaryPosition: jest.fn().mockResolvedValue(position),
      getActiveMarketPair: jest.fn().mockResolvedValue({ id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
      getMarketPairForSettlement: jest.fn().mockResolvedValue({ id: 'pair-1', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' }),
      getLiveMarketQuote: jest.fn().mockResolvedValue(quote),
      getBinaryConfiguration: jest.fn().mockResolvedValue(config),
      settleBinaryPositionAtomic: jest.fn().mockResolvedValue({ ...position, state: 'WIN' }),
    };
    const service = new BinaryService({} as any, { emitPositionUpdate: jest.fn() } as any, { findBinaryDirective: jest.fn().mockResolvedValue(null) } as any, d1);
    return { service, d1, position, quote };
  }

  it('pins the exact configuration version and accepts the expiry boundary', async () => {
    const { service, d1 } = createSettlement();
    const result = await service.settlePosition('position-1');
    expect(result.position.state).toBe('WIN');
    expect(d1.getBinaryConfiguration).toHaveBeenCalledWith('BTCUSDT', 30, 7);
  });

  it('delays when the latest quote is pre-expiry or not later than entry evidence', async () => {
    const { service, d1, quote, position } = createSettlement();
    quote.observedAt = new Date(position.expiresAt.getTime() - 1);
    quote.sequence = 4n;
    d1.getLiveMarketQuote.mockResolvedValue(null);
    const result = await service.settlePosition('position-1');
    expect(result.delayed).toBe(true);
    expect(d1.getBinaryConfiguration).toHaveBeenCalledWith('BTCUSDT', 30, 7);
  });

  it('compensates a terminal settlement error through the D1 state result', async () => {
    const { service, d1 } = createSettlement(Gate2BinaryState.ACTIVE, null);
    d1.getBinaryConfiguration.mockResolvedValue(null);
    const result = await service.settlePosition('position-1');
    expect(result.error).toBe(true);
    expect(result.position.state).toBe(Gate2BinaryState.ACTIVE);
    expect(d1.settleBinaryPositionAtomic).not.toHaveBeenCalled();
  });

  it('replays a terminal state without issuing a second settlement command', async () => {
    const { service, d1 } = createSettlement(Gate2BinaryState.ERROR, null);
    const result = await service.settlePosition('position-1');
    expect(result.replayed).toBe(true);
    expect(d1.settleBinaryPositionAtomic).not.toHaveBeenCalled();
  });
});
