import { NextRequest, NextResponse } from 'next/server';
import { normalizeCandle, type Candle } from '../../../lib/market-data';

export const revalidate = 20;

const intervals = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']);
const symbolPattern = /^[A-Z0-9]{5,20}$/;

const unavailable = (message: string, status = 200) => NextResponse.json(
  { dataState: 'UNAVAILABLE', candles: [], message },
  { status, headers: { 'Cache-Control': 'no-store' } },
);

async function readConfiguredEndpoint(endpoint: string, symbol: string, interval: string, limit: number) {
  const url = new URL(endpoint);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));
  const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Configured market endpoint returned ${response.status}.`);
  const payload = await response.json() as { candles?: unknown; dataState?: unknown; observedAt?: unknown } | unknown[];
  const candles = Array.isArray(payload) ? payload : payload.candles;
  return { rows: Array.isArray(candles) ? candles : [], dataState: Array.isArray(payload) ? undefined : payload.dataState, observedAt: Array.isArray(payload) ? undefined : payload.observedAt };
}

function normalizeConfiguredRows(payload: unknown): Candle[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const candle = normalizeCandle(item);
    if (!candle) return [];
    const normalizedTime = candle.time > 10_000_000_000
      ? Math.floor(candle.time / 1000)
      : Math.floor(candle.time);
    return [{ ...candle, time: normalizedTime }];
  });
}

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get('symbol') ?? '').replaceAll('/', '').toUpperCase();
  const interval = request.nextUrl.searchParams.get('interval') ?? '1m';
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') ?? 240);
  const limit = Math.min(500, Math.max(40, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 240));

  if (!symbolPattern.test(symbol)) return unavailable('Invalid market symbol.', 400);
  if (!intervals.has(interval)) return unavailable('Unsupported market interval.', 400);

  try {
    const configuredEndpoint = process.env.NEXI_MARKET_KLINE_ENDPOINT;
    const backendUrl = (process.env.NEXI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, '');
    const endpoint = configuredEndpoint || (backendUrl ? `${backendUrl}/market/klines` : undefined);
    if (!endpoint || !/^https?:\/\//i.test(endpoint)) {
      throw new Error('Authoritative market candles are not configured.');
    }
    const baseline = await readConfiguredEndpoint(endpoint, symbol, interval, limit);
    const candles = normalizeConfiguredRows(baseline.rows);
    if (candles.length === 0) {
      return NextResponse.json(
        {
          dataState: baseline.dataState === 'ERROR' ? 'ERROR' : 'UNAVAILABLE',
          symbol,
          interval,
          candles: [],
          observedAt: null,
          message: 'No valid authoritative market candles were returned.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      {
        dataState: baseline.dataState === 'LIVE' || baseline.dataState === 'STALE' || baseline.dataState === 'ERROR' ? baseline.dataState : 'UNAVAILABLE',
        symbol,
        interval,
        candles,
        observedAt: typeof baseline.observedAt === 'string' ? baseline.observedAt : null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : 'Market candles unavailable.');
  }
}
