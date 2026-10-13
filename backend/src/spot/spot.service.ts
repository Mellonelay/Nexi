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

  getOpenOrders(userId: string) {
    return this.d1.listSpotOrders(userId, true);
  }

  getOrderHistory(userId: string) {
    return this.d1.listSpotOrders(userId, false);
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
