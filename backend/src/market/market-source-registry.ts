import { CANONICAL_MARKET_CATALOG, CanonicalMarketPair } from './market-catalog';

export type MarketAssetClass = CanonicalMarketPair['category'];
export type MarketPriceType = 'BID' | 'ASK' | 'MID' | 'LAST' | 'CANDLE_CLOSE' | 'REFERENCE';
export type SettlementApprovalStatus = 'UNAPPROVED' | 'APPROVED';

export interface ProviderMapping {
  provider: string;
  instrument: string;
  quoteSupported: boolean;
  klineSupported: boolean;
  websocketSupported: boolean;
  metadataSupported: boolean;
  settlementCandidate: boolean;
}

// Catalog probes are capability evidence, not identity substitution. Keep
// unsupported combinations mapped for registry completeness, but do not poll
// them until a provider catalog/quote probe proves the instrument callable.
const BIQUOTE_QUOTE_COVERAGE = new Set([
  'AAPLUSDT', 'NVDAUSDT', 'MSFTUSDT', 'GOOGUSDT', 'AMZNUSDT', 'METAUSDT', 'TSLAUSDT', 'WMTUSDT',
  'JNJUSDT', 'NFLXUSDT', 'KOUSDT', 'AMDUSDT', 'MCDUSDT', 'WFCUSDT', 'NKEUSDT', 'BAUSDT',
  'GBPUSD', 'EURUSD', 'USDCNH', 'USDHKD', 'USDJPY', 'USDTHB', 'AUDUSD', 'USDCHF', 'USDRUB',
  'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'XALUSD', 'XCUUSD', 'XZNUSD',
]);

const BIQUOTE_KLINE_DISABLED = new Set(['AXPUSDT', 'DISUSDT', 'UBERUSDT', 'SONYUSDT', 'USDRUB']);

const EXCHANGE_QUOTE_COVERAGE: Record<string, ReadonlySet<string>> = {
  okx: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'XAUUSD', 'XAGUSD', 'XCUUSD', 'XPDUSD', 'XPTUSD']),
  bitget: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'BAUSDT', 'GOOGUSDT', 'KOUSDT', 'MCDUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WMTUSDT', 'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'XCUUSD']),
  htx: new Set(['AAPLUSDT', 'AMDUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NVDAUSDT', 'SONYUSDT', 'UBERUSDT', 'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'XCUUSD']),
  bybit: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WMTUSDT', 'XAUUSD', 'XAGUSD']),
  // Gate's public TradFi per-symbol ticker route is proven callable for the
  // NEXI stock symbols. FX/metals catalog membership is not callable quote
  // capability: those names return SYMBOL_NOT_EXISTS on the ticker route, so
  // they stay mapped for identity/fallback purposes but fail closed for polling.
  gate: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'AXPUSDT', 'BAUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'MCDUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WFCUSDT', 'WMTUSDT']),
};

function providerQuoteSupported(entry: CanonicalMarketPair, provider: string): boolean {
  if (provider === 'moex') return entry.symbol === 'USDRUB';
  if (provider === 'biquote') return BIQUOTE_QUOTE_COVERAGE.has(entry.symbol);
  if (provider === 'yahoo') return true;
  const coverage = EXCHANGE_QUOTE_COVERAGE[provider];
  return coverage ? coverage.has(entry.symbol) : true;
}

export interface AssetSourcePolicy {
  canonicalAssetId: string;
  assetClass: MarketAssetClass;
  internalSymbol: string;
  displaySymbol: string;
  precision: number;
  providerMappings: readonly ProviderMapping[];
  displayPolicy: {
    primaryProvider: string;
    fallbackProviders: readonly string[];
    maxStalenessMs: number;
    delayedDataAllowed: boolean;
  };
  settlementPolicy: {
    enabled: boolean;
    approvalStatus: SettlementApprovalStatus;
    provider?: string;
    instrument?: string;
    priceType?: MarketPriceType;
    timestampPolicy?: string;
    maxStalenessMs?: number;
    precision?: number;
    outagePolicy?: 'RETRY' | 'WAIT_THEN_VOID' | 'VOID';
  };
  capabilities: {
    marketBrowse: boolean;
    spot: boolean;
    binary: boolean;
    supportedBinaryDurations: readonly number[];
  };
  provenance: {
    providerVerificationStatus: string;
    licensingStatus: string;
    redistributionStatus: string;
  };
}

const CRYPTO_PROVIDERS = ['binance-spot', 'coingecko', 'coinmarketcap'];
const STOCK_PROVIDERS = ['biquote', 'yahoo', 'okx', 'bitget', 'htx', 'bybit', 'gate', 'tickdb', 'alltick', 'massive', 'finnhub', 'alpha-vantage'];
const FOREX_PROVIDERS = ['moex', 'biquote', 'yahoo', 'bybit', 'gate', 'htx', 'okx', 'bitget', 'tickdb', 'alltick', 'live-rates', 'massive', 'finnhub', 'oanda', 'alpha-vantage', 'fawaz-currency'];
const PRECIOUS_METAL_PROVIDERS = ['biquote', 'yahoo', 'okx', 'htx', 'bitget', 'bybit', 'gate', 'tickdb', 'alltick', 'live-rates', 'oanda', 'metals-api', 'alpha-vantage', 'fawaz-currency'];
const INDUSTRIAL_METAL_PROVIDERS = ['biquote', 'yahoo', 'okx', 'htx', 'bitget', 'bybit', 'gate', 'tickdb', 'alltick', 'metals-api', 'metalprice-api', 'alpha-vantage', 'rzzro-industrial-metals'];

function baseSymbol(entry: CanonicalMarketPair): string {
  if (entry.category === 'crypto' || entry.category === 'stock') return entry.symbol.replace(/USDT$/, '');
  return entry.symbol;
}

function canonicalAssetId(entry: CanonicalMarketPair): string {
  const prefix = entry.category === 'stock' ? 'stock' : entry.category;
  const value = entry.category === 'stock' ? entry.providerSymbol : baseSymbol(entry);
  return `${prefix}:${value.toLowerCase()}`;
}

function displaySymbol(entry: CanonicalMarketPair): string {
  if (entry.category === 'crypto') return `${baseSymbol(entry)}/USDT`;
  if (entry.category === 'stock') return `${entry.providerSymbol}.US/USDT`;
  return entry.providerSymbol;
}

function providerNames(entry: CanonicalMarketPair): readonly string[] {
  if (entry.category === 'crypto') return CRYPTO_PROVIDERS;
  if (entry.category === 'stock') return STOCK_PROVIDERS;
  if (entry.category === 'forex') return FOREX_PROVIDERS;
  return ['XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD'].includes(entry.symbol)
    ? PRECIOUS_METAL_PROVIDERS
    : INDUSTRIAL_METAL_PROVIDERS;
}

function providerInstrument(entry: CanonicalMarketPair, provider: string): string {
  if (entry.category === 'crypto') return entry.symbol;
  const compact = entry.providerSymbol.replaceAll('/', '');
  const exchangeBase = provider === 'bitget' && entry.symbol === 'GOOGUSDT' ? 'GOOGL' : compact;
  if (provider === 'oanda') return `${compact.slice(0, 3)}_${compact.slice(3)}`;
  if (provider === 'fawaz-currency') {
    const compactCode = entry.symbol.replace(/USDT$/, '');
    if (entry.category === 'metal') return compactCode.slice(0, 3);
    return compactCode.slice(0, 3) === 'USD' ? compactCode.slice(3) : compactCode.slice(0, 3);
  }
  if (provider === 'metals-api' || provider === 'metalprice-api') {
    const industrialCodes: Record<string, string> = { XALUSD: 'ALU', XCUUSD: 'XCU', XZNUSD: 'ZNC' };
    return industrialCodes[entry.symbol] ?? compact.replace(/USD$/, '');
  }
  if (provider === 'rzzro-industrial-metals') {
    const symbols: Record<string, string> = { XALUSD: 'aluminum', XCUUSD: 'copper', XZNUSD: 'zinc' };
    return symbols[entry.symbol] ?? entry.symbol;
  }
  if (provider === 'moex') return entry.symbol === 'USDRUB' ? 'USD000UTSTOM' : entry.symbol;
  if (provider === 'biquote') {
    if (entry.category === 'forex' || entry.category === 'metal') return entry.symbol;
    const aliases: Record<string, string> = {
      GOOGUSDT: 'GOOGL',
      DISUSDT: 'DISNEY',
      AXPUSDT: 'AMERICANEXPRESS',
    };
    return aliases[entry.symbol] ?? entry.providerSymbol;
  }
  if (provider === 'yahoo') {
    const yahooSymbols: Record<string, string> = {
      USDCNH: 'CNH=X', USDHKD: 'HKD=X', USDJPY: 'JPY=X', USDTHB: 'THB=X',
      AUDUSD: 'AUDUSD=X', USDCHF: 'CHF=X', USDRUB: 'RUB=X', EURUSD: 'EURUSD=X', GBPUSD: 'GBPUSD=X',
      XAUUSD: 'GC=F', XAGUSD: 'SI=F', XPDUSD: 'PA=F', XPTUSD: 'PL=F', XALUSD: 'ALI=F', XCUUSD: 'HG=F', XZNUSD: 'ZNC=F',
    };
    return yahooSymbols[entry.symbol] ?? entry.providerSymbol;
  }
  if (provider === 'okx') return `${exchangeBase.replace(/USD$/, '')}-USDT-SWAP`;
  if (provider === 'htx') return `${exchangeBase.replace(/USD$/, '')}-USDT`;
  if (provider === 'gate') return entry.category === 'stock' ? entry.symbol.replace(/USDT$/, '') : entry.symbol;
  if (provider === 'bitget' || provider === 'bybit') return `${exchangeBase.replace(/USD$/, '')}USDT`;
  return entry.providerSymbol;
}

function supportsWebsocket(provider: string, entry: CanonicalMarketPair): boolean {
  if (entry.category === 'crypto') return provider === 'binance-spot';
  return ['biquote', 'oanda', 'okx', 'bitget', 'htx', 'bybit'].includes(provider);
}

function providerKlineSupported(entry: CanonicalMarketPair, provider: string): boolean {
  if (provider === 'binance-spot') return entry.category === 'crypto';
  if (provider === 'biquote') return !BIQUOTE_KLINE_DISABLED.has(entry.symbol) && providerQuoteSupported(entry, provider);
  if (provider === 'moex') return entry.symbol === 'USDRUB';
  // Gate's public Stock API supplies bounded OHLC history for NEXI stocks.
  // Its documented intervals do not include 1m; the router can fall through
  // to Yahoo for that interval.
  if (provider === 'gate') return entry.category === 'stock' && providerQuoteSupported(entry, provider);
  // Yahoo's chart endpoint is the non-crypto history fallback. USDRUB stays
  // on the dedicated MOEX path so a secondary reference feed cannot replace
  // the canonical FX source.
  if (provider === 'yahoo') return entry.category !== 'crypto' && entry.symbol !== 'USDRUB';
  return false;
}

function primaryQuoteProvider(entry: CanonicalMarketPair): string {
  if (entry.category === 'crypto') return 'binance-spot';
  // USD/RUB has a dedicated live MOEX quote adapter. Yahoo is history-only
  // for this pair and must never outrank the live quote path.
  if (entry.symbol === 'USDRUB') return 'moex';
  if (entry.category === 'stock' && !BIQUOTE_QUOTE_COVERAGE.has(entry.symbol)) return 'gate';
  if (entry.category === 'forex' && !BIQUOTE_QUOTE_COVERAGE.has(entry.symbol)) return 'yahoo';
  return 'biquote';
}

function buildPolicy(entry: CanonicalMarketPair): AssetSourcePolicy {
  const providers = providerNames(entry);
  const mappings = providers.map((provider): ProviderMapping => ({
    provider,
    instrument: providerInstrument(entry, provider),
    quoteSupported: providerQuoteSupported(entry, provider),
    klineSupported: providerKlineSupported(entry, provider),
    websocketSupported: supportsWebsocket(provider, entry),
    metadataSupported: provider !== 'binance-spot' || entry.category === 'crypto',
    settlementCandidate: false,
  }));

  return {
    canonicalAssetId: canonicalAssetId(entry),
    assetClass: entry.category,
    internalSymbol: entry.symbol,
    displaySymbol: displaySymbol(entry),
    precision: entry.category === 'crypto' ? 8 : entry.category === 'forex' ? 5 : 4,
    providerMappings: mappings,
    displayPolicy: {
      primaryProvider: primaryQuoteProvider(entry),
      fallbackProviders: mappings
        .filter((mapping) => mapping.provider !== primaryQuoteProvider(entry) && mapping.quoteSupported)
        .map((mapping) => mapping.provider),
      maxStalenessMs: 30_000,
      delayedDataAllowed: true,
    },
    // No source has been approved as NEXI settlement authority in this slice.
    settlementPolicy: {
      enabled: false,
      approvalStatus: 'UNAPPROVED',
    },
    capabilities: {
      marketBrowse: true,
      spot: true,
      binary: false,
      supportedBinaryDurations: [],
    },
    provenance: {
      providerVerificationStatus: 'CANDIDATE_ONLY',
      licensingStatus: 'UNVERIFIED',
      redistributionStatus: 'UNVERIFIED',
    },
  };
}

export const MARKET_SOURCE_POLICIES: readonly AssetSourcePolicy[] = CANONICAL_MARKET_CATALOG.map(buildPolicy);

const byInternalSymbol = new Map(MARKET_SOURCE_POLICIES.map((policy) => [policy.internalSymbol, policy]));
const runtimeProviderMappings = new Map<string, ProviderMapping>();

function runtimeMappingKey(symbol: string, provider: string): string {
  return `${symbol.trim().toUpperCase().replaceAll('/', '').replaceAll('.', '')}:${provider.trim().toLowerCase()}`;
}

export function installRuntimeProviderMappings(
  mappings: readonly { symbol: string; provider: string; providerInstrument: string }[],
): void {
  runtimeProviderMappings.clear();
  for (const mapping of mappings) {
    const fallback = getMarketSourcePolicy(mapping.symbol)?.providerMappings
      .find((candidate) => candidate.provider === mapping.provider.trim().toLowerCase());
    if (!fallback) continue;
    runtimeProviderMappings.set(runtimeMappingKey(mapping.symbol, mapping.provider), {
      ...fallback,
      instrument: mapping.providerInstrument,
    });
  }
}

export function getMarketSourcePolicy(symbol: string): AssetSourcePolicy | undefined {
  const normalized = symbol.trim().toUpperCase().replaceAll('/', '').replaceAll('.', '');
  return byInternalSymbol.get(normalized);
}

export function getProviderMapping(symbol: string, provider: string): ProviderMapping | undefined {
  return runtimeProviderMappings.get(runtimeMappingKey(symbol, provider))
    ?? getMarketSourcePolicy(symbol)?.providerMappings.find((mapping) => mapping.provider === provider.trim().toLowerCase());
}

export function resolveProviderInstrument(symbol: string, provider: string): string | undefined {
  return getProviderMapping(symbol, provider)?.instrument;
}

export function isSettlementApproved(symbol: string, provider: string): boolean {
  const policy = getMarketSourcePolicy(symbol)?.settlementPolicy;
  return Boolean(policy?.enabled && policy.approvalStatus === 'APPROVED' && policy.provider === provider);
}

export function isDeterministicTestProvider(provider: string): boolean {
  if (process.env.NODE_ENV !== 'test') return false;
  return /^(?:test|deterministic-test|gate2-deterministic|b2)$/i.test(provider.trim());
}
