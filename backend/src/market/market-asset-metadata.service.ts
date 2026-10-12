import { Injectable } from '@nestjs/common';
import { CANONICAL_MARKET_CATALOG, CanonicalMarketPair } from './market-catalog';
import { STOCK_ISSUER_PROFILES } from './market-asset-profile-catalog';
import { COINGECKO_IDS } from './coingecko-market.adapter';
import { getProviderMapping } from './market-source-registry';
import {
  AssetMetadata,
  BiquoteProfile,
  CoinGeckoAssetDetails,
  GateStockSymbol,
  MetadataStatus,
  mapCoinGeckoProfile,
  mapFallbackProfile,
  mapForexProfile,
  mapGateStockProfile,
  mapMetalProfile,
  mapUnavailableProfile,
  normalizeMetadataNumber,
  normalizeMetadataText,
  normalizeProviderMarketState,
  normalizeProviderTimestamp,
} from './market-asset-metadata.mapper';

type CacheEntry = { value: AssetMetadata; expiresAt: number };
type GateStockDetails = { data?: { list?: GateStockSymbol[] } };
type BiquoteInstrument = {
  description?: string;
  source?: string;
  timestamp?: string;
  marketState?: string;
  contractSize?: number;
  unit?: string;
  digits?: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_RETRY_MS = 5 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 8_000;
const MAX_CACHE_ENTRIES = CANONICAL_MARKET_CATALOG.length;
const ALLOWED_METADATA_HOSTS = new Set(['api.coingecko.com', 'api.gateio.ws', 'biquote.io']);

@Injectable()
export class MarketAssetMetadataService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<AssetMetadata>>();

  async getProfile(asset: Record<string, unknown>): Promise<AssetMetadata> {
    const symbol = String(asset.symbol ?? '').trim().toUpperCase().replaceAll('/', '');
    const instrument = CANONICAL_MARKET_CATALOG.find((entry) => entry.symbol === symbol);
    if (!instrument) return mapUnavailableProfile(symbol, new Date().toISOString());

    const cached = this.cache.get(symbol);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const pending = this.inFlight.get(symbol);
    if (pending) return pending;

    const request = this.load(instrument, asset)
      .then((value) => this.store(symbol, value))
      .catch(() => this.store(symbol, cached
        ? { ...cached.value, status: 'STALE' }
        : this.fallback(instrument, asset)))
      .finally(() => this.inFlight.delete(symbol));
    this.inFlight.set(symbol, request);
    return request;
  }

  private load(instrument: CanonicalMarketPair, asset: Record<string, unknown>): Promise<AssetMetadata> {
    switch (instrument.category) {
      case 'crypto': return this.cryptoProfile(instrument);
      case 'stock': return this.stockProfile(instrument);
      case 'forex': return this.forexProfile(instrument, asset);
      case 'metal': return this.metalProfile(instrument, asset);
    }
  }

  private async cryptoProfile(instrument: CanonicalMarketPair): Promise<AssetMetadata> {
    const coinId = COINGECKO_IDS[instrument.symbol];
    if (!coinId) return this.fallback(instrument);
    const baseUrl = process.env.COINGECKO_API_BASE_URL?.trim() || 'https://api.coingecko.com';
    const url = new URL(`/api/v3/coins/${encodeURIComponent(coinId)}`, baseUrl);
    const params = {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'false',
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const apiKey = process.env.COINGECKO_API_KEY?.trim();
    const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};
    const coin = await this.requestJson<CoinGeckoAssetDetails>(url, headers);
    return mapCoinGeckoProfile(instrument, coinId, coin, url.toString(), new Date().toISOString());
  }

  private async stockProfile(instrument: CanonicalMarketPair): Promise<AssetMetadata> {
    const ticker = instrument.symbol.replace(/USDT$/, '');
    const issuer = STOCK_ISSUER_PROFILES[ticker];
    if (!issuer) return this.fallback(instrument);
    const baseUrl = process.env.GATE_API_BASE_URL?.trim() || 'https://api.gateio.ws';
    const url = new URL('/api/v4/stock/symbols/detail', baseUrl);
    url.searchParams.set('symbols', ticker);
    url.searchParams.set('exchange', 'us');
    url.searchParams.set('page_size', '1');
    const result = await this.requestJson<GateStockDetails>(url);
    const row = result.data?.list?.find((candidate) => candidate.symbol?.toUpperCase() === ticker);
    return mapGateStockProfile(instrument, issuer, row, new Date().toISOString());
  }

  private async forexProfile(instrument: CanonicalMarketPair, asset: Record<string, unknown>): Promise<AssetMetadata> {
    const provider = await this.biquoteDescription(instrument.symbol);
    const displayName = normalizeMetadataText(asset.displayName) ?? instrument.displayName;
    return mapForexProfile(instrument, displayName, provider, new Date().toISOString());
  }

  private async metalProfile(instrument: CanonicalMarketPair, asset: Record<string, unknown>): Promise<AssetMetadata> {
    const provider = await this.biquoteDescription(instrument.symbol);
    const displayName = normalizeMetadataText(asset.displayName) ?? instrument.displayName;
    return mapMetalProfile(instrument, displayName, provider, new Date().toISOString());
  }

  private async biquoteDescription(symbol: string): Promise<BiquoteProfile | null> {
    const mapping = getProviderMapping(symbol, 'biquote');
    if (!mapping?.metadataSupported) return null;
    const baseUrl = process.env.BIQUOTE_API_BASE_URL?.trim() || 'https://biquote.io';
    const url = new URL(`/api/${encodeURIComponent(mapping.instrument)}`, baseUrl);
    const payload = await this.requestJson<BiquoteInstrument>(url);
    return {
      description: normalizeMetadataText(payload.description),
      source: normalizeMetadataText(payload.source),
      timestamp: normalizeProviderTimestamp(payload.timestamp),
      marketState: normalizeProviderMarketState(payload.marketState),
      contractSize: normalizeMetadataNumber(payload.contractSize),
      unit: normalizeMetadataText(payload.unit),
      digits: normalizeMetadataNumber(payload.digits),
      url: url.toString(),
    };
  }

  private fallback(instrument: CanonicalMarketPair, asset?: Record<string, unknown>): AssetMetadata {
    const ticker = instrument.symbol.replace(/USDT$/, '');
    const issuer = instrument.category === 'stock' ? STOCK_ISSUER_PROFILES[ticker] : undefined;
    const displayName = normalizeMetadataText(asset?.displayName) ?? instrument.displayName;
    return mapFallbackProfile(instrument, displayName, issuer, new Date().toISOString());
  }

  private store(symbol: string, value: AssetMetadata): AssetMetadata {
    const ttl = value.status === 'FRESH' ? CACHE_TTL_MS : CACHE_RETRY_MS;
    const expiresAt = Date.now() + ttl;
    const cachedValue = { ...value, expiresAt: new Date(expiresAt).toISOString() };
    this.cache.delete(symbol);
    this.cache.set(symbol, { value: cachedValue, expiresAt });
    while (this.cache.size > MAX_CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value as string);
    return cachedValue;
  }

  private async requestJson<T>(url: URL, headers: Record<string, string> = {}): Promise<T> {
    if (!this.isTrustedProviderUrl(url)) throw new Error('Metadata provider URL is not allowlisted');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: controller.signal });
      if (!response.ok) throw new Error(`Metadata provider returned ${response.status}`);
      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isTrustedProviderUrl(url: URL): boolean {
    return url.protocol === 'https:'
      && ALLOWED_METADATA_HOSTS.has(url.hostname.toLowerCase())
      && !url.username
      && !url.password
      && (!url.port || url.port === '443');
  }
}
