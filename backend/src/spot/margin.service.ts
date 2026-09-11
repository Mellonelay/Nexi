import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { LedgerAccountScope, Prisma, SpotMarginPositionStatus } from '../prisma/d1-client';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { assertNonNegativeDecimal } from '../gate2/gate2-rules';
import { Gate2SpotOrderType, OrderSide } from '../prisma/d1-client';
import { MarginPositionDirection, MarginTransferDirection, MarginTransferDto, OpenMarginPositionDto } from './margin.dto';
import { isLiquidatable, marginPnl, simpleInterest } from './margin.calculations';

@Injectable()
export class MarginService {
  constructor(private readonly d1: D1FinancialCommandGateway) {}

  async transfer(userId: string, input: MarginTransferDto) {
    const pair = await this.requirePair(input.pair);
    if (input.asset !== pair.baseAsset && input.asset !== pair.quoteAsset) {
      throw new BadRequestException('Transfer asset must belong to the isolated pair');
    }
    const amount = this.decimal(input.amount);
    const account = await this.d1.ensureMarginAccount({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset });
    const main = await this.d1.getAccountForUser(userId, input.asset, 'MAIN');
    const margin = await this.d1.getAccountForUser(userId, input.asset, 'MARGIN');
    const toMargin = input.direction === MarginTransferDirection.TO_MARGIN;
    const result = await this.d1.pairedTransfer({
      debitAccountId: toMargin ? main.id : margin.id,
      creditAccountId: toMargin ? margin.id : main.id,
      asset: input.asset,
      amount: amount.toString(),
      referenceType: 'SPOT_MARGIN_TRANSFER',
      referenceId: account.id,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.idempotencyKey,
      economicGroup: account.id,
      marginActivity: {
        activityId: crypto.randomUUID(), userId, accountId: account.id,
        type: toMargin ? 'TRANSFER_IN' : 'TRANSFER_OUT', status: 'COMPLETED',
        details: { pair: pair.symbol, asset: input.asset, amount: amount.toString() },
      },
    });
    return { accountId: account.id, ...result };
  }

  async openPosition(userId: string, input: OpenMarginPositionDto) {
    const pair = await this.requirePair(input.pair);
    const quote = await this.requireQuote(pair.id, pair.symbol);
    const collateral = this.decimal(input.collateral);
    const leverage = Number(input.leverage);
    await this.assertConfiguredLeverage(leverage);
    const notional = collateral.mul(leverage);
    const quantity = notional.div(new Prisma.Decimal(quote.price)).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const debtAsset = input.direction === MarginPositionDirection.LONG ? pair.quoteAsset : pair.baseAsset;
    const debtPrincipal = input.direction === MarginPositionDirection.LONG ? collateral.mul(leverage - 1) : quantity;
    const account = await this.d1.ensureMarginAccount({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset });
    const borrowed = await this.d1.getAccountForUser(userId, debtAsset, 'MARGIN');
    await this.d1.credit({ accountId: borrowed.id, asset: debtAsset, amount: debtPrincipal.toString(), referenceType: 'SPOT_MARGIN_BORROW', referenceId: input.idempotencyKey, idempotencyKey: `margin:borrow:${input.idempotencyKey}`, correlationId: input.idempotencyKey, economicGroup: account.id, metadata: { pair: pair.symbol, direction: input.direction, leverage } });
    const feeValue = await this.d1.getSystemConfigValue('gate2.spot.feeRate');
    const feeRate = feeValue === null ? new Prisma.Decimal('0.001') : assertNonNegativeDecimal(feeValue);
    const reserveAsset = input.direction === MarginPositionDirection.LONG ? pair.quoteAsset : pair.baseAsset;
    const reserveAmount = input.direction === MarginPositionDirection.LONG ? quantity.mul(new Prisma.Decimal(quote.price)).mul(new Prisma.Decimal(1).add(feeRate)) : quantity;
    const order = await this.d1.reserveSpotOrder({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset, side: input.direction === MarginPositionDirection.LONG ? OrderSide.BUY : OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: quantity.toString(), price: quote.price, stopPrice: null, reserveAsset, reserveScope: LedgerAccountScope.MARGIN, reservedAmount: reserveAmount.toString(), feeRate: feeRate.toString(), idempotencyKey: `margin:entry:${input.idempotencyKey}`, correlationId: input.idempotencyKey });
    for (let attempt = 0; attempt < 128; attempt += 1) if (!await this.d1.matchSpotOrder({ pair: pair.symbol })) break;
    const filled: any = await this.d1.getSpotOrder(userId, String(order.id));
    return this.d1.createMarginPosition({ positionId: crypto.randomUUID(), accountId: account.id, userId, direction: input.direction, leverage, collateral: collateral.toString(), quantity: String(filled?.filled ?? '0'), entryPrice: String(filled?.price ?? quote.price), markPrice: String(filled?.price ?? quote.price), status: filled?.status === 'FILLED' ? SpotMarginPositionStatus.OPEN : SpotMarginPositionStatus.PENDING, debtAsset, debtPrincipal: debtPrincipal.toString(), openIdempotencyKey: input.idempotencyKey, entryOrderId: String(order.id), pair: pair.symbol, positionAsset: pair.baseAsset, activityId: crypto.randomUUID(), positionEventId: crypto.randomUUID() });
  }

  listPositions(userId: string, status?: SpotMarginPositionStatus) {
    return this.d1.listMarginPositions(userId, status);
  }

  async getAccountSummary(userId: string, pairInput: string) {
    const pair = await this.requirePair(pairInput);
    const account = await this.d1.getMarginAccount(userId, pair.symbol);
    if (!account) throw new NotFoundException('Margin account not found');
    const quote = await this.d1.getLiveMarketQuote(pair.id);
    const positions = await this.d1.listMarginPositions(userId);
    return { accountId: account.id, pair: pair.symbol, quoteState: quote?.state ?? 'UNAVAILABLE', markPrice: quote?.price ?? null, positions: positions.filter((position) => position.accountId === account.id) };
  }

  async getQuote(pairInput: string) {
    const pair = await this.requirePair(pairInput);
    const quote = await this.requireQuote(pair.id, pair.symbol);
    return { pair: pair.symbol, state: quote.state, price: String(quote.price), quoteId: quote.id, provider: quote.provider, source: quote.source, observedAt: quote.observedAt, receivedAt: quote.receivedAt, maintenanceRatio: (await this.resolveMaintenanceRatio()).toString(), leverageOptions: await this.resolveAllowedLeverages() };
  }

  history(userId: string, take = 50) {
    return this.d1.listMarginActivities(userId, take);
  }

  async markPosition(userId: string, positionId: string) {
    const position: any = await this.d1.getMarginPosition(positionId, userId);
    if (!position || position.status !== SpotMarginPositionStatus.OPEN) throw new NotFoundException('Open margin position not found');
    const pair = await this.d1.getActiveMarketPair(String(position.accountPair ?? position.pair ?? ''));
    const quote = pair ? await this.d1.getLiveMarketQuote(pair.id) : null;
    if (!pair || !quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${position.pair ?? ''}`);
    const pnl = marginPnl(String(position.direction) as MarginPositionDirection, new Prisma.Decimal(String(position.quantity)), new Prisma.Decimal(String(position.entryPrice)), new Prisma.Decimal(quote.price));
    return this.d1.markMarginPosition(positionId, userId, quote.id, quote.price, pnl.toString());
  }

  closePosition(userId: string, positionId: string, idempotencyKey: string) {
    return this.closePositionOnD1(userId, positionId, idempotencyKey, false);
  }

  liquidatePosition(userId: string, positionId: string, idempotencyKey: string) {
    return this.closePositionOnD1(userId, positionId, idempotencyKey, true);
  }

  async accrueInterest(positionId: string, annualRate: string, elapsedSeconds: number, idempotencyKey: string) {
    const position: any = await this.d1.getMarginPosition(positionId);
    if (!position || String(position.status) !== 'OPEN') throw new NotFoundException('Open margin position not found');
    const interest = simpleInterest(new Prisma.Decimal(String(position.debtPrincipal)), new Prisma.Decimal(annualRate), elapsedSeconds);
    return this.d1.accrueMarginInterest(positionId, String(position.accountUserId ?? ''), interest.toString(), annualRate, elapsedSeconds, idempotencyKey);
  }

  private async closePositionOnD1(userId: string, positionId: string, idempotencyKey: string, liquidation: boolean) {
    const position: any = await this.d1.getMarginPosition(positionId, userId);
    if (!position || !['OPEN', 'CLOSING'].includes(String(position.status))) throw new NotFoundException('Open margin position not found');
    const ratio = liquidation ? await this.resolveMaintenanceRatio() : null;
    if (liquidation && !isLiquidatable(new Prisma.Decimal(String(position.collateral)), new Prisma.Decimal(String(position.unrealizedPnl)), new Prisma.Decimal(String(position.interestAccrued)), ratio!)) throw new BadRequestException('Margin position is above the liquidation threshold');
    const pair = await this.requirePair(String(position.accountPair));
    const quote = await this.requireQuote(pair.id, pair.symbol);
    const side = String(position.direction) === MarginPositionDirection.LONG ? OrderSide.SELL : OrderSide.BUY;
    const order = await this.d1.reserveSpotOrder({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset, side, type: Gate2SpotOrderType.LIMIT, amount: String(position.quantity), price: quote.price, stopPrice: null, reserveAsset: side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset, reserveScope: LedgerAccountScope.MARGIN, reservedAmount: side === OrderSide.BUY ? new Prisma.Decimal(String(position.quantity)).mul(new Prisma.Decimal(quote.price)).toString() : String(position.quantity), feeRate: '0', idempotencyKey: `margin:${liquidation ? 'liquidation' : 'close'}:${idempotencyKey}`, correlationId: idempotencyKey });
    await this.d1.markMarginClosing(positionId, userId, String(position.accountId), crypto.randomUUID(), String(order.id), idempotencyKey, liquidation);
    for (let attempt = 0; attempt < 128; attempt += 1) if (!await this.d1.matchSpotOrder({ pair: pair.symbol })) break;
    const filled: any = await this.d1.getSpotOrder(userId, String(order.id));
    if (!filled || String(filled.status) !== 'FILLED') return { positionId, closeOrderId: order.id, state: 'CLOSING', replayed: false };
    const closePrice = new Prisma.Decimal(String(filled.price ?? quote.price));
    const pnl = marginPnl(String(position.direction) as MarginPositionDirection, new Prisma.Decimal(String(position.quantity)), new Prisma.Decimal(String(position.entryPrice)), closePrice);
    const repayment = new Prisma.Decimal(String(position.debtPrincipal)).add(new Prisma.Decimal(String(position.interestAccrued ?? '0')));
    return this.d1.settleMarginClose({ positionId, userId, closeOrderId: String(filled.id), state: liquidation ? 'LIQUIDATED' : 'CLOSED', markPrice: closePrice.toString(), realizedPnl: pnl.toString(), repayment: repayment.toString(), debtAsset: String(position.debtAsset), activityId: crypto.randomUUID(), idempotencyKey, correlationId: idempotencyKey, maintenanceRatio: ratio?.toString() });
  }

  private async requirePair(value: string) {
    const pair = await this.d1.getActiveMarketPair(value);
    if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
    return pair;
  }

  private async requireQuote(pairId: string, symbol: string) {
    const quote = await this.d1.getLiveMarketQuote(pairId);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${symbol}`);
    return quote;
  }

  private async resolveAllowedLeverages(): Promise<number[]> {
    const raw = await this.d1.getSystemConfigValue('gate2.margin.leverages');
    const values = String(raw ?? '2,3,5').split(',').map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    const unique = [...new Set(values)].sort((a, b) => a - b);
    if (!unique.length) throw new BadRequestException('Margin leverage configuration is invalid');
    return unique;
  }

  private async assertConfiguredLeverage(leverage: number): Promise<void> {
    if (!(await this.resolveAllowedLeverages()).includes(leverage)) throw new BadRequestException('Margin leverage is not supported');
  }

  private async resolveMaintenanceRatio() {
    const ratio = new Prisma.Decimal((await this.d1.getSystemConfigValue('gate2.margin.maintenanceRatio')) ?? '0.5');
    if (ratio.isNegative() || ratio.gte(1)) throw new BadRequestException('Margin maintenance configuration is invalid');
    return ratio;
  }

  private decimal(value: string) {
    const decimal = new Prisma.Decimal(value);
    if (!decimal.isFinite() || decimal.isNegative() || decimal.isZero()) throw new BadRequestException('Amount must be a positive decimal');
    return decimal;
  }
}
