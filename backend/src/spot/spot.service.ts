import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Gate2SpotOrderType, LedgerAccountScope, OrderSide, Prisma } from '../prisma/d1-client';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { assertNonNegativeDecimal, assertPositiveDecimal, decimalProduct } from '../gate2/gate2-rules';
import { SpotGateway } from './spot.gateway';

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

@Injectable()
export class SpotService {
  private readonly defaultFeeRate = new Prisma.Decimal('0.001');

  constructor(
    private readonly d1: D1FinancialCommandGateway,
    private readonly spotGateway: SpotGateway,
  ) {}

  async placeOrder(userId: string, input: PlaceSpotOrderInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.amount);
    const accountScope = input.accountScope ?? LedgerAccountScope.SPOT;
    // Resolve the original immutable intent before recalculating a MARKET
    // protection price or rechecking a quote/configuration that may have changed.
    const replay = await this.d1.getSpotOrderByIntent(userId, input.idempotencyKey);
    if (replay) {
      const sameOptionalDecimal = (stored: unknown, requested?: string) =>
        requested === undefined || requested === null || requested === ''
          ? stored === null || stored === undefined
          : stored !== null && stored !== undefined &&
            new Prisma.Decimal(String(stored)).eq(new Prisma.Decimal(requested));
      const normalizedPair = input.pair.trim().toUpperCase().replaceAll('/', '');
      const sameTerms =
        String(replay.pair).toUpperCase().replaceAll('/', '') === normalizedPair &&
        String(replay.side) === input.side &&
        String(replay.type) === input.type &&
        new Prisma.Decimal(String(replay.amount)).eq(amount) &&
        String(replay.reserveScope ?? LedgerAccountScope.SPOT) === accountScope &&
        (input.type === Gate2SpotOrderType.MARKET || sameOptionalDecimal(replay.price, input.price)) &&
        sameOptionalDecimal(replay.stopPrice, input.stopPrice);
      if (!sameTerms) {
        throw new BadRequestException('Spot order idempotency key was reused with different parameters');
      }
      return replay;
    }
    const order = await this.placeOrderOnD1(userId, input, amount, accountScope);
    await this.broadcastOrderBook(input.pair);
    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.d1.cancelSpotOrder(userId, orderId);
    await this.broadcastOrderBook(String(order.pair));
    return order;
  }

  async matchOrders(pairInput: string): Promise<void> {
    const pair = pairInput.trim().toUpperCase().replaceAll('/', '');
    for (let attempt = 0; attempt < 128; attempt += 1) {
      if (!await this.d1.matchSpotOrder({ pair })) break;
    }
    await this.broadcastOrderBook(pair);
  }

  getOrderBook(pairInput: string) {
    return this.d1.getSpotOrderBook(pairInput);
  }

  async getMarketTrades(pairInput: string) {
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

  getOwnedOrder(userId: string, orderId: string) {
    if (typeof orderId !== 'string' || !/^[A-Za-z0-9._:-]{1,180}$/.test(orderId)) {
      throw new BadRequestException('Spot order identifier is invalid');
    }
    return this.d1.getSpotOrder(userId, orderId);
  }

  getOrderByIntent(userId: string, idempotencyKey: string) {
    this.assertIdempotencyKey(idempotencyKey);
    return this.d1.getSpotOrderByIntent(userId, idempotencyKey);
  }

  getOpenOrders(userId: string) {
    return this.d1.listSpotOrders(userId, true);
  }

  async getOrderHistory(userId: string) {
    const [orders, trades] = await Promise.all([
      this.d1.listSpotOrders(userId, false),
      this.d1.listSpotTrades(userId),
    ]);
    const executions = new Map<string, { base: Prisma.Decimal; quote: Prisma.Decimal }>();
    for (const trade of trades) {
      const quantity = new Prisma.Decimal(String(trade.amount));
      const quote = quantity.mul(new Prisma.Decimal(String(trade.price)));
      for (const orderId of [trade.buyerOrderId, trade.sellerOrderId]) {
        if (typeof orderId !== 'string') continue;
        const prior = executions.get(orderId);
        executions.set(orderId, {
          base: (prior?.base ?? new Prisma.Decimal(0)).add(quantity),
          quote: (prior?.quote ?? new Prisma.Decimal(0)).add(quote),
        });
      }
    }
    return orders.map((order) => {
      const execution = executions.get(String(order.id));
      return {
        ...order,
        executedBase: execution?.base.toString() ?? '0',
        executedQuote: execution?.quote.toString() ?? '0',
        averageExecutionPrice: execution && execution.base.gt(0)
          ? execution.quote.div(execution.base).toString()
          : null,
      };
    });
  }

  getTradeHistory(userId: string) {
    return this.d1.listSpotTrades(userId);
  }

  private async placeOrderOnD1(
    userId: string,
    input: PlaceSpotOrderInput,
    amount: Prisma.Decimal,
    accountScope: LedgerAccountScope,
  ) {
    const pair = await this.d1.getActiveMarketPair(input.pair);
    if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
    const configuredFee = await this.d1.getSystemConfigValue('gate2.spot.feeRate');
    const feeRate = configuredFee === null ? this.defaultFeeRate : assertNonNegativeDecimal(configuredFee);
    let price = input.price ? assertPositiveDecimal(input.price) : null;
    const stopPrice = input.stopPrice ? assertPositiveDecimal(input.stopPrice) : null;
    if ((input.type === Gate2SpotOrderType.LIMIT || input.type === Gate2SpotOrderType.STOP) && !price) {
      throw new BadRequestException('Limit and stop orders require a price');
    }
    if (input.type === Gate2SpotOrderType.STOP && !stopPrice) {
      throw new BadRequestException('Stop orders require a stop price');
    }
    const quote = await this.d1.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
    if (input.type === Gate2SpotOrderType.MARKET) {
      const protectionValue = await this.d1.getSystemConfigValue('gate2.spot.marketProtectionRate');
      const protection = protectionValue === null ? new Prisma.Decimal('0.02') : assertNonNegativeDecimal(protectionValue);
      if (protection.gte(1)) throw new BadRequestException('Market protection configuration is invalid');
      const livePrice = new Prisma.Decimal(quote.price);
      price = input.side === OrderSide.BUY
        ? livePrice.mul(new Prisma.Decimal(1).add(protection))
        : livePrice.mul(new Prisma.Decimal(1).sub(protection));
    }
    const reserveAsset = input.side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset;
    const reserveNotional = input.side === OrderSide.BUY ? decimalProduct(amount, price!) : amount;
    const reservedAmount = input.side === OrderSide.BUY
      ? reserveNotional.mul(new Prisma.Decimal(1).add(feeRate))
      : amount;
    const order = await this.d1.reserveSpotOrder({
      userId,
      pair: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      side: input.side,
      type: input.type,
      amount: amount.toString(),
      price: price?.toString() ?? null,
      stopPrice: stopPrice?.toString() ?? null,
      reserveAsset,
      reserveScope: accountScope,
      reservedAmount: reservedAmount.toString(),
      feeRate: feeRate.toString(),
      idempotencyKey: input.idempotencyKey,
      correlationId: input.idempotencyKey,
    });
    for (let attempt = 0; attempt < 128; attempt += 1) {
      if (!await this.d1.matchSpotOrder({ pair: pair.symbol })) break;
    }
    const current = await this.d1.getSpotOrder(userId, String(order.id));
    if (input.type === Gate2SpotOrderType.MARKET && current && ['OPEN', 'PARTIALLY_FILLED'].includes(String(current.status))) {
      await this.d1.cancelSpotOrder(userId, String(order.id));
    }
    return (await this.d1.getSpotOrder(userId, String(order.id))) ?? order;
  }

  private async broadcastOrderBook(pair: string): Promise<void> {
    this.spotGateway.emitOrderBookUpdate(pair, await this.d1.getSpotOrderBook(pair));
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }
}
