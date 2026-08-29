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
const EXCHANGE_QUOTE_COVERAGE: Record<string, ReadonlySet<string>> = {
  okx: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'XAUUSD', 'XAGUSD', 'XCUUSD', 'XPDUSD', 'XPTUSD']),
  bitget: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'BAUSDT', 'GOOGUSDT', 'KOUSDT', 'MCDUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WMTUSDT', 'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'XCUUSD']),
  htx: new Set(['AAPLUSDT', 'AMDUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NVDAUSDT', 'SONYUSDT', 'UBERUSDT', 'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD', 'XCUUSD']),
  bybit: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WMTUSDT', 'XAUUSD', 'XAGUSD']),
  // Gate's public TradFi catalog currently exposes all 20 NEXI stocks, eight
  // of the nine NEXI FX pairs (USDRUB is absent), and four precious metals.
  // Keep the remaining registry rows but do not poll unsupported instruments.
  gate: new Set(['AAPLUSDT', 'AMDUSDT', 'AMZNUSDT', 'AXPUSDT', 'BAUSDT', 'DISUSDT', 'GOOGUSDT', 'JNJUSDT', 'KOUSDT', 'MCDUSDT', 'METAUSDT', 'MSFTUSDT', 'NFLXUSDT', 'NKEUSDT', 'NVDAUSDT', 'SONYUSDT', 'TSLAUSDT', 'UBERUSDT', 'WFCUSDT', 'WMTUSDT', 'EURUSD', 'GBPUSD', 'USDCNH', 'USDHKD', 'USDJPY', 'USDTHB', 'AUDUSD', 'USDCHF', 'XAUUSD', 'XAGUSD', 'XPDUSD', 'XPTUSD']),
};

function providerQuoteSupported(entry: CanonicalMarketPair, provider: string): boolean {
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
const STOCK_PROVIDERS = ['yahoo', 'okx', 'bitget', 'htx', 'bybit', 'gate', 'tickdb', 'alltick', 'massive', 'finnhub', 'alpha-vantage'];
const FOREX_PROVIDERS = ['yahoo', 'bybit', 'gate', 'htx', 'okx', 'bitget', 'tickdb', 'alltick', 'live-rates', 'massive', 'finnhub', 'oanda', 'alpha-vantage', 'fawaz-currency'];
const PRECIOUS_METAL_PROVIDERS = ['yahoo', 'okx', 'htx', 'bitget', 'bybit', 'gate', 'tickdb', 'alltick', 'live-rates', 'oanda', 'metals-api', 'alpha-vantage', 'fawaz-currency'];
const INDUSTRIAL_METAL_PROVIDERS = ['yahoo', 'okx', 'htx', 'bitget', 'bybit', 'gate', 'tickdb', 'alltick', 'metals-api', 'metalprice-api', 'alpha-vantage', 'rzzro-industrial-metals'];

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
  if (provider === 'massive' && entry.category === 'forex') return `C:${compact}`;
  if (provider === 'finnhub' && entry.category === 'forex') return `OANDA:${compact.slice(0, 3)}_${compact.slice(3)}`;
  if (provider === 'oanda') return `${compact.slice(0, 3)}_${compact.slice(3)}`;
  if (provider === 'alpha-vantage' && entry.category === 'forex') return entry.providerSymbol;
  if (provider === 'fawaz-currency') {
    const compactCode = entry.symbol.replace(/USDT$/, '');
    if (entry.category === 'metal') return compactCode.slice(0, 3);
    return compactCode.slice(0, 3) === 'USD' ? compactCode.slice(3) : compactCode.slice(0, 3);
  }
  if (provider === 'tickdb' || provider === 'alltick' || provider === 'live-rates') return compact;
  if (provider === 'metals-api' || provider === 'metalprice-api') {
    const industrialCodes: Record<string, string> = { XALUSD: 'ALU', XCUUSD: 'XCU', XZNUSD: 'ZNC' };
    return industrialCodes[entry.symbol] ?? compact.replace(/USD$/, '');
  }
  if (provider === 'rzzro-industrial-metals') {
    const symbols: Record<string, string> = { XALUSD: 'aluminum', XCUUSD: 'copper', XZNUSD: 'zinc' };
    return symbols[entry.symbol] ?? entry.symbol;
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
  if (provider === 'alpha-vantage' && entry.category === 'metal') {
    const symbols: Record<string, string> = { XAUUSD: 'XAU', XAGUSD: 'XAG', XCUUSD: 'COPPER', XALUSD: 'ALUMINUM' };
    return symbols[entry.symbol] ?? entry.symbol;
  }
  return entry.providerSymbol;
}

function supportsWebsocket(provider: string, entry: CanonicalMarketPair): boolean {
  if (entry.category === 'crypto') return provider === 'binance-spot';
  return ['tickdb', 'alltick', 'live-rates', 'massive', 'oanda', 'okx', 'bitget', 'htx', 'bybit'].includes(provider);
}

function supportsAlphaVantageQuote(entry: CanonicalMarketPair): boolean {
  return entry.category === 'stock' || entry.category === 'forex'
    || ['XAUUSD', 'XAGUSD', 'XCUUSD', 'XALUSD'].includes(entry.symbol);
}

function buildPolicy(entry: CanonicalMarketPair): AssetSourcePolicy {
  const providers = providerNames(entry);
  const mappings = providers.map((provider): ProviderMapping => ({
    provider,
    instrument: providerInstrument(entry, provider),
    quoteSupported: provider === 'alpha-vantage' ? supportsAlphaVantageQuote(entry) : providerQuoteSupported(entry, provider),
    // Alpha Vantage daily/monthly history is not an ingestible 1m ProviderKlineEvent.
    // Keep this false until a timeframe-aware candle contract is added.
    klineSupported: provider === 'alpha-vantage' || provider === 'fawaz-currency' || provider === 'rzzro-industrial-metals' || provider === 'yahoo' || provider === 'coingecko' || provider === 'coinmarketcap'
      ? false
      : entry.category !== 'metal' || provider !== 'metalprice-api',
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
      primaryProvider: entry.category === 'crypto' ? 'binance-spot' : entry.category === 'stock' || entry.category === 'forex' ? 'massive' : entry.symbol === 'XAUUSD' || entry.symbol === 'XAGUSD' || entry.symbol === 'XPDUSD' || entry.symbol === 'XPTUSD' ? 'oanda' : 'metals-api',
      fallbackProviders: providers.slice(1),
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

export function getMarketSourcePolicy(symbol: string): AssetSourcePolicy | undefined {
  const normalized = symbol.trim().toUpperCase().replaceAll('/', '').replaceAll('.', '');
  return byInternalSymbol.get(normalized);
}

export function getProviderMapping(symbol: string, provider: string): ProviderMapping | undefined {
  return getMarketSourcePolicy(symbol)?.providerMappings.find((mapping) => mapping.provider === provider.trim().toLowerCase());
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
