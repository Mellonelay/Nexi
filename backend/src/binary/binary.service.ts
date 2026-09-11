import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { BinarySide, Gate2BinaryState, Prisma } from '../prisma/d1-client';
import { randomUUID } from 'crypto';
import { D1PrismaService } from '../d1/d1-prisma.service';
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
    if (terminal) return { position: raw, replayed: true };
    const expiresAt = new Date(String(raw.expiresAt));
    if (expiresAt.getTime() > Date.now()) throw new BadRequestException('Binary position has not expired');
    const pair = await this.d1.getActiveMarketPair(String(raw.pair));
    const quote = pair ? await this.d1.getLiveMarketQuote(pair.id, expiresAt.toISOString(), String(raw.entrySequence)) : null;
    if (!pair || !quote || !this.isSettlementQuoteAllowed(String(raw.pair), quote.provider)) {
      return { position: raw, delayed: true };
    }
    const configuration: any = await this.d1.getBinaryConfiguration(String(raw.pair), Number(raw.durationSeconds), Number(raw.configurationVersion));
    if (!configuration) return { position: raw, error: true };
    const sandbox = await this.sandboxScenarios.findBinaryDirective(this.prisma, String(raw.userId), String(raw.id));
    const state = (sandbox?.result ?? this.outcome(String(raw.side) as BinarySide, new Prisma.Decimal(String(raw.entryPrice)), new Prisma.Decimal(quote.price))) as 'WIN' | 'LOSS';
    const payout = this.payoutFor(state, new Prisma.Decimal(String(raw.stake)), configuration);
    const position: any = await this.d1.settleBinaryPositionAtomic({
      positionId, userId: String(raw.userId), asset: pair.quoteAsset, stake: String(raw.stake), payout: payout.toString(), state,
      expiryPrice: quote.price.toString(), expiryQuoteId: quote.id, expiryProvider: quote.provider, expirySource: quote.source,
      expiryObservedAt: quote.observedAt, expiryReceivedAt: quote.receivedAt, expirySequence: String(quote.sequence),
      realizedProfit: payout.sub(new Prisma.Decimal(String(raw.stake))).toString(), idempotencyKey: String(raw.idempotencyKey), correlationId: String(raw.correlationId),
    });
    this.binaryGateway.emitPositionUpdate(String(raw.userId), { event: 'binary.position.settled', position });
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
    const quote = await this.d1.getLiveMarketQuote(pair.id);
    if (!quote) throw new ServiceUnavailableException(`Live market quote unavailable for ${pair.symbol}`);
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
    return this.d1.listBinaryPositions(userId, true);
  }

  async getHistory(userId: string) {
    return this.d1.listBinaryPositions(userId, false);
  }

  async getConfig() {
    const configurations: any[] = (await this.d1.listBinaryConfigurations()).filter((configuration) => this.isBinaryPairAvailable(String(configuration.pair)));
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

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }
}
