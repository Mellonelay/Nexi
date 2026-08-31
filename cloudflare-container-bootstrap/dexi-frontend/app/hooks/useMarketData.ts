'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { findAsset, type AssetCategory, type AssetDefinition } from '../lib/asset-registry';

export interface MarketPair {
  assetId: string;
  category: AssetCategory;
  symbol: string;
  pair: string;
  displaySymbol: string;
  name: string;
  price: number | null;
  change: number | null;
  icon: string;
  vol?: number | null;
  marketCap?: number | null;
  high?: number | null;
  low?: number | null;
  precision?: number;
  source?: 'fallback' | 'tick' | 'external';
  provider?: string;
  observedAt?: string;
  dataState?: 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'ERROR';
  sparkline?: number[];
}

export interface BinaryTimeframe { name: string; seconds: number; profit: number | null; minimumAmount: number | null; enabled: boolean; }
type MarketBuckets = { marketPairs: MarketPair[]; metal: MarketPair[]; shares: MarketPair[]; forex: MarketPair[] };

const pairFor = (asset: AssetDefinition, values: Partial<MarketPair> = {}): MarketPair => ({
  assetId: asset.id, category: asset.category, symbol: asset.symbol.replace('.US', '') + (asset.category === 'Crypto' ? 'USDT' : ''), pair: asset.pair,
  displaySymbol: asset.displaySymbol, name: asset.name, price: null, change: null, icon: asset.iconKey ?? asset.displaySymbol.slice(0, 3), vol: null, precision: asset.precision,
  source: 'fallback', provider: 'FALLBACK', dataState: 'UNAVAILABLE', ...values,
});

const normaliseSymbol = (symbol: string) => symbol.replaceAll('/', '').replace('.US', '').toUpperCase();
const toDisplaySymbol = (symbol: string) => symbol.endsWith('USDT') && symbol.length > 4 ? symbol.slice(0, -4) : symbol;

const pairsFromPriceRows = (rows: unknown, providerHeader?: unknown): MarketPair[] => {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const ticker = row as Record<string, unknown>;
    const rawSymbol = typeof ticker.symbol === 'string' ? ticker.symbol : '';
    const symbol = normaliseSymbol(rawSymbol);
    const asset = findAsset(symbol) ?? findAsset(typeof ticker.displaySymbol === 'string' ? ticker.displaySymbol : symbol);
    const parsedPrice = ticker.lastPrice === null || ticker.lastPrice === undefined || ticker.lastPrice === '' ? null : Number(ticker.lastPrice);
    const lastPrice = Number.isFinite(parsedPrice) && parsedPrice! > 0 ? parsedPrice : null;
    if (!symbol) return [];
    const provider = typeof ticker.provider === 'string' && ticker.provider.trim()
      ? ticker.provider.trim()
      : String(ticker.source ?? providerHeader ?? '').trim() || 'NEXI_BACKEND';
    const base = asset ? pairFor(asset) : { assetId: `unmapped:${symbol}`, category: 'Crypto' as const, symbol, pair: `${toDisplaySymbol(symbol)}/USDT`, displaySymbol: toDisplaySymbol(symbol), name: typeof ticker.name === 'string' ? ticker.name : symbol, price: null, change: null, icon: toDisplaySymbol(symbol), source: 'fallback' as const, provider: 'FALLBACK' as const, dataState: 'UNAVAILABLE' as const };
    const sparkline = Array.isArray(ticker.sparkline) ? ticker.sparkline.map(Number).filter(Number.isFinite) : [];
    const changeValue = Number(ticker.priceChangePercent);
    const volumeValue = Number(ticker.volume);
    const dataState = typeof ticker.dataState === 'string' ? ticker.dataState as MarketPair['dataState'] : lastPrice === null ? 'UNAVAILABLE' : 'LIVE';
    return [{ ...base, name: typeof ticker.name === 'string' ? ticker.name : base.name, price: lastPrice, change: Number.isFinite(changeValue) ? changeValue : null, vol: Number.isFinite(volumeValue) ? volumeValue : null, high: Number.isFinite(Number(ticker.high)) ? Number(ticker.high) : null, low: Number.isFinite(Number(ticker.low)) ? Number(ticker.low) : null, marketCap: Number.isFinite(Number(ticker.marketCap)) ? Number(ticker.marketCap) : null, icon: typeof ticker.icon === 'string' ? ticker.icon : base.icon, source: provider.toUpperCase() === 'COINGECKO' ? 'external' as const : 'tick' as const, provider, dataState, observedAt: typeof ticker.observedAt === 'string' ? ticker.observedAt : undefined, sparkline }];
  });
};

const timeframesFromConfig = (value: unknown): BinaryTimeframe[] => {
  if (!value || typeof value !== 'object') return [];
  const root = value as Record<string, unknown>;
  const first = Array.isArray(root.data) && root.data[0] && typeof root.data[0] === 'object' ? root.data[0] as Record<string, unknown> : root;
  const rows = Array.isArray(first.times) ? first.times : [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>; const seconds = Number(item.seconds ?? item.duration); const profit = Number(item.profit ?? item.payoutRate); const minimum = Number(item.minimumAmount ?? item.minimum ?? item.minAmount);
    if (!Number.isFinite(seconds) || seconds <= 0) return [];
    return [{ name: typeof item.name === 'string' ? item.name : `${seconds}s`, seconds, profit: Number.isFinite(profit) && profit > 0 ? profit : null, minimumAmount: Number.isFinite(minimum) && minimum > 0 ? minimum : null, enabled: item.enabled !== false && item.isActive !== false && Number.isFinite(profit) && profit > 0 }];
  });
};

export function useMarketData() {
  const [marketPairs, setMarketPairs] = useState<MarketPair[]>([]);
  const [metal, setMetal] = useState<MarketPair[]>([]);
  const [shares, setShares] = useState<MarketPair[]>([]);
  const [forex, setForex] = useState<MarketPair[]>([]);
  const [timeframes, setTimeframes] = useState<BinaryTimeframe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [pricesRes, binaryConfig] = await Promise.allSettled([api.get('/market/prices'), api.get('/binary/config')]);
        if (pricesRes.status !== 'fulfilled') throw pricesRes.reason;
        const prices = pairsFromPriceRows(pricesRes.value.data, pricesRes.value.headers['x-nexi-market-source']);
        if (!prices.length) throw new Error('Market price response contained no valid rows.');
        if (cancelled) return;
        const crypto = prices.filter((item) => item.category === 'Crypto');
        const metals = prices.filter((item) => item.category === 'Metals');
        const stocks = prices.filter((item) => item.category === 'Stocks');
        const forexRows = prices.filter((item) => item.category === 'Forex');
        setMarketPairs(crypto);
        setMetal(metals);
        setShares(stocks);
        setForex(forexRows);
        setTimeframes(binaryConfig.status === 'fulfilled' ? timeframesFromConfig(binaryConfig.value.data) : []);
      } catch (error) {
        if (!cancelled) { setMarketPairs([]); setMetal([]); setShares([]); setForex([]); setTimeframes([]); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  return { marketPairs, metal, shares, forex, timeframes, loading };
}
