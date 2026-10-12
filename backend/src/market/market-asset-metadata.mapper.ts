import { CanonicalMarketPair } from './market-catalog';
import { StockIssuerProfile } from './market-asset-profile-catalog';

export type MetadataStatus = 'FRESH' | 'PARTIAL' | 'STALE';
export type Provenance = {
  provider: string;
  url: string;
  checkedAt?: string;
  verifiedAt?: string;
};
export type AssetMetadata = Record<string, unknown> & {
  symbol: string;
  category: string;
  status: MetadataStatus;
  refreshedAt: string;
  expiresAt: string;
  provenance: Provenance[];
};
export type CoinGeckoAssetDetails = {
  name?: string;
  description?: { en?: string };
  categories?: unknown[];
  links?: { homepage?: unknown[]; blockchain_site?: unknown[] };
  genesis_date?: string | null;
  market_data?: {
    market_cap?: Record<string, unknown>;
    market_cap_rank?: number | null;
    circulating_supply?: number | null;
    max_supply?: number | null;
  };
};
export type GateStockSymbol = {
  symbol?: string;
  exchange?: string;
  exchange_desc?: string;
  quote_currency?: string;
  symbol_desc?: string;
  category?: string;
  asset_type?: string;
};
export type BiquoteProfile = {
  description?: string;
  source?: string;
  timestamp?: string;
  marketState?: string;
  contractSize?: number;
  unit?: string;
  digits?: number;
  url: string;
};

const CURRENCY_NAMES: Readonly<Record<string, string>> = {
  AUD: 'Australian dollar',
  CHF: 'Swiss franc',
  CNH: 'Chinese yuan (offshore)',
  EUR: 'Euro',
  GBP: 'Pound sterling',
  HKD: 'Hong Kong dollar',
  JPY: 'Japanese yen',
  RUB: 'Russian ruble',
  THB: 'Thai baht',
  USD: 'US dollar',
};
const CATALOG_URL = 'https://github.com/Mellonelay/Nexi/blob/main/backend/src/market/market-catalog.ts';
const ISO_CURRENCY_URL = 'https://www.iso.org/iso-4217-currency-codes.html';
const GATE_STOCK_DOCS = 'https://www.gate.com/docs/developers/apiv4/en/stock/';

export function mapCoinGeckoProfile(
  instrument: CanonicalMarketPair,
  coinId: string,
  coin: CoinGeckoAssetDetails,
  apiUrl: string,
  refreshedAt: string,
): AssetMetadata {
  const description = plainText(coin.description?.en, 800);
  const home = safeHttpsUrl(coin.links?.homepage?.[0]);
  const explorer = safeHttpsUrl(coin.links?.blockchain_site?.[0]);
  const marketStats = coinMarketStats(coin.market_data);
  return {
    symbol: instrument.symbol,
    category: instrument.category,
    status: coin.name && description ? 'FRESH' : 'PARTIAL',
    projectName: safeText(coin.name) ?? instrument.displayName,
    assetSymbol: instrument.symbol.replace(/USDT$/, ''),
    description,
    categories: textList(coin.categories),
    officialWebsite: home,
    explorer,
    launchDate: isoDate(coin.genesis_date),
    marketStats,
    sourceProvider: 'CoinGecko',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance: [
      { provider: 'CoinGecko', url: `https://www.coingecko.com/en/coins/${encodeURIComponent(coinId)}`, checkedAt: refreshedAt },
      { provider: 'CoinGecko API', url: apiUrl, checkedAt: refreshedAt },
    ],
  };
}

function coinMarketStats(data: CoinGeckoAssetDetails['market_data']): Record<string, number> | undefined {
  const candidates: Array<[string, unknown]> = [
    ['marketCapUsd', data?.market_cap?.usd],
    ['marketCapRank', data?.market_cap_rank],
    ['circulatingSupply', data?.circulating_supply],
    ['maxSupply', data?.max_supply],
  ];
  const result: Record<string, number> = {};
  for (const [key, raw] of candidates) {
    const value = finiteNumber(raw);
    if (value !== undefined) result[key] = value;
  }
  return Object.keys(result).length ? result : undefined;
}

export function mapGateStockProfile(
  instrument: CanonicalMarketPair,
  issuer: StockIssuerProfile,
  row: GateStockSymbol | undefined,
  refreshedAt: string,
): AssetMetadata {
  const provenance: Provenance[] = [{ provider: 'Issuer', url: issuer.sourceUrl, verifiedAt: issuer.verifiedAt }];
  if (row) provenance.push({ provider: 'Gate.io', url: GATE_STOCK_DOCS, checkedAt: refreshedAt });
  return {
    symbol: instrument.symbol,
    category: instrument.category,
    status: row ? 'FRESH' : 'PARTIAL',
    companyName: issuer.companyName,
    securityDescription: safeText(row?.symbol_desc),
    companyOverview: issuer.companyOverview,
    sector: issuer.sector,
    industry: issuer.industry,
    headquarters: issuer.headquarters,
    officialWebsite: issuer.officialWebsite,
    exchange: safeText(row?.exchange_desc),
    exchangeCode: safeText(row?.exchange),
    quoteCurrency: safeText(row?.quote_currency),
    securityType: safeText(row?.asset_type),
    instrumentCategory: safeText(row?.category),
    sourceProvider: row ? 'Gate.io and issuer' : 'Issuer',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance,
  };
}

export function mapForexProfile(
  instrument: CanonicalMarketPair,
  displayName: string,
  description: BiquoteProfile | null,
  refreshedAt: string,
): AssetMetadata {
  const baseCurrency = instrument.symbol.slice(0, 3);
  const quoteCurrency = instrument.symbol.slice(3, 6);
  const provenance: Provenance[] = [{ provider: 'ISO currency codes', url: ISO_CURRENCY_URL, verifiedAt: '2026-10-11' }];
  if (description) provenance.push({ provider: 'Biquote', url: description.url, checkedAt: refreshedAt });
  const pairDescription = description?.description ?? currencyPairDescription(baseCurrency, quoteCurrency);
  return {
    symbol: instrument.symbol,
    category: instrument.category,
    status: description?.description ? 'FRESH' : 'PARTIAL',
    displayName,
    pair: `${baseCurrency}/${quoteCurrency}`,
    baseCurrency,
    baseCurrencyName: CURRENCY_NAMES[baseCurrency],
    quoteCurrency,
    quoteCurrencyName: CURRENCY_NAMES[quoteCurrency],
    pairDescription,
    marketSessionState: description?.marketState,
    providerDescriptionSource: description?.source,
    providerTimestamp: description?.timestamp,
    pricePrecision: description?.digits,
    contractSize: description?.contractSize,
    sourceProvider: description ? 'Biquote' : 'Canonical NEXI catalog',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance,
  };
}

function currencyPairDescription(base: string, quote: string): string {
  return `${CURRENCY_NAMES[base] ?? base} against ${CURRENCY_NAMES[quote] ?? quote}`;
}

export function mapMetalProfile(
  instrument: CanonicalMarketPair,
  displayName: string,
  description: BiquoteProfile | null,
  refreshedAt: string,
): AssetMetadata {
  const provenance: Provenance[] = description
    ? [{ provider: 'Biquote', url: description.url, checkedAt: refreshedAt }]
    : [{ provider: 'Biquote', url: 'https://biquote.io/', verifiedAt: '2026-10-11' }];
  return {
    symbol: instrument.symbol,
    category: instrument.category,
    status: description?.description ? 'FRESH' : 'PARTIAL',
    displayName,
    metalCode: instrument.symbol.slice(0, 3),
    quoteCurrency: 'USD',
    instrumentDescription: description?.description ?? `${displayName} quoted against the US dollar.`,
    marketSessionState: description?.marketState,
    specification: metalSpecification(description),
    providerDescriptionSource: description?.source,
    providerTimestamp: description?.timestamp,
    sourceProvider: description ? 'Biquote' : 'Canonical NEXI catalog',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance,
  };
}

function metalSpecification(description: BiquoteProfile | null): Record<string, string | number> | undefined {
  if (!description) return undefined;
  const specification: Record<string, string | number> = {};
  const unit = safeText(description.unit);
  const contractSize = finiteNumber(description.contractSize);
  const digits = finiteNumber(description.digits);
  if (unit) specification.unit = unit;
  if (contractSize !== undefined) specification.contractSize = contractSize;
  if (digits !== undefined) specification.pricePrecision = digits;
  return Object.keys(specification).length ? specification : undefined;
}

export function mapFallbackProfile(
  instrument: CanonicalMarketPair,
  displayName: string,
  issuer: StockIssuerProfile | undefined,
  refreshedAt: string,
): AssetMetadata {
  switch (instrument.category) {
    case 'crypto': return cryptoFallback(instrument, displayName, refreshedAt);
    case 'stock': return stockFallback(instrument, displayName, issuer, refreshedAt);
    case 'forex': return forexFallback(instrument, displayName, refreshedAt);
    case 'metal': return metalFallback(instrument, displayName, refreshedAt);
  }
}

function cryptoFallback(instrument: CanonicalMarketPair, displayName: string, refreshedAt: string): AssetMetadata {
  return {
    ...catalogBase(instrument, refreshedAt),
    projectName: displayName,
    assetSymbol: instrument.symbol.replace(/USDT$/, ''),
  };
}

function stockFallback(
  instrument: CanonicalMarketPair,
  displayName: string,
  issuer: StockIssuerProfile | undefined,
  refreshedAt: string,
): AssetMetadata {
  const provenance: Provenance[] = issuer ? [{ provider: 'Issuer', url: issuer.sourceUrl, verifiedAt: issuer.verifiedAt }] : [catalogProvenance(refreshedAt)];
  return {
    ...catalogBase(instrument, refreshedAt),
    displayName,
    ...(issuer ? {
      companyName: issuer.companyName,
      companyOverview: issuer.companyOverview,
      sector: issuer.sector,
      industry: issuer.industry,
      headquarters: issuer.headquarters,
      officialWebsite: issuer.officialWebsite,
    } : {}),
    sourceProvider: issuer ? 'Issuer' : 'Canonical NEXI catalog',
    provenance,
  };
}

function forexFallback(instrument: CanonicalMarketPair, displayName: string, refreshedAt: string): AssetMetadata {
  const baseCurrency = instrument.symbol.slice(0, 3);
  const quoteCurrency = instrument.symbol.slice(3, 6);
  return {
    ...catalogBase(instrument, refreshedAt),
    displayName,
    pair: `${baseCurrency}/${quoteCurrency}`,
    baseCurrency,
    baseCurrencyName: CURRENCY_NAMES[baseCurrency],
    quoteCurrency,
    quoteCurrencyName: CURRENCY_NAMES[quoteCurrency],
    pairDescription: currencyPairDescription(baseCurrency, quoteCurrency),
    sourceProvider: 'NEXI Market Catalog',
    provenance: [catalogProvenance(refreshedAt), { provider: 'ISO currency codes', url: ISO_CURRENCY_URL, verifiedAt: '2026-10-11' }],
  };
}

function metalFallback(instrument: CanonicalMarketPair, displayName: string, refreshedAt: string): AssetMetadata {
  return {
    ...catalogBase(instrument, refreshedAt),
    displayName,
    metalCode: instrument.symbol.slice(0, 3),
    quoteCurrency: 'USD',
    instrumentDescription: `${displayName} quoted against the US dollar.`,
    sourceProvider: 'NEXI Market Catalog',
    provenance: [catalogProvenance(refreshedAt), { provider: 'Biquote', url: 'https://biquote.io/', verifiedAt: '2026-10-11' }],
  };
}

function catalogBase(instrument: CanonicalMarketPair, refreshedAt: string): AssetMetadata {
  return {
    symbol: instrument.symbol,
    category: instrument.category,
    status: 'PARTIAL',
    sourceProvider: 'NEXI Market Catalog',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance: [catalogProvenance(refreshedAt)],
  };
}

function catalogProvenance(refreshedAt: string): Provenance {
  return { provider: 'NEXI Market Catalog', url: CATALOG_URL, verifiedAt: refreshedAt };
}

export function mapUnavailableProfile(symbol: string, refreshedAt: string): AssetMetadata {
  return {
    symbol,
    category: 'unknown',
    status: 'PARTIAL',
    refreshedAt,
    expiresAt: expiry(refreshedAt),
    provenance: [],
  };
}

export function normalizeMetadataText(value: unknown, maxLength = 500): string | undefined {
  return plainText(value, maxLength);
}

export function normalizeMetadataNumber(value: unknown): number | undefined {
  return finiteNumber(value);
}

export function normalizeProviderMarketState(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const state = value.toUpperCase();
  return ['OPEN', 'CLOSED', 'PREMARKET', 'AFTERHOURS', 'UNKNOWN'].includes(state) ? state : undefined;
}

export function normalizeProviderTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

function plainText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 20) : [];
}

function safeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? plainText(value, 500) : undefined;
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

function expiry(refreshedAt: string): string {
  return new Date(Date.parse(refreshedAt) + 24 * 60 * 60 * 1000).toISOString();
}
