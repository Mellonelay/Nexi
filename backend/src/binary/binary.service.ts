import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { BinarySide, Gate2BinaryState, Prisma } from '../prisma/d1-client';
import { randomUUID } from 'crypto';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { assertPositiveDecimal, binaryTransitionAllowed, decimalProduct } from '../gate2/gate2-rules';
import { BinaryGateway } from './binary.gateway';
import { SandboxScenarioService } from '../sandbox/sandbox-scenario.service';
import { getMarketSourcePolicy, getProviderMapping, isDeterministicTestProvider, isSettlementApproved } from '../market/market-source-registry';
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
    private readonly prisma: D1PrismaService,
    private readonly binaryGateway: BinaryGateway,
    private readonly sandboxScenarios: SandboxScenarioService,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  async openPosition(userId: string, input: OpenBinaryPositionInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const stake = assertPositiveDecimal(input.stake);
    return this.openPositionOnD1(userId, input, stake);
  }

  async settlePosition(positionId: string, actorUserId?: string) {
    return this.settlePositionOnD1(positionId, actorUserId);
  }

  private async settlePositionOnD1(positionId: string, actorUserId?: string) {
    const raw: any = await this.d1.getBinaryPosition(positionId);
    if (!raw) throw new NotFoundException('Binary position not found');
    if (actorUserId && String(raw.userId) !== actorUserId) throw new BadRequestException('Binary position ownership mismatch');
    const terminal = new Set<string>([Gate2BinaryState.WIN, Gate2BinaryState.LOSS, Gate2BinaryState.ERROR]).has(String(raw.state));
    if (terminal) return { position: this.withPersistedSandboxSimulation(raw), replayed: true };
    const expiresAt = new Date(String(raw.expiresAt));
    if (expiresAt.getTime() > Date.now()) throw new BadRequestException('Binary position has not expired');
    const pair = await this.d1.getMarketPairForSettlement(String(raw.pair));
    if (!pair) return { position: raw, delayed: true };
    const configuration: any = await this.d1.getBinaryConfiguration(String(raw.pair), Number(raw.durationSeconds), Number(raw.configurationVersion));
    if (!configuration) return { position: raw, error: true };
    const sandbox = await this.sandboxScenarios.findBinaryDirective(this.prisma, String(raw.userId), String(raw.id));
    if (sandbox) return this.settleSandboxPosition({ raw, pair, configuration, expiresAt, sandbox });
    const quote = await this.getApprovedSettlementQuote(pair, {
      observedAt: expiresAt.toISOString(),
      sequence: String(raw.entrySequence),
    });
    if (!quote) return { position: raw, delayed: true };
    return this.settleProviderPosition({ raw, pair, configuration, expiresAt, sandbox: null, quote });
  }

  private async settleSandboxPosition(context: {
    raw: any;
    pair: any;
    configuration: any;
    expiresAt: Date;
    sandbox: NonNullable<Awaited<ReturnType<SandboxScenarioService['findBinaryDirective']>>>;
  }) {
    const entryPrice = new Prisma.Decimal(String(context.raw.entryPrice));
    const expiryPrice = this.sandboxExpiryPrice(entryPrice, String(context.raw.side) as BinarySide, context.sandbox.result);
    return this.persistSettlement({ ...context, entryPrice, expiryPrice, state: context.sandbox.result, quote: null });
  }

  private async settleProviderPosition(context: {
    raw: any;
    pair: any;
    configuration: any;
    expiresAt: Date;
    sandbox: null;
    quote: NonNullable<Awaited<ReturnType<BinaryService['getApprovedSettlementQuote']>>>;
  }) {
    const entryPrice = new Prisma.Decimal(String(context.raw.entryPrice));
    const expiryPrice = new Prisma.Decimal(String(context.quote.price));
    const state = this.outcome(String(context.raw.side) as BinarySide, entryPrice, expiryPrice);
    return this.persistSettlement({ ...context, entryPrice, expiryPrice, state });
  }

  private async persistSettlement(context: {
    raw: any;
    pair: any;
    configuration: any;
    expiresAt: Date;
    sandbox?: NonNullable<Awaited<ReturnType<SandboxScenarioService['findBinaryDirective']>>>;
    quote: any | null;
    entryPrice: Prisma.Decimal;
    expiryPrice: Prisma.Decimal;
    state: 'WIN' | 'LOSS';
  }) {
    const payout = this.payoutFor(context.state, new Prisma.Decimal(String(context.raw.stake)), context.configuration);
    const simulated = Boolean(context.sandbox);
    const settled: any = await this.d1.settleBinaryPositionAtomic({
      positionId: String(context.raw.id),
      userId: String(context.raw.userId),
      asset: String(context.pair.quoteAsset),
      stake: String(context.raw.stake),
      payout: payout.toString(),
      state: context.state,
      expiryPrice: context.expiryPrice.toString(),
      expiryQuoteId: simulated ? null : context.quote.id,
      expiryProvider: simulated ? 'nexi-sandbox-simulation' : context.quote.provider,
      expirySource: simulated ? `sandbox:${context.sandbox!.commandId}:${context.sandbox!.mode}` : context.quote.source,
      expiryObservedAt: simulated ? context.expiresAt.toISOString() : context.quote.observedAt,
      expiryReceivedAt: simulated ? new Date().toISOString() : context.quote.receivedAt,
      expirySequence: simulated ? String(context.raw.entrySequence) : String(context.quote.sequence),
      realizedProfit: payout.sub(new Prisma.Decimal(String(context.raw.stake))).toString(),
      idempotencyKey: String(context.raw.idempotencyKey),
      correlationId: String(context.raw.correlationId),
    });
    const position = simulated
      ? { ...settled, sandboxSimulation: this.buildSandboxSimulation(context.raw, context.sandbox!, context.expiryPrice, true) }
      : settled;
    this.binaryGateway.emitPositionUpdate(String(context.raw.userId), { event: 'binary.position.settled', position });
    return { position, replayed: false };
  }

  private async openPositionOnD1(userId: string, input: OpenBinaryPositionInput, stake: Prisma.Decimal) {
    const pair = await this.d1.getActiveMarketPair(input.pair);
    if (!pair || !this.isBinaryPairAvailable(pair.symbol)) {
      throw new ServiceUnavailableException(`Binary settlement authority unavailable for ${input.pair}`);
    }
    const configuration: any = await this.d1.getBinaryConfiguration(pair.symbol, input.durationSeconds);
    if (!configuration || configuration.enabled !== 1 && configuration.enabled !== true) throw new ServiceUnavailableException('Binary configuration unavailable');
    if (stake.lt(new Prisma.Decimal(String(configuration.minStake))) || stake.gt(new Prisma.Decimal(String(configuration.maxStake)))) {
      throw new BadRequestException('Stake is outside configured limits');
    }
    const quote = await this.getApprovedSettlementQuote(pair);
    if (!quote) throw new ServiceUnavailableException(`Approved settlement quote unavailable for ${pair.symbol}`);
    const expiresAt = new Date(Date.now() + input.durationSeconds * 1000);
    const position: any = await this.d1.openBinaryPosition({
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
    const positions: any[] = await this.d1.listBinaryPositions(undefined, true);
    return Promise.all(positions.filter((position) => new Date(String(position.expiresAt)).getTime() <= Date.now()).map((position) => this.settlePosition(String(position.id))));
  }

  async getCurrentPositions(userId: string) {
    const positions: any[] = await this.d1.listBinaryPositions(userId, true);
    return Promise.all(positions.map(async (position) => {
      const directive = await this.sandboxScenarios.findBinaryDirective(this.prisma, userId, String(position.id));
      if (!directive) return position;
      const expiryPrice = this.sandboxExpiryPrice(
        new Prisma.Decimal(String(position.entryPrice)),
        String(position.side) as BinarySide,
        directive.result,
      );
      return {
        ...position,
        sandboxSimulation: this.buildSandboxSimulation(position, directive, expiryPrice, false),
      };
    }));
  }

  async getHistory(userId: string) {
    const positions: any[] = await this.d1.listBinaryPositions(userId, false);
    return positions.map((position) => this.withPersistedSandboxSimulation(position));
  }

  async getConfig() {
    const configurations: any[] = (await this.d1.listBinaryConfigurations()).filter((configuration) => this.isBinaryPairAvailable(String(configuration.pair)));
    const durations = [...new Set(configurations.map((configuration) => Number(configuration.durationSeconds)))].sort((a, b) => a - b);
    return { durations, configurations };
  }

  private sandboxExpiryPrice(
    entry: Prisma.Decimal,
    side: BinarySide,
    result: 'WIN' | 'LOSS',
  ): Prisma.Decimal {
    const delta = entry.mul('0.001').toDecimalPlaces(18, Prisma.Decimal.ROUND_UP);
    const movement = delta.isZero() ? new Prisma.Decimal('0.000000000000000001') : delta;
    const higher = (side === BinarySide.CALL) === (result === Gate2BinaryState.WIN);
    const expiry = higher ? entry.add(movement) : entry.sub(movement);
    if (expiry.isZero() || expiry.isNegative()) {
      throw new BadRequestException('Sandbox outcome cannot produce a positive expiry price');
    }
    return expiry;
  }

  private buildSandboxSimulation(
    position: any,
    directive: { commandId: string; mode: string; result: 'WIN' | 'LOSS' },
    expiryPrice: Prisma.Decimal,
    completed: boolean,
  ) {
    const durationSeconds = Math.max(1, Number(position.durationSeconds) || 1);
    const expiresAtMs = new Date(String(position.expiresAt)).getTime();
    const createdAtMs = position.createdAt
      ? new Date(String(position.createdAt)).getTime()
      : expiresAtMs - durationSeconds * 1000;
    const endAtMs = completed
      ? expiresAtMs
      : Math.min(Date.now(), expiresAtMs);
    const entry = new Prisma.Decimal(String(position.entryPrice));
    const count = Math.min(12, Math.max(2, Math.ceil(durationSeconds / 5)));
    const candles: Array<Record<string, string | number>> = [];
    const source = `binary-sandbox:${directive.commandId}`;
    for (let index = 0; index < count; index += 1) {
      const start = createdAtMs + durationSeconds * 1000 * index / count;
      const scheduledEnd = createdAtMs + durationSeconds * 1000 * (index + 1) / count;
      if (start >= endAtMs) break;
      const end = Math.min(scheduledEnd, endAtMs);
      if (end <= start) continue;
      const openRatio = (start - createdAtMs) / (durationSeconds * 1000);
      const closeRatio = (end - createdAtMs) / (durationSeconds * 1000);
      const open = entry.add(expiryPrice.sub(entry).mul(openRatio));
      const close = entry.add(expiryPrice.sub(entry).mul(closeRatio));
      const high = Prisma.Decimal.max(open, close);
      const low = Prisma.Decimal.min(open, close);
      candles.push({
        sequence: index,
        openTime: new Date(start).toISOString(),
        closeTime: new Date(end).toISOString(),
        open: open.toString(),
        high: high.toString(),
        low: low.toString(),
        close: close.toString(),
        volume: '0',
        provider: 'nexi-sandbox-simulation',
        source,
      });
    }
    return {
      scenarioId: directive.commandId,
      mode: directive.mode,
      plannedResult: directive.result,
      state: completed ? directive.result : String(position.state),
      source: 'nexi-sandbox-simulation',
      entryPrice: entry.toString(),
      expiryPrice: expiryPrice.toString(),
      candles,
    };
  }

  private withPersistedSandboxSimulation(position: any) {
    if (String(position.expiryProvider) !== 'nexi-sandbox-simulation' || !position.expiryPrice) {
      return position;
    }
    const parts = String(position.expirySource ?? '').split(':');
    const directive = {
      commandId: parts[1] ?? 'unknown',
      mode: parts[2] ?? 'forced',
      result: String(position.state) as 'WIN' | 'LOSS',
    };
    return {
      ...position,
      sandboxSimulation: this.buildSandboxSimulation(
        position,
        directive,
        new Prisma.Decimal(String(position.expiryPrice)),
        true,
      ),
    };
  }

  private outcome(side: BinarySide, entry: Prisma.Decimal, expiry: Prisma.Decimal): 'WIN' | 'LOSS' {
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

  private async getApprovedSettlementQuote(
    pair: { id: string; symbol: string },
    minimum: { observedAt?: string; sequence?: string } = {},
  ) {
    const quote = await this.d1.getLiveMarketQuote(pair.id, minimum.observedAt, minimum.sequence);
    return quote && this.isSettlementQuoteAllowed(pair.symbol, quote.provider) ? quote : null;
  }

  private isBinaryPairAvailable(symbol: string): boolean {
    // Jest integration fixtures intentionally use deterministic isolated pairs.
    if (process.env.NODE_ENV === 'test') return true;
    return Boolean(getMarketSourcePolicy(symbol));
  }

  private isSettlementQuoteAllowed(symbol: string, provider: string): boolean {
    if (isDeterministicTestProvider(provider)) return true;
    const policy = getMarketSourcePolicy(symbol);
    if (policy?.assetClass === 'crypto') return isSettlementApproved(symbol, provider);
    return getProviderMapping(symbol, provider)?.quoteSupported === true;
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }
}
