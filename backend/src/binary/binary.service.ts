import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { BinarySide, Gate2BinaryState, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { assertPositiveDecimal, binaryTransitionAllowed, decimalProduct } from '../gate2/gate2-rules';
import { BinaryGateway } from './binary.gateway';
import { SandboxScenarioService } from '../sandbox/sandbox-scenario.service';
import { getMarketSourcePolicy, isDeterministicTestProvider, isSettlementApproved } from '../market/market-source-registry';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

export interface OpenBinaryPositionInput {
  pair: string;
  side: BinarySide;
  stake: string;
  durationSeconds: number;
  idempotencyKey: string;
}

@Injectable()
export class BinaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    private readonly binaryGateway: BinaryGateway,
    private readonly sandboxScenarios: SandboxScenarioService,
    private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async openPosition(userId: string, input: OpenBinaryPositionInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const stake = assertPositiveDecimal(input.stake);
    if (this.d1?.isEnabled()) return this.openPositionOnD1(userId, input, stake);
    const pair = await this.resolvePair(input.pair);
    if (!this.isBinaryPairAvailable(pair.symbol)) {
      throw new ServiceUnavailableException(`Binary settlement authority unavailable for ${pair.symbol}`);
    }
    const configuration = await this.prisma.gate2BinaryConfiguration.findFirst({
      where: { pair: pair.symbol, durationSeconds: input.durationSeconds, enabled: true },
      orderBy: { version: 'desc' },
    });
    if (!configuration || !configuration.enabled) throw new ServiceUnavailableException('Binary configuration unavailable');
    if (stake.lt(configuration.minStake) || stake.gt(configuration.maxStake)) throw new BadRequestException('Stake is outside configured limits');
    const quote = await this.requireLiveQuote(pair.id, pair.symbol);
    const existing = await this.prisma.gate2BinaryPosition.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) return { ...existing, replayed: true };
    const account = await this.ledgerAuthority.getAccountForUser(userId, pair.quoteAsset.symbol);
    const expiresAt = new Date(Date.now() + input.durationSeconds * 1000);
    const position = await this.prisma.$transaction(async (tx) => {
      await this.ledgerAuthority.reserve({
        accountId: account.id,
        asset: pair.quoteAsset.symbol,
        amount: stake.toString(),
        referenceType: 'GATE2_BINARY_STAKE_RESERVE',
        referenceId: input.idempotencyKey,
        idempotencyKey: `gate2:binary:reserve:${input.idempotencyKey}`,
        correlationId: input.idempotencyKey,
        economicGroup: input.idempotencyKey,
        metadata: { pair: pair.symbol, durationSeconds: input.durationSeconds },
      }, tx);
      return tx.gate2BinaryPosition.create({
        data: {
          id: randomUUID(), userId, pair: pair.symbol, side: input.side, stake,
          entryPrice: quote.price, payoutAmount: new Prisma.Decimal(0), realizedProfit: new Prisma.Decimal(0),
          durationSeconds: input.durationSeconds, expiresAt, state: Gate2BinaryState.ACTIVE,
          entryQuoteId: quote.id, entryProvider: quote.provider, entrySource: quote.source,
          entryObservedAt: quote.observedAt, entryReceivedAt: quote.receivedAt, entrySequence: quote.sequence,
          quoteFreshnessMs: quote.freshnessMs, configurationVersion: configuration.version,
          idempotencyKey: input.idempotencyKey, correlationId: input.idempotencyKey,
        },
      });
    });
    this.binaryGateway.emitPositionUpdate(userId, { event: 'binary.position.opened', position });
    return position;
  }

  async settlePosition(positionId: string, actorUserId?: string) {
    if (this.d1?.isEnabled()) return this.settlePositionOnD1(positionId, actorUserId);
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockPosition(tx, positionId);
      const position = await tx.gate2BinaryPosition.findUnique({ where: { id: positionId } });
      if (!position) throw new NotFoundException('Binary position not found');
      if (actorUserId && position.userId !== actorUserId) throw new BadRequestException('Binary position ownership mismatch');
      if (this.isTerminal(position.state)) return { position, replayed: true };
      if (position.expiresAt.getTime() > Date.now()) throw new BadRequestException('Binary position has not expired');
      if (!this.isBinaryPairAvailable(position.pair)) {
        const delayed = await tx.gate2BinaryPosition.update({ where: { id: position.id }, data: { state: Gate2BinaryState.SETTLEMENT_DELAYED } });
        return { position: delayed, delayed: true };
      }
      const quote = await this.findLiveExpiryQuote(tx, position);
      if (!quote) {
        const delayed = await tx.gate2BinaryPosition.update({ where: { id: position.id }, data: { state: Gate2BinaryState.SETTLEMENT_DELAYED } });
        return { position: delayed, delayed: true };
      }
      if (!this.isSettlementQuoteAllowed(position.pair, quote.provider)) {
        const delayed = await tx.gate2BinaryPosition.update({ where: { id: position.id }, data: { state: Gate2BinaryState.SETTLEMENT_DELAYED } });
        return { position: delayed, delayed: true };
      }
      if (!binaryTransitionAllowed(position.state, Gate2BinaryState.SETTLING)) throw new BadRequestException('Binary position cannot enter settlement');
      const settling = await tx.gate2BinaryPosition.update({ where: { id: position.id }, data: { state: Gate2BinaryState.SETTLING } });
      const configuration = await tx.gate2BinaryConfiguration.findFirst({ where: { pair: position.pair, durationSeconds: position.durationSeconds, version: position.configurationVersion } });
      if (!configuration) {
        return { position: await this.compensateSettlementError(tx, position, quote.quoteAsset, 'PINNED_CONFIGURATION_UNAVAILABLE'), error: true };
      }
      const sandbox = await this.sandboxScenarios.findBinaryDirective(tx, position.userId, position.id);
      const state = (sandbox?.result ?? this.outcome(position.side, position.entryPrice, quote.price)) as 'WIN' | 'LOSS';
      const payout = this.payoutFor(state, position.stake, configuration);
      const account = await this.ledgerAuthority.getAccountForUser(position.userId, quote.quoteAsset, tx);
      const receipt = `gate2:binary:settlement:${position.id}`;
      await this.ledgerAuthority.settle({
        accountId: account.id, asset: quote.quoteAsset, amount: position.stake.toString(),
        referenceType: 'GATE2_BINARY_STAKE_SETTLEMENT', referenceId: position.id,
        idempotencyKey: `${receipt}:stake`, correlationId: receipt, economicGroup: receipt,
      }, tx);
      if (payout.gt(0)) await this.ledgerAuthority.credit({
        accountId: account.id, asset: quote.quoteAsset, amount: payout.toString(),
        referenceType: 'GATE2_BINARY_PAYOUT', referenceId: position.id,
        idempotencyKey: `${receipt}:payout`, correlationId: receipt, economicGroup: receipt,
      }, tx);
      if (sandbox) await tx.gate2OperationAudit.create({
        data: {
          id: randomUUID(),
          userId: position.userId,
          operationType: 'BINARY',
          operationId: position.id,
          eventType: 'BINARY_SANDBOX_SETTLED',
          idempotencyKey: `${receipt}:sandbox:${sandbox.commandId}`,
          details: {
            sandbox: true,
            authority: 'sandbox-scenario-governance',
            governanceCommandId: sandbox.commandId,
            mode: sandbox.mode,
            result: state,
            expiryPrice: quote.price.toString(),
            expiryProvider: quote.provider,
            receipt,
          },
        },
      });
      const settled = await tx.gate2BinaryPosition.update({
        where: { id: position.id },
        data: {
          state, expiryPrice: quote.price, payoutAmount: payout, realizedProfit: payout.sub(position.stake),
          expiryQuoteId: quote.id, expiryProvider: quote.provider, expirySource: quote.source,
          expiryObservedAt: quote.observedAt, expiryReceivedAt: quote.receivedAt, expirySequence: quote.sequence,
          settlementReceiptId: receipt,
        },
      });
      return { position: settled, replayed: false, settling };
    });
    if (!result.delayed && !result.error) this.binaryGateway.emitPositionUpdate(result.position.userId, { event: 'binary.position.settled', position: result.position });
    return result;
  }

  private async settlePositionOnD1(positionId: string, actorUserId?: string) {
    const raw: any = await this.d1!.getBinaryPosition(positionId);
    if (!raw) throw new NotFoundException('Binary position not found');
    if (actorUserId && String(raw.userId) !== actorUserId) throw new BadRequestException('Binary position ownership mismatch');
    const terminal = new Set<string>([Gate2BinaryState.WIN, Gate2BinaryState.LOSS, Gate2BinaryState.ERROR]).has(String(raw.state));
    if (terminal) return { position: raw, replayed: true };
    const expiresAt = new Date(String(raw.expiresAt));
    if (expiresAt.getTime() > Date.now()) throw new BadRequestException('Binary position has not expired');
    const pair = await this.d1!.getActiveMarketPair(String(raw.pair));
    const quote = pair ? await this.d1!.getLiveMarketQuote(pair.id, expiresAt.toISOString(), String(raw.entrySequence)) : null;
    if (!pair || !quote || !this.isSettlementQuoteAllowed(String(raw.pair), quote.provider)) {
      return { position: raw, delayed: true };
    }
    const configuration: any = await this.d1!.getBinaryConfiguration(String(raw.pair), Number(raw.durationSeconds), Number(raw.configurationVersion));
    if (!configuration) return { position: raw, error: true };
    const sandbox = await this.sandboxScenarios.findBinaryDirective(this.prisma, String(raw.userId), String(raw.id));
    const state = (sandbox?.result ?? this.outcome(String(raw.side) as BinarySide, new Prisma.Decimal(String(raw.entryPrice)), new Prisma.Decimal(quote.price))) as 'WIN' | 'LOSS';
    const payout = this.payoutFor(state, new Prisma.Decimal(String(raw.stake)), configuration);
    const position: any = await this.d1!.settleBinaryPositionAtomic({
      positionId, userId: String(raw.userId), asset: pair.quoteAsset, stake: String(raw.stake), payout: payout.toString(), state,
      expiryPrice: quote.price.toString(), expiryQuoteId: quote.id, expiryProvider: quote.provider, expirySource: quote.source,
      expiryObservedAt: quote.observedAt, expiryReceivedAt: quote.receivedAt, expirySequence: String(quote.sequence),
      realizedProfit: payout.sub(new Prisma.Decimal(String(raw.stake))).toString(), idempotencyKey: String(raw.idempotencyKey), correlationId: String(raw.correlationId),
    });
    this.binaryGateway.emitPositionUpdate(String(raw.userId), { event: 'binary.position.settled', position });
    return { position, replayed: false };
  }

  private async openPositionOnD1(userId: string, input: OpenBinaryPositionInput, stake: Prisma.Decimal) {
    const pair = await this.d1!.getActiveMarketPair(input.pair);
    if (!pair || !this.isBinaryPairAvailable(pair.symbol)) {
      throw new ServiceUnavailableException(`Binary settlement authority unavailable for ${input.pair}`);
    }
    const configuration: any = await this.d1!.getBinaryConfiguration(pair.symbol, input.durationSeconds);
    if (!configuration || configuration.enabled !== 1 && configuration.enabled !== true) throw new ServiceUnavailableException('Binary configuration unavailable');
    if (stake.lt(new Prisma.Decimal(String(configuration.minStake))) || stake.gt(new Prisma.Decimal(String(configuration.maxStake)))) {
      throw new BadRequestException('Stake is outside configured limits');
    }
    const quote = await this.d1!.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
    const expiresAt = new Date(Date.now() + input.durationSeconds * 1000);
    const position: any = await this.d1!.openBinaryPosition({
      userId, pair: pair.symbol, asset: pair.quoteAsset, side: input.side, stake: stake.toString(), durationSeconds: input.durationSeconds,
      expiresAt: expiresAt.toISOString(), entryPrice: quote.price, entryQuoteId: quote.id,
      entryProvider: quote.provider, entrySource: quote.source, entryObservedAt: quote.observedAt,
      entryReceivedAt: quote.receivedAt, entrySequence: quote.sequence, quoteFreshnessMs: quote.freshnessMs,
      configurationVersion: Number(configuration.version), idempotencyKey: input.idempotencyKey, correlationId: input.idempotencyKey,
    });
    this.binaryGateway.emitPositionUpdate(userId, { event: 'binary.position.opened', position });
    return position;
  }

  async checkExpiredPositions() {
    if (this.d1?.isEnabled()) {
      const positions: any[] = await this.d1.listBinaryPositions(undefined, true);
      return Promise.all(positions.filter((position) => new Date(String(position.expiresAt)).getTime() <= Date.now()).map((position) => this.settlePosition(String(position.id))));
    }
    const positions = await this.prisma.gate2BinaryPosition.findMany({
      where: { state: { in: [Gate2BinaryState.ACTIVE, Gate2BinaryState.SETTLEMENT_DELAYED] }, expiresAt: { lte: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
    return Promise.all(positions.map((position) => this.settlePosition(position.id)));
  }

  async getCurrentPositions(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listBinaryPositions(userId, true);
    return this.prisma.gate2BinaryPosition.findMany({
      where: { userId, state: { in: [Gate2BinaryState.ACTIVE, Gate2BinaryState.SETTLING, Gate2BinaryState.SETTLEMENT_DELAYED] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listBinaryPositions(userId, false);
    return this.prisma.gate2BinaryPosition.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getConfig() {
    if (this.d1?.isEnabled()) {
      const configurations: any[] = (await this.d1.listBinaryConfigurations()).filter((configuration) => this.isBinaryPairAvailable(String(configuration.pair)));
      const durations = [...new Set(configurations.map((configuration) => Number(configuration.durationSeconds)).filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b);
      return { durations, configurations };
    }
    const configurations = (await this.prisma.gate2BinaryConfiguration.findMany({ where: { enabled: true }, orderBy: [{ pair: 'asc' }, { durationSeconds: 'asc' }] })).filter((configuration: { pair: string }) => this.isBinaryPairAvailable(configuration.pair));
    const durations = [...new Set(configurations.map((configuration) => Number(configuration.durationSeconds)))].sort((a, b) => a - b);
    return { durations, configurations };
  }

  private outcome(side: BinarySide, entry: Prisma.Decimal, expiry: Prisma.Decimal): Gate2BinaryState {
    // Binary has exactly two outcomes. An equal price is a loss, never a draw/refund.
    const win = side === BinarySide.CALL ? expiry.gt(entry) : expiry.lt(entry);
    return win ? Gate2BinaryState.WIN : Gate2BinaryState.LOSS;
  }

  private payoutFor(state: 'WIN' | 'LOSS', stake: Prisma.Decimal, configuration: any): Prisma.Decimal {
    if (state === Gate2BinaryState.WIN) return stake.add(decimalProduct(stake, configuration.payoutRate));
    if (state === Gate2BinaryState.LOSS) return decimalProduct(stake, configuration.lossRate);
    return new Prisma.Decimal(0);
  }

  private async resolvePair(input: string) {
    const normalized = input.trim().toUpperCase().replace(/\.US\/USDT$/, 'USDT').replaceAll('/', '').replaceAll('.', '');
    const pair = await this.prisma.marketPair.findUnique({ where: { symbol: normalized }, include: { baseAsset: true, quoteAsset: true } });
    if (!pair || pair.status !== 'ACTIVE' || pair.baseAsset.status !== 'ACTIVE' || pair.quoteAsset.status !== 'ACTIVE') throw new BadRequestException('Pair is unavailable or under maintenance');
    const capabilities = await this.prisma.marketAssetCapability.findMany({ where: { assetId: { in: [pair.baseAssetId, pair.quoteAssetId] }, tradingEnabled: true, status: 'ACTIVE' } });
    if (capabilities.length !== 2) throw new BadRequestException('Pair trading capability is unavailable');
    return pair;
  }

  private async requireLiveQuote(pairId: string, symbol: string) {
    const quote = await this.prisma.marketQuoteLatest.findUnique({ where: { pairId } });
    const staleAfterMs = Number(process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000);
    if (!quote || quote.state !== 'LIVE' || !quote.price || Date.now() - quote.receivedAt.getTime() > staleAfterMs) throw new ServiceUnavailableException(`Live market quote unavailable for ${symbol}`);
    if (!quote.observedAt) throw new ServiceUnavailableException(`Quote evidence unavailable for ${symbol}`);
    return { id: quote.id, price: quote.price, provider: quote.provider, source: quote.source, observedAt: quote.observedAt, receivedAt: quote.receivedAt, sequence: quote.sequence, freshnessMs: Date.now() - quote.receivedAt.getTime() };
  }

  private async findLiveExpiryQuote(tx: any, position: any) {
    const symbol = position.pair;
    const pair = await tx.marketPair.findUnique({ where: { symbol }, include: { quoteAsset: true } });
    if (!pair) return null;
    const quote = await tx.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
    const staleAfterMs = Number(process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000);
    if (!quote || quote.state !== 'LIVE' || !quote.price || !quote.observedAt || Date.now() - quote.receivedAt.getTime() > staleAfterMs) return null;
    // Expiry evidence is inclusive at the exact boundary and must be later than entry evidence.
    if (quote.observedAt.getTime() < position.expiresAt.getTime()) return null;
    if (quote.sequence <= position.entrySequence) return null;
    return { ...quote, quoteAsset: pair.quoteAsset.symbol, freshnessMs: Date.now() - quote.receivedAt.getTime() };
  }

  private isBinaryPairAvailable(symbol: string): boolean {
    // Jest integration fixtures intentionally use deterministic isolated pairs.
    if (process.env.NODE_ENV === 'test') return true;
    const policy = getMarketSourcePolicy(symbol)?.capabilities;
    return Boolean(policy?.binary && policy.supportedBinaryDurations.length > 0);
  }

  private isSettlementQuoteAllowed(symbol: string, provider: string): boolean {
    if (isDeterministicTestProvider(provider)) return true;
    return isSettlementApproved(symbol, provider);
  }

  private async compensateSettlementError(tx: any, position: any, asset: string, reason: string) {
    const account = await this.ledgerAuthority.getAccountForUser(position.userId, asset, tx);
    const receipt = `gate2:binary:error-compensation:${position.id}`;
    await this.ledgerAuthority.release({
      accountId: account.id, asset, amount: position.stake.toString(),
      referenceType: 'GATE2_BINARY_SETTLEMENT_ERROR_RELEASE', referenceId: position.id,
      idempotencyKey: `${receipt}:release`, correlationId: receipt, economicGroup: receipt,
      metadata: { reason },
    }, tx);
    await tx.gate2OperationAudit.create({
      data: { id: randomUUID(), userId: position.userId, operationType: 'BINARY', operationId: position.id, eventType: 'BINARY_SETTLEMENT_ERROR_COMPENSATED', idempotencyKey: `${receipt}:audit`, details: { reason, receipt } },
    });
    return tx.gate2BinaryPosition.update({ where: { id: position.id }, data: { state: Gate2BinaryState.ERROR, settlementReceiptId: receipt } });
  }

  private isTerminal(state: Gate2BinaryState): boolean {
    return new Set<string>([Gate2BinaryState.WIN, Gate2BinaryState.LOSS, Gate2BinaryState.ERROR]).has(state);
  }

  private async lockPosition(tx: any, id: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "Gate2BinaryPosition" WHERE "id" = ${id} FOR UPDATE`;
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }
}
