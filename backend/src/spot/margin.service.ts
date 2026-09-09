import { BadRequestException, Injectable, NotFoundException, Optional, ServiceUnavailableException } from '@nestjs/common';
import { LedgerAccountScope, Prisma, SpotMarginActivityStatus, SpotMarginEventType, SpotMarginPositionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpotService } from './spot.service';
import { Gate2SpotOrderType, OrderSide } from '@prisma/client';
import { MarginLeverage, MarginPositionDirection, MarginTransferDirection, MarginTransferDto, OpenMarginPositionDto } from './margin.dto';
import { isLiquidatable, marginPnl, simpleInterest } from './margin.calculations';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { assertNonNegativeDecimal } from '../gate2/gate2-rules';

type DbClient = PrismaService | any;

@Injectable()
export class MarginService {
  constructor(private readonly prisma: PrismaService, private readonly ledger: LedgerAuthorityService, @Optional() private readonly spot?: SpotService, @Optional() private readonly d1?: D1FinancialCommandGateway) {}

  async transfer(userId: string, input: MarginTransferDto) {
    const pair = await this.resolvePair(input.pair);
    if (input.asset !== pair.baseAsset.symbol && input.asset !== pair.quoteAsset.symbol) {
      throw new BadRequestException('Transfer asset must belong to the isolated pair');
    }
    const amount = this.decimal(input.amount);
    if (this.d1?.isEnabled()) {
      const account = await this.d1.ensureMarginAccount({ userId, pair: pair.symbol, baseAsset: pair.baseAsset.symbol, quoteAsset: pair.quoteAsset.symbol });
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
          activityId: randomUUID(), userId, accountId: account.id,
          type: toMargin ? SpotMarginEventType.TRANSFER_IN : SpotMarginEventType.TRANSFER_OUT,
          status: SpotMarginActivityStatus.COMPLETED,
          details: { pair: pair.symbol, asset: input.asset, amount: amount.toString() },
        },
      });
      return { accountId: account.id, ...result };
    }
    const account = await this.ensureAccount(userId, pair, this.prisma);
    if (input.direction === MarginTransferDirection.FROM_MARGIN) {
      const activePositions = await this.prisma.spotMarginPosition.count({ where: { accountId: account.id, status: { in: [SpotMarginPositionStatus.PENDING, SpotMarginPositionStatus.OPEN, SpotMarginPositionStatus.CLOSING] } } });
      if (activePositions > 0) throw new BadRequestException('Margin funds cannot leave an account with an active isolated position');
    }
    return this.prisma.$transaction(async (tx) => {
      const main = await this.ledger.getAccountForUserInScope(userId, input.asset, LedgerAccountScope.MAIN, tx);
      const margin = await this.ledger.getAccountForUserInScope(userId, input.asset, LedgerAccountScope.MARGIN, tx);
      const toMargin = input.direction === MarginTransferDirection.TO_MARGIN;
      const result = await this.ledger.pairedTransfer({
        debitAccountId: toMargin ? main.id : margin.id,
        creditAccountId: toMargin ? margin.id : main.id,
        asset: input.asset,
        amount: amount.toString(),
        referenceType: 'SPOT_MARGIN_TRANSFER',
        referenceId: account.id,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.idempotencyKey,
        economicGroup: account.id,
      }, tx);
      const activity = await tx.spotMarginActivity.upsert({
        where: { idempotencyKey: input.idempotencyKey },
        update: {},
        create: { id: randomUUID(), userId, accountId: account.id, type: toMargin ? SpotMarginEventType.TRANSFER_IN : SpotMarginEventType.TRANSFER_OUT, status: SpotMarginActivityStatus.COMPLETED, idempotencyKey: input.idempotencyKey, details: { pair: pair.symbol, asset: input.asset, amount: amount.toString(), debitPostingId: result.debitPostingId, creditPostingId: result.creditPostingId } },
      });
      return { accountId: account.id, activityId: activity.id, ...result };
    }, { maxWait: 10_000, timeout: 15_000 });
  }

  async openPosition(userId: string, input: OpenMarginPositionDto) {
    if (this.d1?.isEnabled()) return this.openPositionOnD1(userId, input);
    const existing = await this.prisma.spotMarginPosition.findUnique({ where: { openIdempotencyKey: input.idempotencyKey } });
    if (existing) return { ...existing, replayed: true };
    const pair = await this.resolvePair(input.pair);
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    const collateral = this.decimal(input.collateral);
    const leverage = Number(input.leverage);
    await this.assertConfiguredLeverage(leverage);
    const account = await this.ensureAccount(userId, pair, this.prisma);

    return this.prisma.$transaction(async (tx) => {
      if (!this.spot) throw new ServiceUnavailableException('Spot execution authority is unavailable');
      const notional = collateral.mul(leverage);
      const quantity = notional.div(quote.price).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
      const debtAsset = input.direction === MarginPositionDirection.LONG ? pair.quoteAsset.symbol : pair.baseAsset.symbol;
      const debtPrincipal = input.direction === MarginPositionDirection.LONG ? collateral.mul(leverage - 1) : quantity;
      const borrowed = await this.ledger.getAccountForUserInScope(userId, debtAsset, LedgerAccountScope.MARGIN, tx);
      await this.ledger.credit({ accountId: borrowed.id, asset: debtAsset, amount: debtPrincipal.toString(), referenceType: 'SPOT_MARGIN_BORROW', referenceId: input.idempotencyKey, idempotencyKey: `margin:borrow:${input.idempotencyKey}`, correlationId: input.idempotencyKey, economicGroup: account.id, metadata: { pair: pair.symbol, direction: input.direction, leverage } }, tx);
      const order = await this.spot.placeOrderInTransaction(userId, { pair: pair.symbol, side: input.direction === MarginPositionDirection.LONG ? OrderSide.BUY : OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: quantity.toString(), price: quote.price.toString(), idempotencyKey: `margin:entry:${input.idempotencyKey}`, accountScope: LedgerAccountScope.MARGIN }, tx);
      await this.spot.matchOrdersInTransaction(pair.symbol, tx);
      const filledOrder = await tx.gate2SpotOrder.findUnique({ where: { id: order.id } });
      const position = await tx.spotMarginPosition.create({ data: { id: randomUUID(), accountId: account.id, direction: input.direction, leverage, collateral, entryPrice: quote.price, markPrice: quote.price, status: filledOrder?.status === 'FILLED' ? SpotMarginPositionStatus.OPEN : SpotMarginPositionStatus.PENDING, quantity: filledOrder?.filled ?? new Prisma.Decimal(0), debtAsset, debtPrincipal, openIdempotencyKey: input.idempotencyKey, entryOrderId: order.id } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId: position.id, type: SpotMarginEventType.COLLATERAL_RESERVE, asset: pair.quoteAsset.symbol, amount: collateral, price: quote.price, idempotencyKey: `margin:event:reserve:${input.idempotencyKey}`, metadata: { pair: pair.symbol } } });
      await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: account.id, positionId: position.id, type: SpotMarginEventType.OPEN, status: SpotMarginActivityStatus.ACCEPTED, idempotencyKey: input.idempotencyKey, details: { pair: pair.symbol, direction: input.direction, leverage, collateral: collateral.toString(), entryPrice: quote.price.toString(), state: 'PENDING_SPOT_EXECUTION' } } });
      return { ...position, replayed: false, state: position.status === SpotMarginPositionStatus.OPEN ? 'OPEN' : 'PENDING_SPOT_EXECUTION', entryOrderId: order.id };
    }, { maxWait: 10_000, timeout: 15_000 });
  }

  async listPositions(userId: string, status?: SpotMarginPositionStatus) {
    if (this.d1?.isEnabled()) return this.d1.listMarginPositions(userId, status);
    await this.reconcilePendingPositions(userId);
    await this.reconcileClosingPositions(userId);
    return this.prisma.spotMarginPosition.findMany({ where: { account: { userId }, ...(status ? { status } : {}) }, include: { account: true }, orderBy: { openedAt: 'desc' } });
  }

  private async reconcilePendingPositions(userId: string) {
    const pending = await this.prisma.spotMarginPosition.findMany({ where: { account: { userId }, status: SpotMarginPositionStatus.PENDING, entryOrderId: { not: null } }, select: { id: true, entryOrderId: true } });
    for (const position of pending) {
      const order = await this.prisma.gate2SpotOrder.findUnique({ where: { id: position.entryOrderId! }, select: { status: true } });
      if (order?.status === 'FILLED') await this.activateFromSpotFill(position.id, position.entryOrderId!);
    }
  }

  private async reconcileClosingPositions(userId: string) {
    const closing = await this.prisma.spotMarginPosition.findMany({
      where: { account: { userId }, status: SpotMarginPositionStatus.CLOSING },
      include: { account: true },
    });
    for (const position of closing) {
      const activity = await this.prisma.spotMarginActivity.findFirst({
        where: { positionId: position.id, type: SpotMarginEventType.CLOSE, status: SpotMarginActivityStatus.ACCEPTED },
        orderBy: { createdAt: 'desc' },
      });
      const details = activity?.details;
      const closeOrderId = details && typeof details === 'object' && 'closeOrderId' in details ? String((details as Record<string, unknown>).closeOrderId) : null;
      if (!activity || !closeOrderId) continue;
      const order = await this.prisma.gate2SpotOrder.findUnique({ where: { id: closeOrderId } });
      if (!order || order.status !== 'FILLED' || !order.price) continue;
      await this.prisma.$transaction(async (tx) => {
        const currentActivity = await tx.spotMarginActivity.findUnique({ where: { id: activity.id } });
        if (!currentActivity || currentActivity.status === SpotMarginActivityStatus.COMPLETED) return;
        const current = await tx.spotMarginPosition.findUnique({ where: { id: position.id }, include: { account: true } });
        if (!current || current.status !== SpotMarginPositionStatus.CLOSING) return;
        const repayment = current.debtPrincipal.add(current.interestAccrued);
        const debtAccount = await this.ledger.getAccountForUserInScope(userId, current.debtAsset, LedgerAccountScope.MARGIN, tx);
        if (repayment.gt(0)) await this.ledger.debit({ accountId: debtAccount.id, asset: current.debtAsset, amount: repayment.toString(), referenceType: 'SPOT_MARGIN_REPAYMENT', referenceId: current.id, idempotencyKey: `margin:repay:${activity.idempotencyKey}`, correlationId: activity.idempotencyKey, economicGroup: current.accountId }, tx);
        const pnl = marginPnl(current.direction, current.quantity, current.entryPrice, order.price);
        await tx.spotMarginPosition.update({ where: { id: current.id }, data: { status: SpotMarginPositionStatus.CLOSED, closeOrderId: order.id, closedAt: new Date(), realizedPnl: pnl, unrealizedPnl: new Prisma.Decimal(0), markPrice: order.price } });
        await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId: current.id, type: SpotMarginEventType.REPAYMENT, asset: current.debtAsset, amount: repayment, idempotencyKey: `margin:event:repay:${activity.idempotencyKey}`, metadata: { closeOrderId: order.id } } });
        await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId: current.id, type: SpotMarginEventType.COLLATERAL_RELEASE, asset: current.account.quoteAsset, amount: current.collateral, idempotencyKey: `margin:event:release:${activity.idempotencyKey}`, metadata: { closeOrderId: order.id, releaseAuthority: 'MARGIN_CLOSE' } } });
        await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId: current.id, type: SpotMarginEventType.CLOSE, price: order.price, amount: current.quantity, idempotencyKey: `margin:event:close:${activity.idempotencyKey}`, metadata: { closeOrderId: order.id } } });
        await tx.spotMarginActivity.update({ where: { id: activity.id }, data: { status: SpotMarginActivityStatus.COMPLETED, details: { state: 'CLOSED', closeOrderId: order.id, realizedPnl: pnl.toString(), repayment: repayment.toString() } } });
      }, { maxWait: 10_000, timeout: 15_000 });
    }
  }

  async activateFromSpotFill(positionId: string, spotOrderId: string) {
    const position = await this.prisma.spotMarginPosition.findUnique({ where: { id: positionId }, include: { account: true } });
    const order = await this.prisma.gate2SpotOrder.findUnique({ where: { id: spotOrderId } });
    if (!position || !order || position.status !== SpotMarginPositionStatus.PENDING) throw new NotFoundException('Pending margin entry or Spot order not found');
    if (order.userId !== position.account.userId || order.pair !== position.account.pair || order.status !== 'FILLED' || order.filled.lte(0) || !order.price) throw new BadRequestException('Spot entry is not an owned, filled order for this isolated pair');
    return this.prisma.$transaction(async (tx) => {
      const debtAsset = position.direction === 'LONG' ? position.account.quoteAsset : position.account.baseAsset;
      const debtPrincipal = position.direction === 'LONG' ? position.collateral.mul(position.leverage - 1) : order.filled;
      const activated = await tx.spotMarginPosition.updateMany({ where: { id: positionId, status: SpotMarginPositionStatus.PENDING }, data: { status: SpotMarginPositionStatus.OPEN, entryOrderId: spotOrderId, quantity: order.filled, entryPrice: order.price, markPrice: order.price, debtAsset, debtPrincipal } });
      if (activated.count !== 1) return tx.spotMarginPosition.findUniqueOrThrow({ where: { id: positionId } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.OPEN, price: order.price, amount: order.filled, idempotencyKey: `margin:event:open:${positionId}:${spotOrderId}`, metadata: { spotOrderId } } });
      return tx.spotMarginPosition.findUniqueOrThrow({ where: { id: positionId } });
    }, { maxWait: 10_000, timeout: 15_000 });
  }

  async getAccountSummary(userId: string, pairInput: string) {
    if (this.d1?.isEnabled()) {
      const pair = await this.d1.getActiveMarketPair(pairInput);
      if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
      const account = await this.d1.getMarginAccount(userId, pair.symbol);
      if (!account) throw new NotFoundException('Margin account not found');
      const quote = await this.d1.getLiveMarketQuote(pair.id);
      const positions = await this.d1.listMarginPositions(userId);
      return { accountId: account.id, pair: pair.symbol, quoteState: quote?.state ?? 'UNAVAILABLE', markPrice: quote?.price ?? null, positions: positions.filter((position) => position.accountId === account.id) };
    }
    const pair = await this.resolvePair(pairInput);
    const account = await this.prisma.spotMarginAccount.findUnique({ where: { userId_pair: { userId, pair: pair.symbol } }, include: { positions: { where: { status: { in: [SpotMarginPositionStatus.OPEN, SpotMarginPositionStatus.PENDING] } }, orderBy: { openedAt: 'desc' } } } });
    if (!account) throw new NotFoundException('Margin account not found');
    const quote = await this.prisma.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
    return { accountId: account.id, pair: pair.symbol, quoteState: quote?.state ?? 'UNAVAILABLE', markPrice: quote?.price?.toString() ?? null, positions: account.positions };
  }

  async getQuote(pairInput: string) {
    const pair = await this.resolvePair(pairInput);
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    const maintenanceRatio = await this.resolveMaintenanceRatio();
    const leverageOptions = await this.resolveAllowedLeverages();
    return { pair: pair.symbol, state: quote.state, price: quote.price!.toString(), quoteId: quote.id, provider: quote.provider, source: quote.source, observedAt: quote.observedAt, receivedAt: quote.receivedAt, maintenanceRatio: maintenanceRatio.toString(), leverageOptions };
  }

  async history(userId: string, take = 50) {
    if (this.d1?.isEnabled()) return this.d1.listMarginActivities(userId, take);
    return this.prisma.spotMarginActivity.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(take, 1), 100) });
  }

  async markPosition(userId: string, positionId: string) {
    if (this.d1?.isEnabled()) {
      const position: any = await this.d1.getMarginPosition(positionId, userId);
      if (!position || position.status !== SpotMarginPositionStatus.OPEN) throw new NotFoundException('Open margin position not found');
      const pair = await this.d1.getActiveMarketPair(String(position.accountPair ?? position.pair ?? ''));
      const pairSymbol = pair?.symbol ?? String(position.pair ?? '');
      const quote = pair ? await this.d1.getLiveMarketQuote(pair.id) : null;
      if (!pair || !quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pairSymbol}`);
      const pnl = marginPnl(String(position.direction) as MarginPositionDirection, new Prisma.Decimal(String(position.quantity)), new Prisma.Decimal(String(position.entryPrice)), new Prisma.Decimal(quote.price));
      return this.d1.markMarginPosition(positionId, userId, quote.id, quote.price, pnl.toString());
    }
    const position = await this.prisma.spotMarginPosition.findFirst({ where: { id: positionId, account: { userId }, status: SpotMarginPositionStatus.OPEN }, include: { account: true } });
    if (!position) throw new NotFoundException('Open margin position not found');
    const pair = await this.resolvePair(position.account.pair);
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    const pnl = marginPnl(position.direction, position.quantity, position.entryPrice, quote.price);
    return this.prisma.$transaction(async (tx) => {
      const idempotencyKey = `margin:mark:${position.id}:${quote.id}`;
      const existing = await tx.spotMarginActivity.findUnique({ where: { idempotencyKey } });
      if (existing) return tx.spotMarginPosition.findUnique({ where: { id: position.id } });
      const updated = await tx.spotMarginPosition.update({ where: { id: position.id }, data: { markPrice: quote.price, unrealizedPnl: pnl } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId: position.id, type: SpotMarginEventType.MARK, price: quote.price, amount: pnl, idempotencyKey: `margin:event:mark:${position.id}:${quote.id}`, metadata: { quoteId: quote.id, pair: pair.symbol } } });
      await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: position.accountId, positionId: position.id, type: SpotMarginEventType.PNL, status: SpotMarginActivityStatus.COMPLETED, idempotencyKey, details: { quoteId: quote.id, markPrice: quote.price.toString(), unrealizedPnl: pnl.toString() } } });
      return updated;
    });
  }

  async closePosition(userId: string, positionId: string, idempotencyKey: string) {
    if (this.d1?.isEnabled()) return this.closePositionOnD1(userId, positionId, idempotencyKey, false);
    const position = await this.prisma.spotMarginPosition.findFirst({ where: { id: positionId, account: { userId }, status: SpotMarginPositionStatus.OPEN }, include: { account: true } });
    if (!position) throw new NotFoundException('Open margin position not found');
    if (!this.spot) throw new ServiceUnavailableException('Spot execution authority is unavailable');
    const pair = await this.resolvePair(position.account.pair);
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.spotMarginActivity.findUnique({ where: { idempotencyKey } });
      if (existing) return { positionId, activityId: existing.id, replayed: true, state: existing.status === SpotMarginActivityStatus.COMPLETED ? 'CLOSED' : 'CLOSING' };
      const order = await this.spot!.placeOrderInTransaction(userId, {
        pair: pair.symbol,
        side: position.direction === 'LONG' ? OrderSide.SELL : OrderSide.BUY,
        type: Gate2SpotOrderType.LIMIT,
        amount: position.quantity.toString(),
        price: quote.price.toString(),
        idempotencyKey: `margin:close:${idempotencyKey}`,
        accountScope: LedgerAccountScope.MARGIN,
      }, tx);
      await tx.spotMarginPosition.update({ where: { id: positionId }, data: { status: SpotMarginPositionStatus.CLOSING } });
      await this.spot!.matchOrdersInTransaction(pair.symbol, tx);
      const filled = await tx.gate2SpotOrder.findUnique({ where: { id: order.id } });
      if (!filled || filled.status !== 'FILLED') {
        const activity = await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: position.accountId, positionId, type: SpotMarginEventType.CLOSE, status: SpotMarginActivityStatus.ACCEPTED, idempotencyKey, details: { state: 'CLOSING', closeOrderId: order.id } } });
        return { positionId, activityId: activity.id, closeOrderId: order.id, replayed: false, state: 'CLOSING' };
      }
      const pnl = marginPnl(position.direction, position.quantity, position.entryPrice, filled.price ?? quote.price);
      const debtAccount = await this.ledger.getAccountForUserInScope(userId, position.debtAsset, LedgerAccountScope.MARGIN, tx);
      const repayment = position.debtPrincipal.add(position.interestAccrued);
      if (repayment.gt(0)) await this.ledger.debit({ accountId: debtAccount.id, asset: position.debtAsset, amount: repayment.toString(), referenceType: 'SPOT_MARGIN_REPAYMENT', referenceId: positionId, idempotencyKey: `margin:repay:${idempotencyKey}`, correlationId: idempotencyKey, economicGroup: position.accountId }, tx);
      const closed = await tx.spotMarginPosition.update({ where: { id: positionId }, data: { status: SpotMarginPositionStatus.CLOSED, closeOrderId: filled.id, closedAt: new Date(), realizedPnl: pnl, unrealizedPnl: new Prisma.Decimal(0), markPrice: filled.price ?? quote.price } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.REPAYMENT, asset: position.debtAsset, amount: repayment, idempotencyKey: `margin:event:repay:${idempotencyKey}`, metadata: { closeOrderId: filled.id } } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.COLLATERAL_RELEASE, asset: position.account.quoteAsset, amount: position.collateral, idempotencyKey: `margin:event:release:${idempotencyKey}`, metadata: { closeOrderId: filled.id, releaseAuthority: 'MARGIN_CLOSE' } } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.CLOSE, price: filled.price ?? quote.price, amount: position.quantity, idempotencyKey: `margin:event:close:${idempotencyKey}`, metadata: { closeOrderId: filled.id } } });
      const activity = await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: position.accountId, positionId, type: SpotMarginEventType.CLOSE, status: SpotMarginActivityStatus.COMPLETED, idempotencyKey, details: { state: 'CLOSED', closeOrderId: filled.id, realizedPnl: pnl.toString(), repayment: repayment.toString() } } });
      return { ...closed, activityId: activity.id, closeOrderId: filled.id, replayed: false, state: 'CLOSED' };
    }, { maxWait: 10_000, timeout: 15_000 });
  }

  async accrueInterest(positionId: string, annualRate: string, elapsedSeconds: number, idempotencyKey: string) {
    if (this.d1?.isEnabled()) {
      const position: any = await this.d1.getMarginPosition(positionId);
      if (!position || String(position.status) !== 'OPEN') throw new NotFoundException('Open margin position not found');
      const interest = simpleInterest(new Prisma.Decimal(String(position.debtPrincipal)), new Prisma.Decimal(annualRate), elapsedSeconds);
      return this.d1.accrueMarginInterest(positionId, String(position.accountUserId ?? ''), interest.toString(), annualRate, elapsedSeconds, idempotencyKey);
    }
    const position = await this.prisma.spotMarginPosition.findUnique({ where: { id: positionId }, include: { account: true } });
    if (!position || position.status !== SpotMarginPositionStatus.OPEN) throw new NotFoundException('Open margin position not found');
    const interest = simpleInterest(position.debtPrincipal, new Prisma.Decimal(annualRate), elapsedSeconds);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.spotMarginActivity.findUnique({ where: { idempotencyKey } });
      if (existing) return { positionId, interest: '0', activityId: existing.id, replayed: true };
      const updated = await tx.spotMarginPosition.update({ where: { id: positionId }, data: { interestAccrued: { increment: interest } } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.INTEREST, amount: interest, idempotencyKey: `margin:event:interest:${idempotencyKey}`, metadata: { annualRate, elapsedSeconds } } });
      const activity = await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId: position.account.userId, accountId: position.accountId, positionId, type: SpotMarginEventType.INTEREST, status: SpotMarginActivityStatus.COMPLETED, idempotencyKey, details: { interest: interest.toString(), annualRate, elapsedSeconds } } });
      return { positionId: updated.id, interest: interest.toString(), activityId: activity.id, replayed: false };
    });
  }

  async liquidatePosition(userId: string, positionId: string, idempotencyKey: string) {
    if (this.d1?.isEnabled()) return this.closePositionOnD1(userId, positionId, idempotencyKey, true);
    const position = await this.prisma.spotMarginPosition.findFirst({ where: { id: positionId, account: { userId }, status: SpotMarginPositionStatus.OPEN }, include: { account: true } });
    if (!position) throw new NotFoundException('Open margin position not found');
    const ratio = await this.resolveMaintenanceRatio();
    if (!isLiquidatable(position.collateral, position.unrealizedPnl, position.interestAccrued, ratio)) throw new BadRequestException('Margin position is above the liquidation threshold');
    if (!this.spot) throw new ServiceUnavailableException('Spot execution authority is unavailable');
    const pair = await this.resolvePair(position.account.pair);
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.spotMarginActivity.findUnique({ where: { idempotencyKey } });
      if (existing) return { positionId, activityId: existing.id, replayed: true };
      const order = await this.spot!.placeOrderInTransaction(userId, { pair: pair.symbol, side: position.direction === MarginPositionDirection.LONG ? OrderSide.SELL : OrderSide.BUY, type: Gate2SpotOrderType.LIMIT, amount: position.quantity.toString(), price: quote.price.toString(), idempotencyKey: `margin:liquidation:${idempotencyKey}`, accountScope: LedgerAccountScope.MARGIN }, tx);
      await tx.spotMarginPosition.update({ where: { id: positionId }, data: { status: SpotMarginPositionStatus.CLOSING } });
      await this.spot!.matchOrdersInTransaction(pair.symbol, tx);
      const filled = await tx.gate2SpotOrder.findUnique({ where: { id: order.id } });
      if (!filled || filled.status !== 'FILLED') {
        const activity = await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: position.accountId, positionId, type: SpotMarginEventType.LIQUIDATION, status: SpotMarginActivityStatus.ACCEPTED, idempotencyKey, details: { state: 'CLOSING', liquidationOrderId: order.id, maintenanceRatio: ratio.toString() } } });
        return { positionId, activityId: activity.id, liquidationOrderId: order.id, replayed: false, state: 'CLOSING' };
      }
      const pnl = marginPnl(position.direction, position.quantity, position.entryPrice, filled.price ?? quote.price);
      const debtAccount = await this.ledger.getAccountForUserInScope(userId, position.debtAsset, LedgerAccountScope.MARGIN, tx);
      const repayment = position.debtPrincipal.add(position.interestAccrued);
      if (repayment.gt(0)) await this.ledger.debit({ accountId: debtAccount.id, asset: position.debtAsset, amount: repayment.toString(), referenceType: 'SPOT_MARGIN_LIQUIDATION_REPAYMENT', referenceId: positionId, idempotencyKey: `margin:liquidation-repay:${idempotencyKey}`, correlationId: idempotencyKey, economicGroup: position.accountId }, tx);
      const updated = await tx.spotMarginPosition.update({ where: { id: positionId }, data: { status: SpotMarginPositionStatus.LIQUIDATED, closeOrderId: filled.id, closedAt: new Date(), realizedPnl: pnl, unrealizedPnl: new Prisma.Decimal(0), markPrice: filled.price ?? quote.price } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.LIQUIDATION, asset: position.debtAsset, amount: repayment, price: filled.price ?? quote.price, idempotencyKey: `margin:event:liquidation:${idempotencyKey}`, metadata: { maintenanceRatio: ratio.toString(), liquidationOrderId: filled.id, realizedPnl: pnl.toString() } } });
      await tx.spotMarginPositionEvent.create({ data: { id: randomUUID(), positionId, type: SpotMarginEventType.COLLATERAL_RELEASE, asset: position.account.quoteAsset, amount: position.collateral, idempotencyKey: `margin:event:liquidation-release:${idempotencyKey}`, metadata: { maintenanceRatio: ratio.toString(), liquidationOrderId: filled.id, releaseAuthority: 'MARGIN_LIQUIDATION' } } });
      const activity = await tx.spotMarginActivity.create({ data: { id: randomUUID(), userId, accountId: position.accountId, positionId, type: SpotMarginEventType.LIQUIDATION, status: SpotMarginActivityStatus.COMPLETED, idempotencyKey, details: { state: 'LIQUIDATED', maintenanceRatio: ratio.toString(), liquidationOrderId: filled.id, realizedPnl: pnl.toString(), repayment: repayment.toString() } } });
      return { positionId: updated.id, activityId: activity.id, liquidationOrderId: filled.id, replayed: false, state: 'LIQUIDATED' };
    }, { maxWait: 10_000, timeout: 15_000 });
  }

  private async ensureAccount(userId: string, pair: any, client: DbClient) {
    return client.spotMarginAccount.upsert({ where: { userId_pair: { userId, pair: pair.symbol } }, update: {}, create: { id: randomUUID(), userId, pair: pair.symbol, baseAsset: pair.baseAsset.symbol, quoteAsset: pair.quoteAsset.symbol } });
  }

  private async openPositionOnD1(userId: string, input: OpenMarginPositionDto) {
    const pair = await this.d1!.getActiveMarketPair(input.pair);
    if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
    const quote = await this.d1!.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
    const collateral = this.decimal(input.collateral);
    const leverage = Number(input.leverage);
    await this.assertConfiguredLeverage(leverage);
    const notional = collateral.mul(leverage);
    const quantity = notional.div(new Prisma.Decimal(quote.price)).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const debtAsset = input.direction === MarginPositionDirection.LONG ? pair.quoteAsset : pair.baseAsset;
    const debtPrincipal = input.direction === MarginPositionDirection.LONG ? collateral.mul(leverage - 1) : quantity;
    const account = await this.d1!.ensureMarginAccount({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset });
    const borrowed = await this.d1!.getAccountForUser(userId, debtAsset, 'MARGIN');
    await this.d1!.credit({ accountId: borrowed.id, asset: debtAsset, amount: debtPrincipal.toString(), referenceType: 'SPOT_MARGIN_BORROW', referenceId: input.idempotencyKey, idempotencyKey: `margin:borrow:${input.idempotencyKey}`, correlationId: input.idempotencyKey, economicGroup: account.id, metadata: { pair: pair.symbol, direction: input.direction, leverage } });
    const feeValue = await this.d1!.getSystemConfigValue('gate2.spot.feeRate');
    const feeRate = feeValue === null ? new Prisma.Decimal('0.001') : assertNonNegativeDecimal(feeValue);
    const reserveAsset = input.direction === MarginPositionDirection.LONG ? pair.quoteAsset : pair.baseAsset;
    const reserveAmount = input.direction === MarginPositionDirection.LONG ? quantity.mul(new Prisma.Decimal(quote.price)).mul(new Prisma.Decimal(1).add(feeRate)) : quantity;
    const order: any = await this.d1!.reserveSpotOrder({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset, side: input.direction === MarginPositionDirection.LONG ? OrderSide.BUY : OrderSide.SELL, type: Gate2SpotOrderType.LIMIT, amount: quantity.toString(), price: quote.price, stopPrice: null, reserveAsset, reserveScope: LedgerAccountScope.MARGIN, reservedAmount: reserveAmount.toString(), feeRate: feeRate.toString(), idempotencyKey: `margin:entry:${input.idempotencyKey}`, correlationId: input.idempotencyKey });
    for (let attempt = 0; attempt < 128; attempt += 1) if (!await this.d1!.matchSpotOrder({ pair: pair.symbol })) break;
    const filled: any = await this.d1!.getSpotOrder(userId, String(order.id));
    const status = filled?.status === 'FILLED' ? SpotMarginPositionStatus.OPEN : SpotMarginPositionStatus.PENDING;
      return this.d1!.createMarginPosition({ positionId: randomUUID(), accountId: account.id, userId, direction: input.direction, leverage, collateral: collateral.toString(), quantity: String(filled?.filled ?? '0'), entryPrice: String(filled?.price ?? quote.price), markPrice: String(filled?.price ?? quote.price), status, debtAsset, debtPrincipal: debtPrincipal.toString(), openIdempotencyKey: input.idempotencyKey, entryOrderId: String(order.id), pair: pair.symbol, positionAsset: pair.baseAsset, activityId: randomUUID(), positionEventId: randomUUID() });
  }

  private async closePositionOnD1(userId: string, positionId: string, idempotencyKey: string, liquidation: boolean) {
    const position: any = await this.d1!.getMarginPosition(positionId, userId);
    if (!position || !['OPEN', 'CLOSING'].includes(String(position.status))) throw new NotFoundException('Open margin position not found');
    const ratio = liquidation ? await this.resolveMaintenanceRatio() : null;
    if (liquidation && !isLiquidatable(new Prisma.Decimal(String(position.collateral)), new Prisma.Decimal(String(position.unrealizedPnl)), new Prisma.Decimal(String(position.interestAccrued)), ratio!)) {
      throw new BadRequestException('Margin position is above the liquidation threshold');
    }
    const pair = await this.d1!.getActiveMarketPair(String(position.accountPair));
    if (!pair) throw new BadRequestException('Pair is unavailable or under maintenance');
    const quote = await this.d1!.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
    const side = String(position.direction) === MarginPositionDirection.LONG ? OrderSide.SELL : OrderSide.BUY;
    const order = await this.d1!.reserveSpotOrder({ userId, pair: pair.symbol, baseAsset: pair.baseAsset, quoteAsset: pair.quoteAsset, side, type: Gate2SpotOrderType.LIMIT, amount: String(position.quantity), price: quote.price, stopPrice: null, reserveAsset: side === OrderSide.BUY ? pair.quoteAsset : pair.baseAsset, reserveScope: LedgerAccountScope.MARGIN, reservedAmount: side === OrderSide.BUY ? new Prisma.Decimal(String(position.quantity)).mul(new Prisma.Decimal(quote.price)).toString() : String(position.quantity), feeRate: '0', idempotencyKey: `margin:${liquidation ? 'liquidation' : 'close'}:${idempotencyKey}`, correlationId: idempotencyKey });
    await this.d1!.markMarginClosing(positionId, userId, String(position.accountId), randomUUID(), String(order.id), idempotencyKey, liquidation);
    for (let attempt = 0; attempt < 128; attempt += 1) if (!await this.d1!.matchSpotOrder({ pair: pair.symbol })) break;
    const filled: any = await this.d1!.getSpotOrder(userId, String(order.id));
    if (!filled || String(filled.status) !== 'FILLED') return { positionId, closeOrderId: order.id, state: 'CLOSING', replayed: false };
    const closePrice = new Prisma.Decimal(String(filled.price ?? quote.price));
    const pnl = marginPnl(String(position.direction) as MarginPositionDirection, new Prisma.Decimal(String(position.quantity)), new Prisma.Decimal(String(position.entryPrice)), closePrice);
    const repayment = new Prisma.Decimal(String(position.debtPrincipal)).add(new Prisma.Decimal(String(position.interestAccrued ?? '0')));
    return this.d1!.settleMarginClose({ positionId, userId, closeOrderId: String(filled.id), state: liquidation ? 'LIQUIDATED' : 'CLOSED', markPrice: closePrice.toString(), realizedPnl: pnl.toString(), repayment: repayment.toString(), debtAsset: String(position.debtAsset), activityId: randomUUID(), idempotencyKey, correlationId: idempotencyKey, maintenanceRatio: ratio?.toString() });
  }

  private async resolvePair(value: string) {
    const symbol = value.trim().toUpperCase().replace(/\.US\/USDT$/, 'USDT').replaceAll('/', '').replaceAll('.', '');
    const pair = await this.prisma.marketPair.findUnique({ where: { symbol }, include: { baseAsset: true, quoteAsset: true } });
    if (!pair || pair.status !== 'ACTIVE' || pair.baseAsset.status !== 'ACTIVE' || pair.quoteAsset.status !== 'ACTIVE') throw new BadRequestException('Pair is unavailable or under maintenance');
    return pair;
  }

  private async requireLiveQuote(pairId: string, symbol: string) {
    const quote = await this.prisma.marketQuoteLatest.findUnique({ where: { pairId } });
    const staleAfterMs = Number(process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000);
    if (!quote || quote.state !== 'LIVE' || !quote.price || Date.now() - quote.receivedAt.getTime() > staleAfterMs) throw new ServiceUnavailableException(`Live market quote unavailable for ${symbol}`);
    return quote;
  }

  private async resolveAllowedLeverages(): Promise<number[]> {
    const raw = this.d1?.isEnabled()
      ? await this.d1.getSystemConfigValue('gate2.margin.leverages')
      : (await this.prisma.systemConfig?.findUnique({ where: { key: 'gate2.margin.leverages' } }))?.value ?? null;
    const values = String(raw ?? '2,3,5').split(',').map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    const unique = [...new Set(values)].sort((a, b) => a - b);
    if (!unique.length) throw new BadRequestException('Margin leverage configuration is invalid');
    return unique;
  }

  private async assertConfiguredLeverage(leverage: number): Promise<void> {
    if (!(await this.resolveAllowedLeverages()).includes(leverage)) {
      throw new BadRequestException('Margin leverage is not supported');
    }
  }

  private async resolveMaintenanceRatio() {
    const raw = this.d1?.isEnabled()
      ? await this.d1.getSystemConfigValue('gate2.margin.maintenanceRatio')
      : (await this.prisma.systemConfig?.findUnique({ where: { key: 'gate2.margin.maintenanceRatio' } }))?.value ?? null;
    const ratio = new Prisma.Decimal(raw ?? '0.5');
    if (ratio.isNegative() || ratio.gte(1)) throw new BadRequestException('Margin maintenance configuration is invalid');
    return ratio;
  }

  private decimal(value: string) {
    const decimal = new Prisma.Decimal(value);
    if (!decimal.isFinite() || decimal.isNegative() || decimal.isZero()) throw new BadRequestException('Amount must be a positive decimal');
    return decimal;
  }
}
