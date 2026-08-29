import { BadRequestException, Injectable, NotFoundException, Optional, ServiceUnavailableException } from '@nestjs/common';
import { Gate2SpotOrderStatus, Gate2SpotOrderType, LedgerAccountScope, LedgerPostingKind, OrderSide, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { MarketAuthorityService } from '../market/market-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { assertNonNegativeDecimal, assertPositiveDecimal, decimalProduct, spotTransitionAllowed } from '../gate2/gate2-rules';
import { SpotGateway } from './spot.gateway';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

export interface PlaceSpotOrderInput {
  pair: string;
  side: OrderSide;
  type: Gate2SpotOrderType;
  amount: string;
  price?: string;
  stopPrice?: string;
  idempotencyKey: string;
  accountScope?: LedgerAccountScope;
}

type DbClient = PrismaService | any;

@Injectable()
export class SpotService {
  private readonly defaultFeeRate = new Prisma.Decimal('0.001');

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    private readonly marketAuthority: MarketAuthorityService,
    private readonly spotGateway: SpotGateway,
    private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async placeOrder(userId: string, input: PlaceSpotOrderInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.amount);
    const accountScope = input.accountScope ?? LedgerAccountScope.MAIN;
    if (this.d1?.isEnabled()) return this.placeOrderOnD1(userId, input, amount, accountScope);
    const existing = await this.prisma.gate2SpotOrder.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) return { ...existing, replayed: true };
    const pair = await this.resolvePair(input.pair);
    const type = input.type;
    const feeRate = await this.resolveFeeRate();
    let price = input.price ? assertPositiveDecimal(input.price) : null;
    const stopPrice = input.stopPrice ? assertPositiveDecimal(input.stopPrice) : null;

    if ((type === Gate2SpotOrderType.LIMIT || type === Gate2SpotOrderType.STOP) && !price) {
      throw new BadRequestException('Limit and stop orders require a price');
    }
    if (type === Gate2SpotOrderType.STOP && !stopPrice) {
      throw new BadRequestException('Stop orders require a stop price');
    }
    if (type !== Gate2SpotOrderType.MARKET) await this.requireLiveQuote(pair.id, pair.symbol);
    if (type === Gate2SpotOrderType.MARKET) {
      const quote = await this.requireLiveQuote(pair.id, pair.symbol);
      const protection = await this.resolveMarketProtection(pair.symbol);
      price = input.side === OrderSide.BUY
        ? quote.price.mul(new Prisma.Decimal(1).add(protection))
        : quote.price.mul(new Prisma.Decimal(1).sub(protection));
    }

    const reserveAsset = input.side === OrderSide.BUY ? pair.quoteAsset.symbol : pair.baseAsset.symbol;
    const reserveNotional = input.side === OrderSide.BUY ? decimalProduct(amount, price!) : amount;
    // Seller fees are deducted from quote proceeds in executeTrade; only base quantity is reserved.
    const reserveAmount = input.side === OrderSide.BUY
      ? reserveNotional.mul(new Prisma.Decimal(1).add(feeRate))
      : amount;

    const order = await this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `spot:${userId}:${input.idempotencyKey}`);
      const replay = await tx.gate2SpotOrder.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
      });
      if (replay) return replay;
      const account = await this.getScopedAccount(userId, reserveAsset, accountScope, tx);
      await this.ledgerAuthority.reserve({
        accountId: account.id,
        asset: reserveAsset,
        amount: reserveAmount.toString(),
        referenceType: 'GATE2_SPOT_ORDER_RESERVE',
        referenceId: input.idempotencyKey,
        idempotencyKey: `gate2:spot:reserve:${input.idempotencyKey}`,
        correlationId: input.idempotencyKey,
        economicGroup: input.idempotencyKey,
        metadata: { pair: pair.symbol, side: input.side, type },
      }, tx);
      return tx.gate2SpotOrder.create({
        data: {
          id: randomUUID(),
          userId,
          pair: pair.symbol,
          baseAsset: pair.baseAsset.symbol,
          quoteAsset: pair.quoteAsset.symbol,
          side: input.side,
          type,
          amount,
          filled: new Prisma.Decimal(0),
          remaining: amount,
          price,
          stopPrice,
          reserveAsset,
          reserveScope: accountScope,
          reservedAmount: reserveAmount,
          feeRate,
          idempotencyKey: input.idempotencyKey,
          correlationId: input.idempotencyKey,
        },
      });
    });

    await this.matchOrders(order.pair);
    if (order.type === Gate2SpotOrderType.MARKET) await this.cancelMarketRemainder(order.id);
    await this.broadcastOrderBook(order.pair);
    const current = await this.prisma.gate2SpotOrder.findUnique({ where: { id: order.id } });
    return current ?? order;
  }

  private async placeOrderOnD1(userId: string, input: PlaceSpotOrderInput, amount: Prisma.Decimal, accountScope: LedgerAccountScope) {
    const pair = await this.d1!.getActiveMarketPair(input.pair);
    if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
    const type = input.type;
    const configuredFee = await this.d1!.getSystemConfigValue('gate2.spot.feeRate');
    const feeRate = configuredFee === null ? this.defaultFeeRate : assertNonNegativeDecimal(configuredFee);
    let price = input.price ? assertPositiveDecimal(input.price) : null;
    const stopPrice = input.stopPrice ? assertPositiveDecimal(input.stopPrice) : null;
    if ((type === Gate2SpotOrderType.LIMIT || type === Gate2SpotOrderType.STOP) && !price) throw new BadRequestException('Limit and stop orders require a price');
    if (type === Gate2SpotOrderType.STOP && !stopPrice) throw new BadRequestException('Stop orders require a stop price');
    const quote = await this.d1!.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
    if (type === Gate2SpotOrderType.MARKET) {
      const protectionValue = await this.d1!.getSystemConfigValue('gate2.spot.marketProtectionRate');
      const protection = protectionValue === null ? new Prisma.Decimal('0.02') : assertNonNegativeDecimal(protectionValue);
      if (protection.gte(1)) throw new BadRequestException('Market protection configuration is invalid');
      const livePrice = new Prisma.Decimal(quote.price);
      price = input.side === OrderSide.BUY ? livePrice.mul(new Prisma.Decimal(1).add(protection)) : livePrice.mul(new Prisma.Decimal(1).sub(protection));
    }
    const reserveAsset = input.side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset;
    const reserveNotional = input.side === OrderSide.BUY ? decimalProduct(amount, price!) : amount;
    const reserveAmount = input.side === OrderSide.BUY ? reserveNotional.mul(new Prisma.Decimal(1).add(feeRate)) : amount;
    const order = await this.d1!.reserveSpotOrder({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset, side: input.side, type, amount: amount.toString(), price: price?.toString() ?? null, stopPrice: stopPrice?.toString() ?? null, reserveAsset, reserveScope: accountScope, reservedAmount: reserveAmount.toString(), feeRate: feeRate.toString(), idempotencyKey: input.idempotencyKey, correlationId: input.idempotencyKey });
    for (let attempt = 0; attempt < 128; attempt += 1) if (!await this.d1!.matchSpotOrder({ pair: pair.symbol })) break;
    const current = await this.d1!.getSpotOrder(userId, String(order.id));
    if (type === Gate2SpotOrderType.MARKET && current && ['OPEN', 'PARTIALLY_FILLED'].includes(String(current.status))) await this.d1!.cancelSpotOrder(userId, String(order.id));
    return (await this.d1!.getSpotOrder(userId, String(order.id))) ?? order;
  }

  /**
   * Margin orchestration uses this inside its own transaction so collateral,
   * borrowing and order reservation share one atomic boundary.
   */
  async placeOrderInTransaction(userId: string, input: PlaceSpotOrderInput, tx: DbClient) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const existing = await tx.gate2SpotOrder.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return existing;
    const amount = assertPositiveDecimal(input.amount);
    const accountScope = input.accountScope ?? LedgerAccountScope.MAIN;
    const pair = await this.resolvePair(input.pair);
    const feeRate = await this.resolveFeeRate();
    let price = input.price ? assertPositiveDecimal(input.price) : null;
    if (!price) throw new BadRequestException('Transactional margin orders require a protected limit price');
    const reserveAsset = input.side === OrderSide.BUY ? pair.quoteAsset.symbol : pair.baseAsset.symbol;
    // Seller fees are deducted from quote proceeds in executeTrade; only base quantity is reserved.
    const reserveAmount = input.side === OrderSide.BUY
      ? decimalProduct(amount, price).mul(new Prisma.Decimal(1).add(feeRate))
      : amount;
    await this.lockCommand(tx, `spot:${userId}:${input.idempotencyKey}`);
    const account = await this.getScopedAccount(userId, reserveAsset, accountScope, tx);
    await this.ledgerAuthority.reserve({
      accountId: account.id, asset: reserveAsset, amount: reserveAmount.toString(),
      referenceType: 'GATE2_SPOT_ORDER_RESERVE', referenceId: input.idempotencyKey,
      idempotencyKey: `gate2:spot:reserve:${input.idempotencyKey}`,
      correlationId: input.idempotencyKey, economicGroup: input.idempotencyKey,
      metadata: { pair: pair.symbol, side: input.side, type: Gate2SpotOrderType.LIMIT },
    }, tx);
    return tx.gate2SpotOrder.create({
      data: {
        id: randomUUID(), userId, pair: pair.symbol, baseAsset: pair.baseAsset.symbol,
        quoteAsset: pair.quoteAsset.symbol, side: input.side, type: Gate2SpotOrderType.LIMIT,
        amount, filled: new Prisma.Decimal(0), remaining: amount, price,
        reserveAsset, reserveScope: accountScope, reservedAmount: reserveAmount, feeRate,
        idempotencyKey: input.idempotencyKey, correlationId: input.idempotencyKey,
      },
    });
  }

  async matchOrdersInTransaction(pairInput: string, tx: DbClient): Promise<void> {
    const pair = await this.resolvePair(pairInput);
    if (tx.$executeRaw) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pair.symbol}))`;
    const latestQuote = await tx.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
    await this.triggerStops(tx, pair.symbol, latestQuote);
    const eligibleStop = { type: Gate2SpotOrderType.STOP, triggeredAt: { not: null } };
    const buys = await tx.gate2SpotOrder.findMany({
      where: { pair: pair.symbol, side: OrderSide.BUY, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] }, OR: [{ type: { not: Gate2SpotOrderType.STOP } }, eligibleStop] },
      orderBy: [{ price: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const sells = await tx.gate2SpotOrder.findMany({
      where: { pair: pair.symbol, side: OrderSide.SELL, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] }, OR: [{ type: { not: Gate2SpotOrderType.STOP } }, eligibleStop] },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    for (const buy of buys) {
      for (const sell of sells) {
        if (buy.id === sell.id) continue;
        await this.lockOrderPair(tx, buy.id, sell.id);
        const currentBuy = await tx.gate2SpotOrder.findUnique({ where: { id: buy.id } });
        const currentSell = await tx.gate2SpotOrder.findUnique({ where: { id: sell.id } });
        if (!currentBuy || !currentSell || !this.isOpen(currentBuy.status) || !this.isOpen(currentSell.status)) continue;
        if (!currentBuy.price || !currentSell.price || currentBuy.price.lt(currentSell.price)) continue;
        const amount = Prisma.Decimal.min(currentBuy.remaining, currentSell.remaining);
        if (amount.gt(0)) await this.executeTrade(tx, currentBuy, currentSell, currentSell.price, amount, pair);
        if (currentBuy.remaining.lte(amount)) break;
      }
    }
  }

  async cancelOrder(userId: string, orderId: string) {
    if (this.d1?.isEnabled()) return this.d1.cancelSpotOrder(userId, orderId);
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockOrder(tx, orderId);
      const order = await tx.gate2SpotOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.userId !== userId) throw new BadRequestException('Order ownership mismatch');
      if (!spotTransitionAllowed(order.status, Gate2SpotOrderStatus.CANCELED)) {
        throw new BadRequestException('Order is already terminal');
      }
      const account = await this.getScopedAccount(userId, order.reserveAsset, order.reserveScope ?? LedgerAccountScope.MAIN, tx);
      if (order.reservedAmount.gt(0)) {
        await this.ledgerAuthority.release({
          accountId: account.id,
          asset: order.reserveAsset,
          amount: order.reservedAmount.toString(),
          referenceType: 'GATE2_SPOT_ORDER_CANCEL_RELEASE',
          referenceId: order.id,
          idempotencyKey: `gate2:spot:cancel-release:${order.id}`,
          correlationId: order.correlationId,
          economicGroup: order.correlationId,
        }, tx);
      }
      return tx.gate2SpotOrder.update({
        where: { id: order.id },
        data: { status: Gate2SpotOrderStatus.CANCELED, reservedAmount: new Prisma.Decimal(0) },
      });
    });
    await this.broadcastOrderBook(result.pair);
    return result;
  }

  async matchOrders(pairInput: string): Promise<void> {
    if (this.d1?.isEnabled()) {
      for (let attempt = 0; attempt < 128; attempt += 1) {
        if (!await this.d1.matchSpotOrder({ pair: pairInput.trim().toUpperCase().replaceAll('/', '') })) break;
      }
      return;
    }
    const pair = await this.resolvePair(pairInput);
    await this.prisma.$transaction(async (tx) => {
      // Serialize the matcher per pair so concurrent order submissions cannot
      // each match against a stale order-book snapshot.
      if (tx.$executeRaw) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${pair.symbol}))`;
      const latestQuote = await tx.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
      await this.triggerStops(tx, pair.symbol, latestQuote);
      const eligibleStop = { type: Gate2SpotOrderType.STOP, triggeredAt: { not: null } };
      const buys = await tx.gate2SpotOrder.findMany({
        where: { pair: pair.symbol, side: OrderSide.BUY, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] }, OR: [{ type: { not: Gate2SpotOrderType.STOP } }, eligibleStop] },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      const sells = await tx.gate2SpotOrder.findMany({
        where: { pair: pair.symbol, side: OrderSide.SELL, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] }, OR: [{ type: { not: Gate2SpotOrderType.STOP } }, eligibleStop] },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      });
      for (const buy of buys) {
        for (const sell of sells) {
          if (buy.id === sell.id) continue;
          await this.lockOrderPair(tx, buy.id, sell.id);
          const currentBuy = await tx.gate2SpotOrder.findUnique({ where: { id: buy.id } });
          const currentSell = await tx.gate2SpotOrder.findUnique({ where: { id: sell.id } });
          if (!currentBuy || !currentSell || !this.isOpen(currentBuy.status) || !this.isOpen(currentSell.status)) continue;
          if (!currentBuy.price || !currentSell.price || currentBuy.price.lt(currentSell.price)) continue;
          const amount = Prisma.Decimal.min(currentBuy.remaining, currentSell.remaining);
          if (amount.lte(0)) continue;
          await this.executeTrade(tx, currentBuy, currentSell, currentSell.price, amount, pair);
          if (currentBuy.remaining.lte(amount)) break;
        }
      }
    }, { maxWait: 10_000, timeout: 15_000 });
    await this.broadcastOrderBook(pair.symbol);
  }

  async getOrderBook(pairInput: string) {
    if (this.d1?.isEnabled()) return this.d1.getSpotOrderBook(pairInput);
    const pair = await this.resolvePair(pairInput);
    const [bids, asks] = await Promise.all([
      this.prisma.gate2SpotOrder.findMany({
        where: { pair: pair.symbol, side: OrderSide.BUY, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] } },
        orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
        take: 50,
      }),
      this.prisma.gate2SpotOrder.findMany({
        where: { pair: pair.symbol, side: OrderSide.SELL, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] } },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
        take: 50,
      }),
    ]);
    const internal = {
      pair: pair.symbol,
      bids: bids.map((order) => ({ orderId: order.id, price: order.price?.toString() ?? null, amount: order.remaining.toString() })),
      asks: asks.map((order) => ({ orderId: order.id, price: order.price?.toString() ?? null, amount: order.remaining.toString() })),
      state: bids.length > 0 || asks.length > 0 ? 'LIVE' as const : 'UNAVAILABLE' as const,
      source: 'nexi-internal-spot',
    };
    if (internal.bids.length > 0 || internal.asks.length > 0) return internal;

    const external = await this.prisma.marketDepthSnapshot.findFirst({
      where: { pairId: pair.id },
      orderBy: { observedAt: 'desc' },
      include: { levels: { orderBy: [{ side: 'asc' }, { levelIndex: 'asc' }], take: 100 } },
    });
    if (!external) return internal;
    const state = this.referenceState(external.observedAt);
    return {
      pair: pair.symbol,
      bids: external.levels.filter((level) => level.side === 'BID').map((level) => ({ orderId: level.id, price: level.price.toString(), amount: level.quantity.toString() })),
      asks: external.levels.filter((level) => level.side === 'ASK').map((level) => ({ orderId: level.id, price: level.price.toString(), amount: level.quantity.toString() })),
      state,
      source: 'external-reference',
      observedAt: external.observedAt,
    };
  }

  async getMarketTrades(pairInput: string) {
    if (this.d1?.isEnabled()) {
      const trades = await this.d1.listSpotTradesForPair(pairInput);
      return trades.map((trade) => ({
        id: trade.id,
        pair: trade.pair,
        price: String(trade.price),
        amount: String(trade.amount),
        executedAt: trade.createdAt,
        side: 'MATCHED' as const,
        source: 'nexi-internal-spot',
      }));
    }
    const pair = await this.resolvePair(pairInput);
    const trades = await this.prisma.gate2SpotTrade.findMany({
      where: { pair: pair.symbol },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    if (trades.length > 0) return trades.map((trade) => ({
      id: trade.id,
      pair: trade.pair,
      price: trade.price.toString(),
      amount: trade.amount.toString(),
      executedAt: trade.createdAt,
      side: 'MATCHED' as const,
      source: 'nexi-internal-spot',
    }));
    const external = await this.prisma.marketTrade.findMany({
      where: { pairId: pair.id },
      orderBy: { observedAt: 'desc' },
      take: 50,
    });
    return external.map((trade) => ({
      id: trade.id,
      pair: trade.symbol,
      price: trade.price.toString(),
      amount: trade.quantity.toString(),
      executedAt: trade.observedAt,
      side: trade.side,
      source: 'external-reference',
    }));
  }

  private referenceState(observedAt: Date): 'LIVE' | 'STALE' {
    const staleAfterMs = Number(process.env.MARKET_QUOTE_STALE_AFTER_MS ?? '30000');
    return Date.now() - observedAt.getTime() <= staleAfterMs ? 'LIVE' : 'STALE';
  }

  async getOpenOrders(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listSpotOrders(userId, true);
    return this.prisma.gate2SpotOrder.findMany({
      where: { userId, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderHistory(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listSpotOrders(userId, false);
    return this.prisma.gate2SpotOrder.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getTradeHistory(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listSpotTrades(userId);
    return this.prisma.gate2SpotTrade.findMany({
      where: { OR: [{ buyerOrder: { userId } }, { sellerOrder: { userId } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async executeTrade(tx: DbClient, buy: any, sell: any, price: Prisma.Decimal, amount: Prisma.Decimal, pair: any) {
    const fillKey = `gate2:spot:fill:${buy.id}:${sell.id}:${buy.filled.toString()}:${sell.filled.toString()}:${amount.toString()}`;
    const existing = await tx.gate2SpotTrade.findUnique({ where: { idempotencyKey: fillKey } });
    if (existing) return existing;
    const buyerFee = decimalProduct(amount, price).mul(buy.feeRate).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const sellerFee = decimalProduct(amount, price).mul(sell.feeRate).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const buyerReserved = decimalProduct(amount, buy.price!).mul(new Prisma.Decimal(1).add(buy.feeRate));
    const buyerUsed = decimalProduct(amount, price).add(buyerFee);
    const buyerRelease = buyerReserved.sub(buyerUsed);
    // Seller fees are charged from quote proceeds below, so base reservation equals the sold quantity.
    const sellerReserved = amount;
    const sellerUsed = amount;
    const sellerRelease = sellerReserved.sub(sellerUsed);

    const buyerScope = buy.reserveScope ?? LedgerAccountScope.MAIN;
    const sellerScope = sell.reserveScope ?? LedgerAccountScope.MAIN;
    const buyerAccount = await this.getScopedAccount(buy.userId, buy.reserveAsset, buyerScope, tx);
    const sellerAccount = await this.getScopedAccount(sell.userId, sell.reserveAsset, sellerScope, tx);
    const buyerBaseAccount = await this.getScopedAccount(buy.userId, pair.baseAsset.symbol, buyerScope, tx);
    const sellerQuoteAccount = await this.getScopedAccount(sell.userId, pair.quoteAsset.symbol, sellerScope, tx);
    await this.ledgerAuthority.settle({
      accountId: buyerAccount.id, asset: buy.reserveAsset, amount: buyerUsed.toString(),
      referenceType: 'GATE2_SPOT_FILL_BUYER', referenceId: fillKey,
      idempotencyKey: `${fillKey}:buyer:settle`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);
    if (buyerRelease.gt(0)) await this.ledgerAuthority.release({
      accountId: buyerAccount.id, asset: buy.reserveAsset, amount: buyerRelease.toString(),
      referenceType: 'GATE2_SPOT_FILL_BUYER_RELEASE', referenceId: fillKey,
      idempotencyKey: `${fillKey}:buyer:release`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);
    await this.ledgerAuthority.credit({
      accountId: buyerBaseAccount.id, asset: pair.baseAsset.symbol, amount: amount.toString(),
      referenceType: 'GATE2_SPOT_FILL_BUYER_CREDIT', referenceId: fillKey,
      idempotencyKey: `${fillKey}:buyer:credit`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);

    await this.ledgerAuthority.settle({
      accountId: sellerAccount.id, asset: sell.reserveAsset, amount: sellerUsed.toString(),
      referenceType: 'GATE2_SPOT_FILL_SELLER', referenceId: fillKey,
      idempotencyKey: `${fillKey}:seller:settle`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);
    if (sellerRelease.gt(0)) await this.ledgerAuthority.release({
      accountId: sellerAccount.id, asset: sell.reserveAsset, amount: sellerRelease.toString(),
      referenceType: 'GATE2_SPOT_FILL_SELLER_RELEASE', referenceId: fillKey,
      idempotencyKey: `${fillKey}:seller:release`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);
    await this.ledgerAuthority.credit({
      accountId: sellerQuoteAccount.id, asset: pair.quoteAsset.symbol, amount: decimalProduct(amount, price).sub(sellerFee).toString(),
      referenceType: 'GATE2_SPOT_FILL_SELLER_CREDIT', referenceId: fillKey,
      idempotencyKey: `${fillKey}:seller:credit`, correlationId: fillKey, economicGroup: fillKey,
    }, tx);

    const trade = await tx.gate2SpotTrade.create({
      data: {
        id: randomUUID(), buyerOrderId: buy.id, sellerOrderId: sell.id, pair: pair.symbol,
        baseAsset: pair.baseAsset.symbol, quoteAsset: pair.quoteAsset.symbol, price, amount,
        buyerFee, sellerFee, idempotencyKey: fillKey,
      },
    });
    const buyerRemaining = buy.remaining.sub(amount);
    const sellerRemaining = sell.remaining.sub(amount);
    await this.updateOrderAfterFill(tx, buy, buyerRemaining, buyerReserved);
    await this.updateOrderAfterFill(tx, sell, sellerRemaining, sellerReserved);
    return trade;
  }

  private async updateOrderAfterFill(tx: DbClient, order: any, remaining: Prisma.Decimal, reservedChunk: Prisma.Decimal) {
    const status = remaining.isZero()
      ? Gate2SpotOrderStatus.FILLED
      : order.remaining.eq(remaining)
        ? order.status
        : Gate2SpotOrderStatus.PARTIALLY_FILLED;
    const nextStatus = status === order.status && status === Gate2SpotOrderStatus.OPEN
      ? Gate2SpotOrderStatus.PARTIALLY_FILLED
      : status;
    await tx.gate2SpotOrder.update({
      where: { id: order.id },
      data: {
        filled: order.amount.sub(remaining),
        remaining,
        reservedAmount: Prisma.Decimal.max(new Prisma.Decimal(0), order.reservedAmount.sub(reservedChunk)),
        status: nextStatus,
      },
    });
  }

  private async resolvePair(input: string) {
    const normalized = input.trim().toUpperCase().replace(/\.US\/USDT$/, 'USDT').replaceAll('/', '').replaceAll('.', '');
    if (!/^[A-Z0-9._-]{4,32}$/.test(normalized)) throw new BadRequestException('Pair is invalid');
    const pair = await this.prisma.marketPair.findUnique({ where: { symbol: normalized }, include: { baseAsset: true, quoteAsset: true } });
    if (!pair || pair.status !== 'ACTIVE' || pair.baseAsset.status !== 'ACTIVE' || pair.quoteAsset.status !== 'ACTIVE') {
      throw new BadRequestException('Pair is unavailable or under maintenance');
    }
    const capabilities = await this.prisma.marketAssetCapability.findMany({
      where: { assetId: { in: [pair.baseAssetId, pair.quoteAssetId] }, tradingEnabled: true, status: 'ACTIVE' },
    });
    if (capabilities.length !== 2) throw new BadRequestException('Pair trading capability is unavailable');
    return pair;
  }

  private async requireLiveQuote(pairId: string, symbol: string): Promise<{ price: Prisma.Decimal; quoteId: string }> {
    const latest = await this.prisma.marketQuoteLatest.findUnique({ where: { pairId } });
    const staleAfterMs = Number(process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000);
    if (!latest || latest.state !== 'LIVE' || !latest.price || Date.now() - latest.receivedAt.getTime() > staleAfterMs) {
      throw new ServiceUnavailableException(`Live market quote unavailable for ${symbol}`);
    }
    return { price: latest.price, quoteId: latest.id };
  }

  private async resolveFeeRate(): Promise<Prisma.Decimal> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key: 'gate2.spot.feeRate' } });
    if (!config) return this.defaultFeeRate;
    return assertNonNegativeDecimal(config.value);
  }

  private async resolveMarketProtection(pair: string): Promise<Prisma.Decimal> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key: 'gate2.spot.marketProtectionRate' } });
    if (!config) return new Prisma.Decimal('0.02');
    const protection = assertNonNegativeDecimal(config.value);
    if (protection.gte(1)) throw new BadRequestException('Market protection configuration is invalid');
    return protection;
  }

  private async triggerStops(tx: DbClient, pair: string, quote: any): Promise<void> {
    if (!quote || quote.state !== 'LIVE' || !quote.price || !quote.observedAt) return;
    const staleAfterMs = Number(process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000);
    if (Date.now() - quote.receivedAt.getTime() > staleAfterMs) return;
    const stops = await tx.gate2SpotOrder.findMany({
      where: { pair, type: Gate2SpotOrderType.STOP, status: { in: [Gate2SpotOrderStatus.OPEN, Gate2SpotOrderStatus.PARTIALLY_FILLED] }, triggeredAt: null },
    });
    for (const stop of stops) {
      const crossed = stop.side === OrderSide.BUY ? quote.price.gte(stop.stopPrice) : quote.price.lte(stop.stopPrice);
      if (!crossed) continue;
      await tx.gate2SpotOrder.update({
        where: { id: stop.id },
        data: { triggeredAt: new Date(), triggerQuoteId: quote.id, triggerProvider: quote.provider, triggerSource: quote.source, triggerObservedAt: quote.observedAt, triggerSequence: quote.sequence },
      });
    }
  }

  private async cancelMarketRemainder(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockOrder(tx, orderId);
      const order = await tx.gate2SpotOrder.findUnique({ where: { id: orderId } });
      if (!order || order.type !== Gate2SpotOrderType.MARKET || !this.isOpen(order.status)) return;
      const account = await this.getScopedAccount(order.userId, order.reserveAsset, order.reserveScope ?? LedgerAccountScope.MAIN, tx);
      if (order.reservedAmount.gt(0)) await this.ledgerAuthority.release({
        accountId: account.id, asset: order.reserveAsset, amount: order.reservedAmount.toString(),
        referenceType: 'GATE2_SPOT_MARKET_REMAINDER_RELEASE', referenceId: order.id,
        idempotencyKey: `gate2:spot:market-remainder:${order.id}`, correlationId: order.correlationId, economicGroup: order.correlationId,
      }, tx);
      await tx.gate2SpotOrder.update({ where: { id: order.id }, data: { status: Gate2SpotOrderStatus.CANCELED, reservedAmount: new Prisma.Decimal(0) } });
    });
  }

  private async lockCommand(tx: DbClient, key: string): Promise<void> {
    if (tx.$executeRaw) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  private async getScopedAccount(userId: string, asset: string, scope: LedgerAccountScope, tx: DbClient) {
    return scope === LedgerAccountScope.MAIN
      ? this.ledgerAuthority.getAccountForUser(userId, asset, tx)
      : this.ledgerAuthority.getAccountForUserInScope(userId, asset, scope, tx);
  }

  private isOpen(status: Gate2SpotOrderStatus): boolean {
    return status === Gate2SpotOrderStatus.OPEN || status === Gate2SpotOrderStatus.PARTIALLY_FILLED;
  }

  private async lockOrder(tx: DbClient, id: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "Gate2SpotOrder" WHERE "id" = ${id} FOR UPDATE`;
  }

  private async lockOrderPair(tx: DbClient, firstId: string, secondId: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "Gate2SpotOrder" WHERE "id" IN (${Prisma.join([firstId, secondId])}) ORDER BY "id" FOR UPDATE`;
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }

  private async broadcastOrderBook(pair: string): Promise<void> {
    const book = this.d1?.isEnabled()
      ? await this.d1.getSpotOrderBook(pair)
      : await this.getOrderBook(pair);
    this.spotGateway.emitOrderBookUpdate(pair, book);
  }
}
