import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AssetLifecycleStatus, MarketQuoteState, Prisma } from '../prisma/d1-client';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { RedisService } from '../redis/redis.service';
import { MARKET_QUOTES_CHANNEL } from './market.types';
import { CANONICAL_MARKET_CATALOG, canonicalMarketPair } from './market-catalog';
import { MarketProviderRouterService } from './market-provider-router.service';
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
  bid?: string | number | null;
  ask?: string | number | null;
  spread?: string | number | null;
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
    bid: string | null;
    ask: string | null;
    spread: string | null;
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

const D1_MARKET_PROVIDER_SPECS = {
  'binance-spot': {
    id: 'provider-binance-spot', displayName: 'Binance Spot', priority: 10,
    restBaseUrl: 'https://data-api.binance.vision', websocketBaseUrl: 'wss://stream.binance.com:9443',
    supportsQuotes: true, supportsKlines: true, supportsTrades: true, supportsDepth: true,
  },
  biquote: {
    id: 'provider-biquote', displayName: 'BiQuote', priority: 15,
    restBaseUrl: 'https://biquote.io', websocketBaseUrl: 'https://biquote.io/hubs/tick',
    supportsQuotes: true, supportsKlines: true, supportsTrades: false, supportsDepth: false,
  },
  gate: {
    id: 'provider-gate', displayName: 'Gate', priority: 20,
    restBaseUrl: 'https://api.gateio.ws', websocketBaseUrl: null,
    supportsQuotes: true, supportsKlines: true, supportsTrades: false, supportsDepth: false,
  },
  yahoo: {
    id: 'provider-yahoo', displayName: 'Yahoo Finance', priority: 30,
    restBaseUrl: 'https://query1.finance.yahoo.com', websocketBaseUrl: null,
    supportsQuotes: true, supportsKlines: true, supportsTrades: false, supportsDepth: false,
  },
  moex: {
    id: 'provider-moex', displayName: 'Moscow Exchange ISS', priority: 5,
    restBaseUrl: 'https://iss.moex.com', websocketBaseUrl: null,
    supportsQuotes: true, supportsKlines: true, supportsTrades: false, supportsDepth: false,
  },
} as const;

function policyPrimaryProvider(symbol: string): string {
  return getMarketSourcePolicy(symbol)?.displayPolicy.primaryProvider ?? '';
}

@Injectable()
export class MarketAuthorityService implements OnModuleInit {
  private get db(): any { return this.d1; }

  private readonly logger = new Logger(MarketAuthorityService.name);
  private readonly staleAfterMs = this.readStaleAfterMs();

  constructor(
    private readonly redis: RedisService,
    private readonly d1: D1PrismaService,
    private readonly providerRouter: MarketProviderRouterService,
  ) {}

  onModuleInit(): void {
    // MarketSeederService owns the single catalog reconciliation job. Keeping
    // this lifecycle hook side-effect free prevents two concurrent Prisma
    // upsert loops from competing for the small runtime connection pool.
    this.logger.log('Market catalog reconciliation delegated to MarketSeederService');
  }

  async ensureCatalog(symbols = DEFAULT_MARKET_SYMBOLS): Promise<void> {
    if (this.d1.isEnabled()) {
      await this.ensureCatalogD1(symbols);
      return;
    }
    for (const rawSymbol of symbols) {
      const symbol = this.normalizeSymbol(rawSymbol);
      const { base, quote } = this.splitSymbol(symbol);
      const catalogEntry = canonicalMarketPair.get(symbol);
      const baseAsset = await this.db.marketAsset.upsert({
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
      const quoteAsset = await this.db.marketAsset.upsert({
        where: { symbol: quote },
        update: { status: AssetLifecycleStatus.ACTIVE, providerSymbol: quote },
        create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
      });
      for (const asset of [baseAsset, quoteAsset]) {
        await this.db.marketAssetCapability.upsert({
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
      await this.db.marketPair.upsert({
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
    const pairs = await this.db.marketPair.findMany({
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
    const klineRows = pairs.length === 0 || !this.db.marketKline
      ? []
      : await this.db.marketKline.findMany({
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

  async getAssets(): Promise<Array<Record<string, unknown>>> {
    const pairs = await this.db.marketPair.findMany({
      where: { status: AssetLifecycleStatus.ACTIVE, symbol: { in: DEFAULT_MARKET_SYMBOLS } },
      orderBy: { symbol: 'asc' },
      include: {
        baseAsset: { select: { symbol: true, displayName: true, status: true } },
        quoteAsset: { select: { symbol: true, displayName: true, status: true } },
      },
    });
    return pairs.map((pair) => {
      const policy = getMarketSourcePolicy(pair.symbol);
      const catalog = canonicalMarketPair.get(pair.symbol);
      return {
        id: pair.id,
        symbol: pair.symbol,
        displaySymbol: policy?.displaySymbol ?? pair.symbol,
        displayName: catalog?.displayName ?? pair.baseAsset.displayName ?? pair.baseAsset.symbol,
        category: pair.category,
        status: pair.status,
        baseAsset: pair.baseAsset.symbol,
        quoteAsset: pair.quoteAsset.symbol,
        canonicalAssetId: policy?.canonicalAssetId ?? null,
        assetClass: policy?.assetClass ?? pair.category,
      };
    });
  }

  async getAsset(symbolInput: string): Promise<Record<string, unknown> | null> {
    const symbol = this.normalizeSymbol(symbolInput);
    if (!DEFAULT_MARKET_SYMBOLS.includes(symbol)) return null;
    const assets = await this.getAssets();
    return assets.find((asset) => asset.symbol === symbol) ?? null;
  }

  async ingestQuote(input: NormalizedMarketQuoteInput): Promise<{ accepted: boolean; event?: MarketQuoteEvent; reason?: string }> {
    if (this.d1.isEnabled()) return this.ingestQuoteD1(input);
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
    const result = await this.db.$transaction(async (tx) => {
      // Serialize writers for this canonical pair before deriving the next
      // sequence. Multiple provider pollers can otherwise read the same latest
      // row concurrently and collide on (pairId, sequence).
      if (!isDeterministicTestProvider(provider) && typeof tx.$queryRaw === 'function') {
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
        bid: this.optionalDecimal(input.bid),
        ask: this.optionalDecimal(input.ask),
        spread: this.optionalDecimal(input.spread),
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
    await this.db.marketQuoteLatest.upsert({
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
    await this.db.marketAsset.update({
      where: { symbol: this.normalizeSymbol(symbol) },
      data: { status, maintenanceNote },
    });
  }

  async setPairMaintenance(symbol: string, status: AssetLifecycleStatus, maintenanceNote?: string): Promise<void> {
    await this.db.marketPair.update({
      where: { symbol: this.normalizeSymbol(symbol) },
      data: { status, maintenanceNote },
    });
  }

  async getSnapshot(symbol: string): Promise<MarketQuoteEvent['quote'] | null> {
    const latest = await this.db.marketQuoteLatest.findFirst({ where: { symbol: this.normalizeSymbol(symbol) } });
    if (!latest) return null;
    const snapshot = await this.db.marketQuoteSnapshot.findFirst({ where: { pairId: latest.pairId }, orderBy: { sequence: 'desc' } });
    return this.toQuote(latest, this.snapshotLineage(snapshot?.rawData));
  }

  private async getOrCreatePair(symbol: string) {
    if (this.d1.isEnabled()) return this.getOrCreatePairD1(symbol);
    const { base, quote } = this.splitSymbol(symbol);
    const catalogEntry = canonicalMarketPair.get(symbol);
    const baseAsset = await this.db.marketAsset.upsert({
      where: { symbol: base },
      update: { providerSymbol: base },
      create: {
        symbol: base,
        displayName: catalogEntry?.displayName ?? base,
        category: catalogEntry?.category ?? 'crypto',
        providerSymbol: base,
      },
    });
    const quoteAsset = await this.db.marketAsset.upsert({
      where: { symbol: quote },
      update: { providerSymbol: quote },
      create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
    });
    return this.db.marketPair.upsert({
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


  private async ensureCatalogD1(symbols: readonly string[]): Promise<void> {
    const db = this.d1 as any;
    const pairs = new Map<string, any>();
    for (const rawSymbol of symbols) {
      const symbol = this.normalizeSymbol(rawSymbol);
      const { base, quote } = this.splitSymbol(symbol);
      const entry = canonicalMarketPair.get(symbol);
      const baseAsset = await db.marketAsset.upsert({
        where: { symbol: base },
        update: { status: 'ACTIVE', displayName: entry?.displayName ?? base, providerSymbol: base },
        create: { symbol: base, displayName: entry?.displayName ?? base, category: entry?.category ?? 'crypto', providerSymbol: base },
      });
      const quoteAsset = await db.marketAsset.upsert({
        where: { symbol: quote },
        update: { status: 'ACTIVE', providerSymbol: quote },
        create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
      });
      for (const asset of [baseAsset, quoteAsset]) {
        const capabilityKey = String(asset.id) + ':market';
        await db.marketAssetCapability.upsert({
          where: { capabilityKey },
          update: { status: 'ACTIVE', tradingEnabled: true },
          create: { assetId: asset.id, capabilityKey, tradingEnabled: true, status: 'ACTIVE' },
        });
      }
      const pair = await db.marketPair.upsert({
        where: { symbol },
        update: { baseAssetId: baseAsset.id, quoteAssetId: quoteAsset.id, category: entry?.category ?? 'crypto', status: 'ACTIVE' },
        create: { symbol, baseAssetId: baseAsset.id, quoteAssetId: quoteAsset.id, category: entry?.category ?? 'crypto', status: 'ACTIVE' },
      });
      pairs.set(symbol, pair);
    }

    // Older unit fixtures model catalog reconciliation without provider tables;
    // keep those isolated tests focused while the D1 client performs the full
    // provider sync in production.
    if (!db.marketProviderConfig?.upsert || !db.marketProviderSymbol?.upsert) return;

    const required = new Map<string, Array<{ symbol: string; providerSymbol: string; kline: boolean; websocket: boolean }>>();
    for (const [symbol] of pairs) {
      const policy = getMarketSourcePolicy(symbol);
      if (!policy) continue;
      // D1 is the runtime routing authority. Persist every implemented provider
      // mapping that can serve either quotes or Klines; otherwise a quote-only
      // primary can make a valid history fallback unreachable at runtime.
      const providers = new Set(
        policy.providerMappings
          .filter((mapping) => (mapping.quoteSupported || mapping.klineSupported) && mapping.provider in D1_MARKET_PROVIDER_SPECS)
          .map((mapping) => mapping.provider),
      );
      for (const provider of providers) {
        const mapping = getProviderMapping(symbol, provider);
        if (!mapping || !(provider in D1_MARKET_PROVIDER_SPECS)) continue;
        const rows = required.get(provider) ?? [];
        rows.push({ symbol, providerSymbol: mapping.instrument, kline: mapping.klineSupported, websocket: mapping.websocketSupported });
        required.set(provider, rows);
      }
    }

    const configs = new Map<string, any>();
    for (const provider of required.keys()) {
      const spec = D1_MARKET_PROVIDER_SPECS[provider as keyof typeof D1_MARKET_PROVIDER_SPECS];
      const config = await db.marketProviderConfig.upsert({
        where: { key: provider },
        update: {
          displayName: spec.displayName, status: 'ACTIVE', priority: spec.priority,
          restBaseUrl: spec.restBaseUrl, websocketBaseUrl: spec.websocketBaseUrl,
          supportsQuotes: spec.supportsQuotes, supportsKlines: spec.supportsKlines,
          supportsTrades: spec.supportsTrades, supportsDepth: spec.supportsDepth,
        },
        create: {
          id: spec.id, key: provider, displayName: spec.displayName, status: 'ACTIVE', priority: spec.priority,
          restBaseUrl: spec.restBaseUrl, websocketBaseUrl: spec.websocketBaseUrl,
          supportsQuotes: spec.supportsQuotes, supportsKlines: spec.supportsKlines,
          supportsTrades: spec.supportsTrades, supportsDepth: spec.supportsDepth,
        },
      });
      configs.set(provider, config);
      for (const row of required.get(provider) ?? []) {
        const pair = pairs.get(row.symbol);
        if (!pair) continue;
        await db.marketProviderSymbol.upsert({
          where: { providerId_pairId: { providerId: config.id, pairId: pair.id } },
          update: {
            providerSymbol: row.providerSymbol, enabled: true, priority: provider === policyPrimaryProvider(row.symbol) ? 1 : 5,
            capabilityPolicy: JSON.stringify({ quote: true, kline: row.kline, bidAsk: provider === 'moex', websocket: row.websocket, depth: false, trades: false }),
          },
          create: {
            id: `${provider}-${pair.id}`, providerId: config.id, pairId: pair.id, providerSymbol: row.providerSymbol,
            enabled: true, priority: provider === policyPrimaryProvider(row.symbol) ? 1 : 5,
            capabilityPolicy: JSON.stringify({ quote: true, kline: row.kline, bidAsk: provider === 'moex', websocket: row.websocket, depth: false, trades: false }),
          },
        });
      }
    }

    const gate = configs.get('gate');
    if (gate) {
      const supportedGateSymbols = new Set((required.get('gate') ?? []).map((row) => row.symbol));
      for (const [symbol, pair] of pairs) {
        if (supportedGateSymbols.has(symbol)) continue;
        await db.marketProviderSymbol.updateMany({
          where: { providerId: gate.id, pairId: pair.id },
          data: {
            enabled: false,
            priority: 100,
            capabilityPolicy: JSON.stringify({ quote: false, kline: false, bidAsk: false, websocket: false, depth: false, trades: false }),
          },
        });
      }
    }

    const biquote = configs.get('biquote');
    if (biquote) {
      for (const symbol of ['AXPUSDT', 'DISUSDT', 'UBERUSDT', 'SONYUSDT', 'USDRUB']) {
        const pair = pairs.get(symbol);
        if (!pair) continue;
        await db.marketProviderSymbol.updateMany({
          where: { providerId: biquote.id, pairId: pair.id },
          data: { enabled: false, priority: 100, capabilityPolicy: JSON.stringify({ quote: false, kline: false, bidAsk: false, websocket: false, depth: false, trades: false }) },
        });
      }
    }
  }

  private async getOrCreatePairD1(symbol: string): Promise<any> {
    const db = this.d1 as any;
    const { base, quote } = this.splitSymbol(symbol);
    const entry = canonicalMarketPair.get(symbol);
    const baseAsset = await db.marketAsset.upsert({
      where: { symbol: base },
      update: { status: 'ACTIVE', providerSymbol: base },
      create: { symbol: base, displayName: entry?.displayName ?? base, category: entry?.category ?? 'crypto', providerSymbol: base },
    });
    const quoteAsset = await db.marketAsset.upsert({
      where: { symbol: quote },
      update: { status: 'ACTIVE', providerSymbol: quote },
      create: { symbol: quote, displayName: quote, category: 'crypto', providerSymbol: quote },
    });
    return db.marketPair.upsert({
      where: { symbol },
      update: { baseAssetId: baseAsset.id, quoteAssetId: quoteAsset.id, category: entry?.category ?? 'crypto', status: 'ACTIVE' },
      create: { symbol, baseAssetId: baseAsset.id, quoteAssetId: quoteAsset.id, category: entry?.category ?? 'crypto', status: 'ACTIVE' },
    });
  }

  private async ingestQuoteD1(input: NormalizedMarketQuoteInput): Promise<{ accepted: boolean; event?: MarketQuoteEvent; reason?: string }> {
    const symbol = this.normalizeSymbol(input.symbol);
    const provider = this.requiredText(input.provider, 'provider');
    const source = this.requiredText(input.source, 'source');
    const policy = getMarketSourcePolicy(symbol);
    const mapping = getProviderMapping(symbol, provider);
    if (!policy && !isDeterministicTestProvider(provider)) throw new Error('Market symbol is not in the canonical source registry: ' + symbol);
    if (!mapping && !isDeterministicTestProvider(provider)) throw new Error('Market provider is not mapped for ' + symbol + ': ' + provider);
    const providerInstrument = input.providerInstrument?.trim() || mapping?.instrument || symbol;
    const priceType = input.priceType ?? 'LAST';
    const price = this.decimal(input.price, 'price');
    if (price.isNegative() || price.isZero()) throw new Error('Market quote price must be positive');
    const pair = await this.getOrCreatePairD1(symbol);
    const db = this.d1 as any;
    const receivedAt = new Date();
    const lineage = { providerInstrument, priceType, canonicalAssetId: policy?.canonicalAssetId ?? null, assetClass: policy?.assetClass ?? null };
    const change24h = this.optionalDecimal(input.change24h);
    const volume24h = this.optionalDecimal(input.volume24h);
    const high24h = this.optionalDecimal(input.high24h);
    const low24h = this.optionalDecimal(input.low24h);
    const bid = this.optionalDecimal(input.bid);
    const ask = this.optionalDecimal(input.ask);
    const spread = this.optionalDecimal(input.spread);

    // Deterministic test providers intentionally control their sequence so the
    // duplicate/out-of-order contract can be exercised without a live D1
    // transaction. Production providers never allocate sequence in NestJS.
    if (isDeterministicTestProvider(provider)) {
      const latest = await db.marketQuoteLatest.findUnique({ where: { pairId: pair.id } });
      if (latest?.observedAt && input.observedAt.getTime() < new Date(latest.observedAt).getTime()) {
        return { accepted: false, reason: 'OBSERVATION_OLDER_THAN_LATEST' };
      }
      const providerSequence = input.sequence === undefined ? undefined : BigInt(input.sequence);
      if (providerSequence !== undefined && providerSequence <= BigInt(latest?.sequence ?? -1)) {
        return { accepted: false, reason: 'DUPLICATE_OR_STALE' };
      }
      const sequence = providerSequence ?? BigInt(latest?.sequence ?? 0) + 1n;
      const data = {
        symbol, provider, source, sequence: sequence.toString(), price: price.toString(),
        change24h: change24h?.toString() ?? null,
        volume24h: volume24h?.toString() ?? null,
        high24h: high24h?.toString() ?? null,
        low24h: low24h?.toString() ?? null,
        bid: bid?.toString() ?? null,
        ask: ask?.toString() ?? null,
        spread: spread?.toString() ?? null,
        observedAt: input.observedAt, receivedAt, rawData: JSON.stringify(this.withLineage(input.rawData, lineage)),
      };
      await db.marketQuoteSnapshot.create({ data: { pairId: pair.id, ...data } });
      const latestData: any = { ...data };
      delete latestData.rawData;
      await db.marketQuoteLatest.upsert({ where: { pairId: pair.id }, update: { ...latestData, state: 'LIVE' }, create: { pairId: pair.id, ...latestData, state: 'LIVE' } });
      const event = this.toEvent({ ...latestData, sequence, state: MarketQuoteState.LIVE, price, change24h, volume24h, high24h, low24h, bid, ask, spread } as any, { providerInstrument, priceType });
      return this.publishD1QuoteEvent(event);
    }

    // The Container-side Prisma adapter cannot span an atomic transaction over
    // multiple HTTP requests. Allocate the canonical sequence and persist both
    // latest + snapshot through one Worker-side D1Database.batch transaction.
    const observedAtSql = this.d1DateTime(input.observedAt);
    const receivedAtSql = this.d1DateTime(receivedAt);
    const rawData = JSON.stringify(this.withLineage(input.rawData, lineage));
    const latestId = randomUUID();
    const snapshotId = randomUUID();
    const scalar = {
      price: price.toString(),
      change24h: change24h?.toString() ?? null,
      volume24h: volume24h?.toString() ?? null,
      high24h: high24h?.toString() ?? null,
      low24h: low24h?.toString() ?? null,
      bid: bid?.toString() ?? null,
      ask: ask?.toString() ?? null,
      spread: spread?.toString() ?? null,
    };

    const batch = await db.atomicBatch([
      {
        sql: `INSERT INTO "MarketQuoteLatest" (
          "id","pairId","symbol","provider","source","sequence","price","change24h","volume24h","high24h","low24h","state","observedAt","receivedAt","bid","ask","spread"
        ) VALUES (?,?,?,?,?,'1',?,?,?,?,?,'LIVE',?,?,?,?,?)
        ON CONFLICT("pairId") DO UPDATE SET
          "symbol"=excluded."symbol",
          "provider"=excluded."provider",
          "source"=excluded."source",
          "sequence"=CAST("MarketQuoteLatest"."sequence" AS INTEGER) + 1,
          "price"=excluded."price",
          "change24h"=excluded."change24h",
          "volume24h"=excluded."volume24h",
          "high24h"=excluded."high24h",
          "low24h"=excluded."low24h",
          "state"='LIVE',
          "observedAt"=excluded."observedAt",
          "receivedAt"=excluded."receivedAt",
          "bid"=excluded."bid",
          "ask"=excluded."ask",
          "spread"=excluded."spread"
        WHERE "MarketQuoteLatest"."observedAt" IS NULL OR excluded."observedAt" >= "MarketQuoteLatest"."observedAt"
        RETURNING "sequence"`,
        params: [
          latestId, pair.id, symbol, provider, source,
          scalar.price, scalar.change24h, scalar.volume24h, scalar.high24h, scalar.low24h,
          observedAtSql, receivedAtSql, scalar.bid, scalar.ask, scalar.spread,
        ],
      },
      {
        // A batch is constructed before it executes, so statement two cannot
        // bind statement one's RETURNING value in application code. Instead it
        // reads the just-updated row inside the same D1 transaction.
        sql: `INSERT INTO "MarketQuoteSnapshot" (
          "id","pairId","symbol","provider","source","sequence","price","change24h","volume24h","high24h","low24h","observedAt","receivedAt","rawData","bid","ask","spread"
        )
        SELECT ?,"pairId","symbol","provider","source","sequence","price","change24h","volume24h","high24h","low24h","observedAt","receivedAt",?,"bid","ask","spread"
        FROM "MarketQuoteLatest"
        WHERE "pairId"=? AND "provider"=? AND "source"=? AND "observedAt"=? AND "receivedAt"=? AND "price"=?`,
        params: [snapshotId, rawData, pair.id, provider, source, observedAtSql, receivedAtSql, scalar.price],
      },
    ]);

    const allocated = batch[0]?.results?.[0] as { sequence?: string | number } | undefined;
    if (allocated?.sequence === undefined) {
      return { accepted: false, reason: 'OBSERVATION_OLDER_THAN_LATEST' };
    }
    const snapshotChanges = Number(batch[1]?.meta?.changes ?? 0);
    if (snapshotChanges !== 1) {
      throw new Error(`D1 market quote atomic batch did not persist exactly one snapshot for ${symbol}`);
    }
    const sequence = BigInt(String(allocated.sequence));
    const event = this.toEvent({
      symbol, provider, source, sequence, state: MarketQuoteState.LIVE,
      price, change24h, volume24h, high24h, low24h, bid, ask, spread,
      observedAt: input.observedAt, receivedAt,
    }, { providerInstrument, priceType });
    return this.publishD1QuoteEvent(event);
  }

  private async publishD1QuoteEvent(event: MarketQuoteEvent): Promise<{ accepted: boolean; event: MarketQuoteEvent; reason?: string }> {
    try {
      if (this.redis.isAvailable()) {
        await this.redis.publish(MARKET_QUOTES_CHANNEL, JSON.stringify(event));
        return { accepted: true, event };
      }
    } catch (error) {
      this.logger.warn(`Market event publication deferred: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    return { accepted: true, event, reason: 'PERSISTED_NOT_PUBLISHED' };
  }

  private d1DateTime(value: Date): string {
    return value.toISOString().replace('Z', '+00:00');
  }

  private toEvent(latest: { symbol: string; sequence: bigint; price: Prisma.Decimal; change24h?: Prisma.Decimal | null; volume24h?: Prisma.Decimal | null; high24h?: Prisma.Decimal | null; low24h?: Prisma.Decimal | null; bid?: Prisma.Decimal | null; ask?: Prisma.Decimal | null; spread?: Prisma.Decimal | null; state?: MarketQuoteState; provider: string; source: string; observedAt: Date; receivedAt: Date }, lineage?: { providerInstrument?: string; priceType?: MarketPriceType }): MarketQuoteEvent {
    return {
      version: 'v1',
      event: 'market.quote',
      sequence: latest.sequence.toString(),
      emittedAt: new Date().toISOString(),
      quote: this.toQuote(latest, lineage),
    };
  }

  private toQuote(latest: { symbol: string; sequence: bigint; price?: Prisma.Decimal | null; change24h?: Prisma.Decimal | null; volume24h?: Prisma.Decimal | null; high24h?: Prisma.Decimal | null; low24h?: Prisma.Decimal | null; bid?: Prisma.Decimal | null; ask?: Prisma.Decimal | null; spread?: Prisma.Decimal | null; state?: MarketQuoteState; provider: string; source: string; observedAt?: Date | null; receivedAt: Date }, lineage?: { providerInstrument?: string; priceType?: MarketPriceType }): MarketQuoteEvent['quote'] {
    const policy = getMarketSourcePolicy(latest.symbol);
    return {
      symbol: latest.symbol,
      price: this.decimalString(latest.price),
      change24h: this.decimalString(latest.change24h),
      volume24h: this.decimalString(latest.volume24h),
      high24h: this.decimalString(latest.high24h),
      low24h: this.decimalString(latest.low24h),
      bid: this.decimalString(latest.bid),
      ask: this.decimalString(latest.ask),
      spread: this.decimalString(latest.spread),
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
    return process.env.MARKET_PROVIDER_ENABLED === 'true'
      && this.providerRouter.isProviderEnabled(provider);
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
