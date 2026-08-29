import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AssetLifecycleStatus, MarketQuoteState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MARKET_QUOTES_CHANNEL } from './market.types';
import { CANONICAL_MARKET_CATALOG, canonicalMarketPair } from './market-catalog';
import {
  getMarketSourcePolicy,
  getProviderMapping,
  isDeterministicTestProvider,
  MarketPriceType,
  resolveProviderInstrument,
} from './market-source-registry';

export interface NormalizedMarketQuoteInput {
  symbol: string;
  provider: string;
  source: string;
  price: string | number;
  change24h?: string | number | null;
  volume24h?: string | number | null;
  high24h?: string | number | null;
  low24h?: string | number | null;
  sequence?: string | number | bigint;
  observedAt: Date;
  providerInstrument?: string;
  priceType?: MarketPriceType;
  rawData?: Prisma.InputJsonValue;
}

export interface MarketQuoteEvent {
  version: 'v1';
  event: 'market.quote';
  sequence: string;
  emittedAt: string;
  quote: {
    symbol: string;
    price: string | null;
    change24h: string | null;
    volume24h: string | null;
    high24h: string | null;
    low24h: string | null;
    state: MarketQuoteState;
    provider: string;
    source: string;
    providerInstrument: string;
    priceType: MarketPriceType;
    canonicalAssetId: string | null;
    assetClass: string | null;
    observedAt: string | null;
    receivedAt: string;
  };
}

const DEFAULT_MARKET_SYMBOLS = CANONICAL_MARKET_CATALOG.map((entry) => entry.symbol);

@Injectable()
export class MarketAuthorityService implements OnModuleInit {
  private readonly logger = new Logger(MarketAuthorityService.name);
  private readonly staleAfterMs = this.readStaleAfterMs();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    // MarketSeederService owns the single catalog reconciliation job. Keeping
    // this lifecycle hook side-effect free prevents two concurrent Prisma
    // upsert loops from competing for the small runtime connection pool.
    this.logger.log('Market catalog reconciliation delegated to MarketSeederService');
  }

  async ensureCatalog(symbols = DEFAULT_MARKET_SYMBOLS): Promise<void> {
    for (const rawSymbol of symbols) {
      const symbol = this.normalizeSymbol(rawSymbol);
      const { base, quote } = this.splitSymbol(symbol);
      const catalogEntry = canonicalMarketPair.get(symbol);
      const baseAsset = await this.prisma.marketAsset.upsert({
        where: { symbol: base },
        update: {
          status: AssetLifecycleStatus.ACTIVE,
          displayName: catalogEntry?.displayName ?? base,
          // Provider symbols belong to individual assets here. Pair-specific
          // lineage is carried by the quote/snapshot records and must not
          // overwrite a shared asset such as USD.
          providerSymbol: base,
        },
        create: {
          symbol: base,
          displayName: catalogEntry?.displayName ?? base,
          category: catalogEntry?.category ?? 'crypto',
          providerSymbol: base,
        },
      });
      const quoteAsset = await this.prisma.marketAsset.upsert({
        where: { symbol: quote },
        update: { status: AssetLifecycleStatus.ACTIVE, providerSymbol: quote },
        create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
      });
      for (const asset of [baseAsset, quoteAsset]) {
        await this.prisma.marketAssetCapability.upsert({
          where: { capabilityKey: `${asset.id}:market` },
          update: { status: AssetLifecycleStatus.ACTIVE, tradingEnabled: true },
          create: {
            assetId: asset.id,
            capabilityKey: `${asset.id}:market`,
            tradingEnabled: true,
            status: AssetLifecycleStatus.ACTIVE,
          },
        });
      }
      await this.prisma.marketPair.upsert({
        where: { symbol },
        update: {
          baseAssetId: baseAsset.id,
          quoteAssetId: quoteAsset.id,
          status: AssetLifecycleStatus.ACTIVE,
        },
        create: {
          symbol,
          baseAssetId: baseAsset.id,
          quoteAssetId: quoteAsset.id,
          category: catalogEntry?.category ?? 'crypto',
          status: AssetLifecycleStatus.ACTIVE,
        },
      });
    }
  }

  async getPrices(): Promise<Array<Record<string, unknown>>> {
    const pairs = await this.prisma.marketPair.findMany({
      // Catalog reconciliation is startup/explicit-path work. This public
      // read must remain side-effect free and must not expose legacy pairs.
      where: { status: AssetLifecycleStatus.ACTIVE, symbol: { in: DEFAULT_MARKET_SYMBOLS } },
      orderBy: { symbol: 'asc' },
      // Do not include the historical snapshot relation on this catalog read.
      // MarketQuoteSnapshot is an append-only history table and can contain
      // hundreds of thousands of rows; the public prices endpoint only needs
      // the bounded latest row.
      include: { latest: true },
    });
    const klineRows = pairs.length === 0 || !this.prisma.marketKline
      ? []
      : await this.prisma.marketKline.findMany({
        where: { pairId: { in: pairs.map((pair) => pair.id) }, interval: '1m' },
        orderBy: { openTime: 'desc' },
        take: pairs.length * 16,
        select: { symbol: true, close: true },
      });
    const sparklines = new Map<string, number[]>();
    for (const row of [...klineRows].reverse()) {
      const values = sparklines.get(row.symbol) ?? [];
      if (values.length < 12) values.push(Number(row.close));
      sparklines.set(row.symbol, values);
    }

      return pairs.map((pair) => {
        const latest = pair.latest;
      const lineage = latest
        ? { providerInstrument: resolveProviderInstrument(pair.symbol, latest.provider) ?? pair.symbol, priceType: 'LAST' as MarketPriceType }
        : undefined;
      const providerEnabled = this.isRuntimeProviderEnabled(latest?.provider);
      const state = providerEnabled ? this.effectiveState(latest) : MarketQuoteState.UNAVAILABLE;
      const sparkline = providerEnabled ? sparklines.get(pair.symbol) : undefined;
      return {
        symbol: pair.symbol,
        lastPrice: providerEnabled ? this.decimalString(latest?.price) : null,
        priceChangePercent: providerEnabled ? this.decimalString(latest?.change24h) : null,
        volume: providerEnabled ? this.decimalString(latest?.volume24h) : null,
        high: providerEnabled ? this.decimalString(latest?.high24h) : null,
        low: providerEnabled ? this.decimalString(latest?.low24h) : null,
        provider: providerEnabled ? latest?.provider ?? null : null,
        source: providerEnabled ? latest?.source ?? null : null,
        canonicalAssetId: getMarketSourcePolicy(pair.symbol)?.canonicalAssetId ?? null,
        assetClass: getMarketSourcePolicy(pair.symbol)?.assetClass ?? null,
        displaySymbol: getMarketSourcePolicy(pair.symbol)?.displaySymbol ?? pair.symbol,
        providerInstrument: providerEnabled ? resolveProviderInstrument(pair.symbol, latest?.provider ?? '') ?? pair.symbol : null,
        priceType: providerEnabled ? lineage.priceType : null,
        observedAt: providerEnabled ? latest?.observedAt?.toISOString() ?? null : null,
        receivedAt: providerEnabled ? latest?.receivedAt?.toISOString() ?? null : null,
        sequence: providerEnabled ? latest?.sequence?.toString() ?? null : null,
        sparkline: sparkline && sparkline.length > 1 ? sparkline : null,
        state,
        dataState: state === MarketQuoteState.LIVE
          ? 'LIVE'
          : state === MarketQuoteState.STALE
            ? 'STALE'
            : state === MarketQuoteState.ERROR
              ? 'ERROR'
              : 'UNAVAILABLE',
      };
    });
  }

  async ingestQuote(input: NormalizedMarketQuoteInput): Promise<{ accepted: boolean; event?: MarketQuoteEvent; reason?: string }> {
    const symbol = this.normalizeSymbol(input.symbol);
    const provider = this.requiredText(input.provider, 'provider');
    const source = this.requiredText(input.source, 'source');
    const sourcePolicy = getMarketSourcePolicy(symbol);
    const providerMapping = getProviderMapping(symbol, provider);
    if (!sourcePolicy && !isDeterministicTestProvider(provider)) {
      throw new Error(`Market symbol is not in the canonical source registry: ${symbol}`);
    }
    if (!providerMapping && !isDeterministicTestProvider(provider)) {
      throw new Error(`Market provider is not mapped for ${symbol}: ${provider}`);
    }
    const providerInstrument = input.providerInstrument?.trim()
      || providerMapping?.instrument
      || symbol;
    const priceType: MarketPriceType = input.priceType ?? 'LAST';
    const price = this.decimal(input.price, 'price');
    if (price.isNegative() || price.isZero()) {
      throw new Error('Market quote price must be positive');
    }

    const pair = await this.getOrCreatePair(symbol);
    const result = await this.prisma.$transaction(async (tx) => {
      // Serialize writers for this canonical pair before deriving the next
      // sequence. Multiple provider pollers can otherwise read the same latest
      // row concurrently and collide on (pairId, sequence).
      if (!isDeterministicTestProvider(provider) && typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM "MarketPair" WHERE id = ${pair.id} FOR UPDATE`;
      }
      const latest = await tx.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
      if (latest?.observedAt && input.observedAt.getTime() < latest.observedAt.getTime()) {
        return { accepted: false as const, reason: 'OBSERVATION_OLDER_THAN_LATEST' as const };
      }
      // Production provider sequences are provider-scoped; normalize them to a
      // canonical-pair monotonic sequence because multiple providers may publish
      // the same pair and snapshots enforce uniqueness on (pairId, sequence).
      const providerSequence = input.sequence === undefined ? undefined : BigInt(input.sequence);
      if (providerSequence !== undefined && isDeterministicTestProvider(provider)) {
        if (providerSequence <= (latest?.sequence ?? -1n)) {
          return { accepted: false as const, reason: 'DUPLICATE_OR_STALE' as const };
        }
      }
      const sequence = isDeterministicTestProvider(provider) && providerSequence !== undefined
        ? providerSequence
        : (latest?.sequence ?? 0n) + 1n;

      const receivedAt = new Date();
      const lineage = {
        providerInstrument,
        priceType,
        canonicalAssetId: sourcePolicy?.canonicalAssetId ?? null,
        assetClass: sourcePolicy?.assetClass ?? null,
      };
      const data = {
        symbol,
        provider,
        source,
        sequence,
        price,
        change24h: this.optionalDecimal(input.change24h),
        volume24h: this.optionalDecimal(input.volume24h),
        high24h: this.optionalDecimal(input.high24h),
        low24h: this.optionalDecimal(input.low24h),
        observedAt: input.observedAt,
        receivedAt,
        rawData: this.withLineage(input.rawData, lineage),
      };
      await tx.marketQuoteSnapshot.create({ data: { pairId: pair.id, ...data } });
      // MarketQuoteLatest intentionally stores the normalized projection only;
      // raw provider payloads belong to the immutable snapshot record above.
      const { rawData: _rawData, ...latestQuoteData } = data;
      const latestData = { ...latestQuoteData, state: MarketQuoteState.LIVE };
      await tx.marketQuoteLatest.upsert({
        where: { pairId: pair.id },
        update: latestData,
        create: { pairId: pair.id, ...latestData },
      });
      return { accepted: true as const, pairId: pair.id, latest: { ...latestData } };
    });

    if (!result.accepted) {
      return result;
    }

    const event = this.toEvent(result.latest, { providerInstrument, priceType });
    let published = true;
    try {
      if (this.redis.isAvailable()) {
        await this.redis.publish(MARKET_QUOTES_CHANNEL, JSON.stringify(event));
      } else {
        published = false;
      }
    } catch (error) {
      published = false;
      this.logger.warn(`Market event publication deferred: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    return published ? { accepted: true, event } : { accepted: true, event, reason: 'PERSISTED_NOT_PUBLISHED' };
  }

  async markUnavailable(symbol: string, provider = 'none', source = 'runtime'): Promise<void> {
    const pair = await this.getOrCreatePair(this.normalizeSymbol(symbol));
    await this.prisma.marketQuoteLatest.upsert({
      where: { pairId: pair.id },
      update: {
        provider,
        source,
        state: MarketQuoteState.UNAVAILABLE,
        receivedAt: new Date(),
      },
      create: {
        pairId: pair.id,
        symbol: pair.symbol,
        provider,
        source,
        sequence: 0n,
        state: MarketQuoteState.UNAVAILABLE,
      },
    });
  }

  async setAssetMaintenance(symbol: string, status: AssetLifecycleStatus, maintenanceNote?: string): Promise<void> {
    await this.prisma.marketAsset.update({
      where: { symbol: this.normalizeSymbol(symbol) },
      data: { status, maintenanceNote },
    });
  }

  async setPairMaintenance(symbol: string, status: AssetLifecycleStatus, maintenanceNote?: string): Promise<void> {
    await this.prisma.marketPair.update({
      where: { symbol: this.normalizeSymbol(symbol) },
      data: { status, maintenanceNote },
    });
  }

  async getSnapshot(symbol: string): Promise<MarketQuoteEvent['quote'] | null> {
    const latest = await this.prisma.marketQuoteLatest.findFirst({ where: { symbol: this.normalizeSymbol(symbol) } });
    if (!latest) return null;
    const snapshot = await this.prisma.marketQuoteSnapshot.findFirst({ where: { pairId: latest.pairId }, orderBy: { sequence: 'desc' } });
    return this.toQuote(latest, this.snapshotLineage(snapshot?.rawData));
  }

  private async getOrCreatePair(symbol: string) {
    const { base, quote } = this.splitSymbol(symbol);
    const catalogEntry = canonicalMarketPair.get(symbol);
    const baseAsset = await this.prisma.marketAsset.upsert({
      where: { symbol: base },
      update: { providerSymbol: base },
      create: {
        symbol: base,
        displayName: catalogEntry?.displayName ?? base,
        category: catalogEntry?.category ?? 'crypto',
        providerSymbol: base,
      },
    });
    const quoteAsset = await this.prisma.marketAsset.upsert({
      where: { symbol: quote },
      update: { providerSymbol: quote },
      create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
    });
    return this.prisma.marketPair.upsert({
      where: { symbol },
      update: { baseAssetId: baseAsset.id, quoteAssetId: quoteAsset.id },
      create: {
        symbol,
        baseAssetId: baseAsset.id,
        quoteAssetId: quoteAsset.id,
        category: catalogEntry?.category ?? 'crypto',
      },
    });
  }

  private toEvent(latest: { symbol: string; sequence: bigint; price: Prisma.Decimal; change24h?: Prisma.Decimal | null; volume24h?: Prisma.Decimal | null; high24h?: Prisma.Decimal | null; low24h?: Prisma.Decimal | null; state?: MarketQuoteState; provider: string; source: string; observedAt: Date; receivedAt: Date }, lineage?: { providerInstrument?: string; priceType?: MarketPriceType }): MarketQuoteEvent {
    return {
      version: 'v1',
      event: 'market.quote',
      sequence: latest.sequence.toString(),
      emittedAt: new Date().toISOString(),
      quote: this.toQuote(latest, lineage),
    };
  }

  private toQuote(latest: { symbol: string; sequence: bigint; price?: Prisma.Decimal | null; change24h?: Prisma.Decimal | null; volume24h?: Prisma.Decimal | null; high24h?: Prisma.Decimal | null; low24h?: Prisma.Decimal | null; state?: MarketQuoteState; provider: string; source: string; observedAt?: Date | null; receivedAt: Date }, lineage?: { providerInstrument?: string; priceType?: MarketPriceType }): MarketQuoteEvent['quote'] {
    const policy = getMarketSourcePolicy(latest.symbol);
    return {
      symbol: latest.symbol,
      price: this.decimalString(latest.price),
      change24h: this.decimalString(latest.change24h),
      volume24h: this.decimalString(latest.volume24h),
      high24h: this.decimalString(latest.high24h),
      low24h: this.decimalString(latest.low24h),
      state: this.effectiveState(latest),
      provider: latest.provider,
      source: latest.source,
      providerInstrument: lineage?.providerInstrument || resolveProviderInstrument(latest.symbol, latest.provider) || latest.symbol,
      priceType: lineage?.priceType || 'LAST',
      canonicalAssetId: policy?.canonicalAssetId ?? null,
      assetClass: policy?.assetClass ?? null,
      observedAt: latest.observedAt?.toISOString() ?? null,
      receivedAt: latest.receivedAt.toISOString(),
    };
  }

  private effectiveState(latest: { state?: MarketQuoteState; observedAt?: Date | null }): MarketQuoteState {
    if (!latest?.state || latest.state !== MarketQuoteState.LIVE || !latest.observedAt) {
      return latest?.state ?? MarketQuoteState.UNAVAILABLE;
    }
    return Date.now() - latest.observedAt.getTime() > this.staleAfterMs
      ? MarketQuoteState.STALE
      : MarketQuoteState.LIVE;
  }

  private isRuntimeProviderEnabled(provider?: string | null): boolean {
    if (!provider) return false;
    const configured = (process.env.MARKET_PROVIDER_NAMES ?? process.env.MARKET_PROVIDER_NAME ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return process.env.MARKET_PROVIDER_ENABLED === 'true' && configured.includes(provider.toLowerCase());
  }

  private readStaleAfterMs(): number {
    const value = Number.parseInt(process.env.MARKET_QUOTE_STALE_AFTER_MS ?? '30000', 10);
    return Number.isFinite(value) && value > 0 ? value : 30000;
  }

  private normalizeSymbol(value: string): string {
    const symbol = value.trim().toUpperCase().replace(/\.US\/USDT$/, 'USDT').replaceAll('/', '').replaceAll('.', '');
    if (!/^[A-Z0-9]{4,24}$/.test(symbol)) throw new Error('Market symbol is invalid');
    return symbol;
  }

  private splitSymbol(symbol: string): { base: string; quote: string } {
    const catalogEntry = canonicalMarketPair.get(symbol);
    if (catalogEntry?.providerSymbol.includes('/')) {
      const [base, quote] = catalogEntry.providerSymbol.split('/');
      if (base && quote) return { base, quote };
    }
    if (symbol.endsWith('USDT') && symbol.length > 4) return { base: symbol.slice(0, -4), quote: 'USDT' };
    if (symbol.endsWith('USD') && symbol.length > 3) return { base: symbol.slice(0, -3), quote: 'USD' };
    throw new Error(`Market symbol has no supported quote asset: ${symbol}`);
  }

  private requiredText(value: string, field: string): string {
    const text = value?.trim();
    if (!text) throw new Error(`Market ${field} is required`);
    return text;
  }

  private decimal(value: string | number, field: string): Prisma.Decimal {
    try {
      const result = new Prisma.Decimal(value);
      if (!result.isFinite()) throw new Error('not finite');
      return result;
    } catch {
      throw new Error(`Market ${field} is not a valid decimal`);
    }
  }

  private optionalDecimal(value?: string | number | null): Prisma.Decimal | null {
    return value === undefined || value === null ? null : this.decimal(value, 'metric');
  }

  private decimalString(value?: Prisma.Decimal | null): string | null {
    return value === undefined || value === null ? null : value.toString();
  }

  private snapshotLineage(rawData: Prisma.JsonValue | null | undefined): { providerInstrument?: string; priceType?: MarketPriceType } {
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return {};
    const marker = (rawData as Record<string, unknown>)._nexi;
    if (!marker || typeof marker !== 'object' || Array.isArray(marker)) return {};
    const lineage = marker as Record<string, unknown>;
    const allowed: MarketPriceType[] = ['BID', 'ASK', 'MID', 'LAST', 'CANDLE_CLOSE', 'REFERENCE'];
    return {
      providerInstrument: typeof lineage.providerInstrument === 'string' ? lineage.providerInstrument : undefined,
      priceType: typeof lineage.priceType === 'string' && allowed.includes(lineage.priceType as MarketPriceType) ? lineage.priceType as MarketPriceType : undefined,
    };
  }

  private withLineage(rawData: Prisma.InputJsonValue | undefined, lineage: Record<string, unknown>): Prisma.InputJsonValue {
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      return { ...(rawData as Record<string, unknown>), _nexi: lineage } as Prisma.InputJsonObject;
    }
    return { _nexi: lineage, providerPayload: rawData ?? null } as Prisma.InputJsonObject;
  }
}
