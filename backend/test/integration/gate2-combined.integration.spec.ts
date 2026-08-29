import Redis from 'ioredis';
import {
  AssetLifecycleStatus,
  BinarySide,
  Gate2BinaryState,
  Gate2SpotOrderStatus,
  Gate2SpotOrderType,
  MarketQuoteState,
  OrderSide,
  Prisma,
  Role,
} from '@prisma/client';
import { FinancialOperationsService } from '../../src/financial/financial-operations.service';
import { LedgerAuthorityService } from '../../src/ledger/ledger-authority.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SpotService } from '../../src/spot/spot.service';
import { BinaryService } from '../../src/binary/binary.service';

jest.setTimeout(180_000);

const runGate2Integration = process.env.GATE2_RUN_INTEGRATION === '1';
const gate2Describe = runGate2Integration ? describe : describe.skip;

gate2Describe('Gate 2 combined isolated PostgreSQL/Redis campaign', () => {
  let prisma: PrismaService;
  let ledger: LedgerAuthorityService;
  let spot: SpotService;
  let binary: BinaryService;
  let financial: FinancialOperationsService;
  let redis: Redis;
  const tag = `g2${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  let buyerId: string;
  let sellerId: string;
  let btcAccount: string;
  let buyerUsdAccount: string;
  let sellerUsdAccount: string;
  let sellerBtcAccount: string;
  let pairId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    ledger = new LedgerAuthorityService(prisma);
    spot = new SpotService(prisma, ledger, {} as never, { emitOrderBookUpdate: () => undefined } as never);
    binary = new BinaryService(prisma, ledger, { emitPositionUpdate: () => undefined } as never, { findBinaryDirective: jest.fn().mockResolvedValue(null) } as never);
    financial = new FinancialOperationsService(prisma, ledger);
    redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:56379', { lazyConnect: true });
    await redis.connect();
    await prisma.$connect();
    expect(await redis.ping()).toBe('PONG');
    await redis.set(`gate2:campaign:${tag}`, 'healthy', 'EX', 60);
    expect(await redis.get(`gate2:campaign:${tag}`)).toBe('healthy');

    const [buyer, seller] = await Promise.all([
      prisma.user.create({ data: { userCode: 100010, email: `${tag}-buyer@test.invalid`, password: 'test-only', role: Role.USER } }),
      prisma.user.create({ data: { userCode: 100011, email: `${tag}-seller@test.invalid`, password: 'test-only', role: Role.USER } }),
    ]);
    buyerId = buyer.id;
    sellerId = seller.id;

    const [btc, usd] = await Promise.all([
      prisma.marketAsset.create({ data: { symbol: `${tag.toUpperCase()}B`, displayName: 'Gate2 BTC', status: AssetLifecycleStatus.ACTIVE } }),
      prisma.marketAsset.create({ data: { symbol: `${tag.toUpperCase()}U`, displayName: 'Gate2 USD', status: AssetLifecycleStatus.ACTIVE } }),
    ]);
    const network = await prisma.marketNetwork.create({ data: { assetId: btc.id, code: 'TESTNET', name: 'Gate2 Testnet', status: AssetLifecycleStatus.ACTIVE } });
    await prisma.marketAssetCapability.createMany({ data: [
      { assetId: btc.id, networkId: network.id, capabilityKey: `${tag}:btc:testnet`, depositEnabled: true, withdrawEnabled: true, tradingEnabled: true, status: AssetLifecycleStatus.ACTIVE },
      { assetId: usd.id, capabilityKey: `${tag}:usd:trading`, tradingEnabled: true, status: AssetLifecycleStatus.ACTIVE },
    ] });
    const pair = await prisma.marketPair.create({ data: { symbol: `${btc.symbol}${usd.symbol}`, baseAssetId: btc.id, quoteAssetId: usd.id, status: AssetLifecycleStatus.ACTIVE } });
    pairId = pair.id;
    const now = new Date();
    await prisma.marketQuoteLatest.create({ data: { pairId: pair.id, symbol: pair.symbol, provider: 'gate2-deterministic', source: 'isolated-test', sequence: 1n, price: new Prisma.Decimal('100'), state: MarketQuoteState.LIVE, observedAt: now, receivedAt: now } });
await prisma.gate2BinaryConfiguration.create({ data: { pair: pair.symbol, durationSeconds: 30, payoutRate: new Prisma.Decimal('0.8'), lossRate: new Prisma.Decimal('0'), minStake: new Prisma.Decimal('1'), maxStake: new Prisma.Decimal('1000'), enabled: true } });
    await prisma.systemConfig.upsert({ where: { key: 'gate2.spot.feeRate' }, update: { value: '0' }, create: { key: 'gate2.spot.feeRate', value: '0' } });
    await prisma.systemConfig.createMany({ data: [
      { key: `gate2.withdrawal.fee.${btc.symbol}.TESTNET`, value: '0.1' },
      { key: `gate2.conversion.rate.${usd.symbol}.${btc.symbol}`, value: '2' },
    ], skipDuplicates: true });

    const seed = async (userId: string, asset: string, amount: string, key: string) => {
      const account = await ledger.getAccountForUser(userId, asset);
      await ledger.credit({ accountId: account.id, asset, amount, referenceType: 'GATE2_TEST_SEED', referenceId: key, idempotencyKey: `gate2:seed:${key}`, correlationId: key }, undefined);
      return account.id;
    };
    buyerUsdAccount = await seed(buyerId, usd.symbol, '1000', `${tag}:buyer-usd`);
    sellerBtcAccount = await seed(sellerId, btc.symbol, '5', `${tag}:seller-btc`);
    sellerUsdAccount = await ledger.getAccountForUser(sellerId, usd.symbol).then((a) => a.id);
    btcAccount = await ledger.getAccountForUser(buyerId, btc.symbol).then((a) => a.id);
  });

  beforeEach(async () => {
    const latest = await prisma.marketQuoteLatest.findUniqueOrThrow({ where: { pairId } });
    const now = new Date();
    await prisma.marketQuoteLatest.update({
      where: { id: latest.id },
      data: { observedAt: now, receivedAt: now, state: MarketQuoteState.LIVE, sequence: latest.sequence + 1n },
    });
  });

  afterAll(async () => {
    await redis.quit();
    await prisma.$disconnect();
  });

  it('proves Spot reservation, match, settlement, and idempotent cancel paths', async () => {
    const pair = await prisma.marketPair.findFirstOrThrow({ where: { symbol: { startsWith: tag.toUpperCase() } } });
    const buy = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '1', price: '100', idempotencyKey: `${tag}:spot:buy` });
    const sell = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '1', price: '100', idempotencyKey: `${tag}:spot:sell` });
    const [buyFinal, sellFinal, trade] = await Promise.all([
      prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: buy.id } }),
      prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: sell.id } }),
      prisma.gate2SpotTrade.findFirstOrThrow({ where: { pair: pair.symbol } }),
    ]);
    expect(buyFinal.status).toBe(Gate2SpotOrderStatus.FILLED);
    expect(sellFinal.status).toBe(Gate2SpotOrderStatus.FILLED);
    expect(trade.price.toString()).toBe('100');
    expect((await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '1', price: '100', idempotencyKey: `${tag}:spot:buy` }) as any).replayed).toBe(true);

    const [concurrentBuy, concurrentSellA, concurrentSellB] = await Promise.all([
      spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '1', price: '100', idempotencyKey: `${tag}:spot:concurrent-buy` }),
      spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.5', price: '100', idempotencyKey: `${tag}:spot:concurrent-sell-a` }),
      spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.5', price: '100', idempotencyKey: `${tag}:spot:concurrent-sell-b` }),
    ]);
    const concurrentTrades = await prisma.gate2SpotTrade.count({ where: { pair: pair.symbol, OR: [
      { buyerOrderId: concurrentBuy.id },
      { sellerOrderId: { in: [concurrentSellA.id, concurrentSellB.id] } },
    ] } });
    expect(concurrentTrades).toBe(2);
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: concurrentBuy.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: concurrentSellA.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: concurrentSellB.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);

    const cancelCandidate = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.1', price: '90', idempotencyKey: `${tag}:spot:cancel-candidate` });
    await expect(spot.cancelOrder(buyerId, cancelCandidate.id)).rejects.toThrow('ownership mismatch');
    await spot.cancelOrder(sellerId, cancelCandidate.id);
  });

  it('proves Binary expiry quote settlement and same-result retry', async () => {
    const pair = await prisma.marketPair.findFirstOrThrow({ where: { symbol: { startsWith: tag.toUpperCase() } } });
    const position = await binary.openPosition(buyerId, { pair: pair.symbol, side: BinarySide.CALL, stake: '10', durationSeconds: 30, idempotencyKey: `${tag}:binary:open` });
    await expect(binary.settlePosition(position.id, sellerId)).rejects.toThrow('ownership mismatch');
    await prisma.gate2BinaryPosition.update({ where: { id: position.id }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    const latest = await prisma.marketQuoteLatest.findUniqueOrThrow({ where: { pairId: pair.id } });
    await prisma.marketQuoteLatest.update({ where: { id: latest.id }, data: { price: new Prisma.Decimal('101'), sequence: latest.sequence + 1n, observedAt: new Date(), receivedAt: new Date(), state: MarketQuoteState.LIVE } });
    const settled = await binary.settlePosition(position.id);
    expect(settled.position.state).toBe(Gate2BinaryState.WIN);
    expect((await binary.settlePosition(position.id)).replayed).toBe(true);
  });

  it('proves deposit, withdrawal reserve/settlement, paired transfer, conversion, and reconciliation', async () => {
    const pair = await prisma.marketPair.findFirstOrThrow({ where: { symbol: { startsWith: tag.toUpperCase() } }, include: { baseAsset: true, quoteAsset: true } });
    const depositInput = { userId: buyerId, asset: pair.baseAsset.symbol, network: 'TESTNET', address: `${tag}-address`, txHash: `${tag}-tx`, amount: '2', confirmations: 1, requiredConfirmations: 2, observationKey: `${tag}:deposit:1`, provider: 'deterministic-test' as const };
    expect((await financial.observeDeposit(depositInput)).deposit.state).toBe('CONFIRMING');
    expect((await financial.observeDeposit({ ...depositInput, confirmations: 2, observationKey: `${tag}:deposit:2` }) as any).credited).toBe(true);
    expect((await financial.observeDeposit({ ...depositInput, confirmations: 2, observationKey: `${tag}:deposit:3` })).replayed).toBe(true);

    const withdrawal = await financial.requestWithdrawal(buyerId, { asset: pair.baseAsset.symbol, network: 'TESTNET', address: `${tag}-withdrawal`, amount: '1', idempotencyKey: `${tag}:withdrawal:1` });
    await financial.approveWithdrawal(withdrawal.withdrawal.id, 'isolated Gate2 review');
    expect((await financial.settleWithdrawal(withdrawal.withdrawal.id, `deterministic:${tag}:receipt`) as any).withdrawal?.state).toBe('SETTLED');

    const transfer = await financial.transfer(buyerId, { toUserId: sellerId, asset: pair.quoteAsset.symbol, amount: '10', idempotencyKey: `${tag}:transfer:1` });
    expect((await financial.transfer(buyerId, { toUserId: sellerId, asset: pair.quoteAsset.symbol, amount: '10', idempotencyKey: `${tag}:transfer:1` })).replayed).toBe(true);
    expect(transfer.transfer.amount.toString()).toBe('10');

    const quote = await financial.createConversionQuote(buyerId, { fromAsset: pair.quoteAsset.symbol, toAsset: pair.baseAsset.symbol, amount: '5', quoteKey: `${tag}:conversion:quote` });
    expect(quote.quote.outputAmount.toString()).toBe('10');
    expect((await financial.acceptConversion(buyerId, quote.quote.id, `${tag}:conversion:accept`)).replayed).toBe(false);
    expect((await financial.acceptConversion(buyerId, quote.quote.id, `${tag}:conversion:accept`)).replayed).toBe(true);

    for (const accountId of [buyerUsdAccount, sellerUsdAccount, btcAccount, sellerBtcAccount]) {
      expect((await ledger.assertReconciled(accountId)).matches).toBe(true);
    }
  });

  it('proves Gate 2 correction boundaries and concurrent command safety', async () => {
    const pair = await prisma.marketPair.findFirstOrThrow({ where: { symbol: { startsWith: tag.toUpperCase() } }, include: { baseAsset: true, quoteAsset: true } });

    const stopDormant = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.STOP, amount: '0.1', price: '104', stopPrice: '105', idempotencyKey: `${tag}:stop:dormant` });
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: stopDormant.id } })).triggeredAt).toBeNull();
    await prisma.marketQuoteLatest.update({ where: { pairId: pair.id }, data: { price: new Prisma.Decimal('105'), sequence: 20n, observedAt: new Date(), receivedAt: new Date(), state: MarketQuoteState.LIVE } });
    await spot.matchOrders(pair.symbol);
    const triggered = await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: stopDormant.id } });
    expect(triggered.triggeredAt).not.toBeNull();
    expect(triggered.triggerSequence).toBe(20n);
    await spot.cancelOrder(buyerId, stopDormant.id);

    const stopLimitAsk = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.1', price: '103', idempotencyKey: `${tag}:stop:limit-ask` });
    const stopLimit = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.STOP, amount: '0.1', price: '104', stopPrice: '105', idempotencyKey: `${tag}:stop:limit` });
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: stopLimit.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: stopLimitAsk.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);

    const slippageAsk = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.1', price: '110', idempotencyKey: `${tag}:market:slippage-ask` });
    const slippageMarket = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.MARKET, amount: '0.1', idempotencyKey: `${tag}:market:slippage` });
    const slippageFinal = await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: slippageMarket.id } });
    expect(slippageFinal.status).toBe(Gate2SpotOrderStatus.CANCELED);
    expect(slippageFinal.reservedAmount.toString()).toBe('0');
    await spot.cancelOrder(sellerId, slippageAsk.id);

    const fullAsk = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.2', price: '100', idempotencyKey: `${tag}:market:full-ask` });
    const fullMarket = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.MARKET, amount: '0.2', idempotencyKey: `${tag}:market:full` });
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: fullMarket.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: fullAsk.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);

    const partialAsk = await spot.placeOrder(sellerId, { pair: pair.symbol, side: OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: '0.1', price: '100', idempotencyKey: `${tag}:market:partial-ask` });
    const partialMarket = await spot.placeOrder(buyerId, { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.MARKET, amount: '0.2', idempotencyKey: `${tag}:market:partial` });
    const partialFinal = await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: partialMarket.id } });
    expect(partialFinal.status).toBe(Gate2SpotOrderStatus.CANCELED);
    expect(partialFinal.filled.toString()).toBe('0.1');
    expect(partialFinal.reservedAmount.toString()).toBe('0');
    expect((await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: partialAsk.id } })).status).toBe(Gate2SpotOrderStatus.FILLED);

    const duplicateInput = { pair: pair.symbol, side: OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: '0.01', price: '50', idempotencyKey: `${tag}:spot:duplicate-race` };
    const duplicateResults = await Promise.all([spot.placeOrder(buyerId, duplicateInput), spot.placeOrder(buyerId, duplicateInput)]);
    expect(await prisma.gate2SpotOrder.count({ where: { userId: buyerId, idempotencyKey: duplicateInput.idempotencyKey } })).toBe(1);
    const distinctResults = await Promise.all([
      spot.placeOrder(buyerId, { ...duplicateInput, idempotencyKey: `${tag}:spot:distinct-a` }),
      spot.placeOrder(buyerId, { ...duplicateInput, idempotencyKey: `${tag}:spot:distinct-b` }),
    ]);
    expect(distinctResults[0].id).not.toBe(distinctResults[1].id);
    for (const order of [...new Map([duplicateResults[0], duplicateResults[1], ...distinctResults].map((order) => [order.id, order])).values()]) {
      const current = await prisma.gate2SpotOrder.findUniqueOrThrow({ where: { id: order.id } });
      if (current.status !== Gate2SpotOrderStatus.FILLED) await spot.cancelOrder(buyerId, order.id);
    }

    const observation = { userId: buyerId, asset: pair.baseAsset.symbol, network: 'TESTNET', address: `${tag}-concurrent-deposit`, txHash: `${tag}-concurrent-tx`, amount: '0.25', confirmations: 2, requiredConfirmations: 2, observationKey: `${tag}:deposit:concurrent`, provider: 'deterministic-test' as const };
    await Promise.all([financial.observeDeposit(observation), financial.observeDeposit(observation)]);
    const credited = await prisma.gate2Deposit.findFirstOrThrow({ where: { txHash: observation.txHash } });
    expect(credited.state).toBe('CREDITED');
    expect(await prisma.ledgerPosting.count({ where: { referenceType: 'GATE2_DEPOSIT_CREDIT', referenceId: credited.id } })).toBe(1);

    const racedWithdrawal = await financial.requestWithdrawal(buyerId, { asset: pair.baseAsset.symbol, network: 'TESTNET', address: `${tag}-raced-withdrawal`, amount: '0.1', idempotencyKey: `${tag}:withdrawal:raced` });
    const reviewResults = await Promise.allSettled([financial.approveWithdrawal(racedWithdrawal.withdrawal.id, 'race approve'), financial.rejectWithdrawal(racedWithdrawal.withdrawal.id, 'race reject')]);
    expect(reviewResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const reviewed = await prisma.gate2Withdrawal.findUniqueOrThrow({ where: { id: racedWithdrawal.withdrawal.id } });
    expect([ 'APPROVED', 'REJECTED' ]).toContain(reviewed.state);
    if (reviewed.state === 'APPROVED') {
      const settlements = await Promise.all([financial.settleWithdrawal(reviewed.id, `deterministic:${tag}:raced`), financial.settleWithdrawal(reviewed.id, `deterministic:${tag}:raced`)]);
      expect(settlements.every((result: any) => result.providerLive === false)).toBe(true);
      expect((await prisma.gate2Withdrawal.findUniqueOrThrow({ where: { id: reviewed.id } })).state).toBe('SETTLED');
    }

    const conversionQuote = await financial.createConversionQuote(buyerId, { fromAsset: pair.quoteAsset.symbol, toAsset: pair.baseAsset.symbol, amount: '1', quoteKey: `${tag}:conversion:race` });
    const conversionResults = await Promise.all([financial.acceptConversion(buyerId, conversionQuote.quote.id, `${tag}:conversion:race-accept`), financial.acceptConversion(buyerId, conversionQuote.quote.id, `${tag}:conversion:race-accept`)]);
    expect(conversionResults.filter((result) => result.replayed === false)).toHaveLength(1);
    expect(conversionResults.filter((result) => result.replayed === true)).toHaveLength(1);
  });
});
