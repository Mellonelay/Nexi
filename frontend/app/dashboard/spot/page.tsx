'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import ModalSurface from '../../components/ModalSurface';
import SafeBackButton from '../../components/SafeBackButton';
import { io } from 'socket.io-client';
import api, { apiBaseUrl } from '../../lib/api';
import SymbolSelector from '../../components/SymbolSelector';
import { useMarketData } from '../../hooks/useMarketData';
import { useActivePair } from '../../state/ActivePairProvider';
import { normalizePair } from '../../state/active-instrument';
import { findAsset } from '../../lib/asset-registry';
import { type MarketDataStatus } from '../../lib/market-data';
import { getIntentKey, type PendingIntentKey } from '../../lib/intent-key';
import { readPendingEconomicIntent, persistPendingEconomicIntent, clearPendingEconomicIntent } from '../../lib/pending-economic-intent';
import { hasAuthSession } from '../../lib/auth-session';
import { productStateLabel } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import LocalDateTime from '../../components/LocalDateTime';
import {
  closeMarginPosition,
  cancelPendingMarginPosition,
  getMarginExitIntent,
  getMarginQuote,
  listMarginPositions,
  markMarginPosition,
  openMarginPosition,
  type MarginDirection,
  type MarginLeverage,
  type MarginPositionResponse,
  type MarginQuoteResponse,
} from '../../lib/margin-api';
import {
  normalizeSpotOrderState,
  positiveNumber,
  spotOrderReady,
  SpotOrderState,
  TpSlState,
} from '../../lib/trading-states';

const RealtimeTradingChart = dynamic(() => import('../../components/RealtimeTradingChart'), {
  ssr: false,
  loading: () => <div className="min-h-[180px] animate-pulse rounded-2xl bg-[#0B0711] md:min-h-[300px]" />,
});

type OrderBookRow = { id?: string; price: string; amount: string };
type MarketTradeRow = { id: string; price: string; amount: string; executedAt: string; side: 'BUY' | 'SELL' };
type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
type HistoryTab = 'OPEN' | 'ORDERS' | 'TRADES';
type SpotHistoryRow = Record<string, unknown>;
type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

function SpotRealtimeTradingChart({ symbol, interval, marketStatus }: { symbol: string; interval: ChartInterval; marketStatus?: MarketDataStatus }) {
  return <RealtimeTradingChart symbol={symbol} type="spot" interval={interval} marketStatus={marketStatus} />;
}

type MobileMarketPanel = 'CHART' | 'BOOK' | 'TRADES';
type SpotSurface = 'SPOT' | 'MARGIN';
type WalletReadState = 'UNAUTHENTICATED' | 'LOADING' | 'LIVE' | 'ERROR';
type ScopedBalance = { available: string; locked: string; total: string };
type WalletOverviewRead = { state: WalletReadState; scopes: Record<string, Record<string, ScopedBalance>> };

function readWalletOverview(payload: unknown): WalletOverviewRead {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { assets?: unknown }).assets)) return { state: 'ERROR', scopes: {} };
  const assets = (payload as { assets: unknown[] }).assets;
  const scopes: WalletOverviewRead['scopes'] = {};
  for (const value of assets) {
    if (!value || typeof value !== 'object') continue;
    const asset = value as { asset?: unknown; scopes?: unknown };
    const symbol = String(asset.asset ?? '').trim().toUpperCase();
    if (!symbol || !asset.scopes || typeof asset.scopes !== 'object') continue;
    for (const [scope, rawBalance] of Object.entries(asset.scopes as Record<string, unknown>)) {
      if (!rawBalance || typeof rawBalance !== 'object') continue;
      const balance = rawBalance as { accountExists?: unknown; available?: unknown; locked?: unknown; total?: unknown };
      if (balance.accountExists !== true) continue;
      const available = String(balance.available ?? '');
      const locked = String(balance.locked ?? '');
      const total = String(balance.total ?? '');
      if (![available, locked, total].every((amount) => /^[0-9]+([.][0-9]+)?$/.test(amount))) continue;
      (scopes[scope.toUpperCase()] ??= {})[symbol] = { available, locked, total };
    }
  }
  return { state: 'LIVE', scopes };
}

function walletAmountLabel(state: WalletReadState, balance: ScopedBalance | undefined, asset: string, kind: 'available' | 'locked' = 'available') {
  if (state === 'UNAUTHENTICATED') return 'Verify wallet';
  if (state === 'LOADING') return 'Loading…';
  if (state === 'ERROR') return 'Balance unavailable';
  return balance ? `${balance[kind]} ${asset}` : `Account balance unavailable · ${asset}`;
}


const CHART_INTERVALS: ChartInterval[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
const numberFormatter = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 10 });
const orderBookRowKey = (row: OrderBookRow) => `${row.id ?? ''}:${row.price}:${row.amount}`;

const finiteRows = (value: unknown): OrderBookRow[] => {
  if (!Array.isArray(value)) return [];
  const rows = value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = Array.isArray(row) ? null : row as Record<string, unknown>;
    const rawPrice = Array.isArray(row) ? row[0] : item?.price;
    const rawAmount = Array.isArray(row) ? row[1] : item?.remaining ?? item?.amount;
    const price = Number(rawPrice);
    const amount = Number(rawAmount);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(amount) || amount <= 0) return [];
    return [{
      id: typeof item?.id === 'string' ? item.id : item?.orderId !== undefined ? String(item.orderId) : undefined,
      price: String(rawPrice), amount: String(rawAmount),
    }];
  });
  return rows.filter((row, index, all) => all.findIndex((candidate) => Number(candidate.price) === Number(row.price)) === index);
};

const finiteTrades = (value: unknown): MarketTradeRow[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const rawPrice = item.price;
    const rawAmount = item.amount ?? item.quantity ?? item.qty;
    const price = Number(rawPrice);
    const amount = Number(rawAmount);
    const id = item.id !== undefined && item.id !== null ? String(item.id) : item.tradeId !== undefined && item.tradeId !== null
      ? `binance:${normalizePair(String(item.symbol ?? ''))}:${String(item.tradeId)}` : null;
    const timestamp = typeof item.executedAt === 'string' ? item.executedAt : Number(item.tradeTime);
    const executedAt = typeof timestamp === 'string' ? timestamp : Number.isFinite(timestamp) && timestamp > 0 && Number.isFinite(new Date(timestamp).getTime()) ? new Date(timestamp).toISOString() : null;
    const side = item.side === 'BUY' || item.maker === false ? 'BUY' : item.side === 'SELL' || item.maker === true ? 'SELL' : null;
    return id && executedAt && side && Number.isFinite(Date.parse(executedAt)) && Number.isFinite(price) && price > 0 && Number.isFinite(amount) && amount > 0
      ? [{ id, price: String(rawPrice), amount: String(rawAmount), executedAt, side }]
      : [];
  });
};

const formatMarketDecimal = (value: string) => {
  const parts = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!parts) return '—';
  const digits = parts[1] + (parts[2] ?? '');
  const point = parts[1].length + Number(parts[3] ?? 0);
  if (!Number.isSafeInteger(point) || Math.abs(point) > 100) return '—';
  const wholeValue = point <= 0 ? '0' : digits.slice(0, point).padEnd(point, '0');
  const fractionValue = point < 0 ? '0'.repeat(-point) + digits : digits.slice(point);
  const whole = (wholeValue.replace(/^0+(?=\d)/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = fractionValue.replace(/0+$/, '');
  return fraction ? whole + '.' + fraction : whole;
};

const compareTradesNewestFirst = (left: MarketTradeRow, right: MarketTradeRow) => {
  const byTime = Date.parse(right.executedAt) - Date.parse(left.executedAt);
  if (byTime) return byTime;
  const leftId = /(?:^|:)(\d+)$/.exec(left.id)?.[1];
  const rightId = /(?:^|:)(\d+)$/.exec(right.id)?.[1];
  if (!leftId || !rightId) return right.id.localeCompare(left.id);
  const leftSequence = BigInt(leftId);
  const rightSequence = BigInt(rightId);
  return leftSequence === rightSequence ? 0 : leftSequence > rightSequence ? -1 : 1;
};

function useSpotHistory(userId: string | null, historyTab: HistoryTab, refreshRevision: number) {
  const [rows, setRows] = useState<SpotHistoryRow[]>([]);
  const [status, setStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR' | 'CONNECTION_LOST'>('UNAVAILABLE');

  useEffect(() => {
    let cancelled = false;
    if (!userId || !hasAuthSession()) {
      setRows([]);
      setStatus('UNAVAILABLE');
      return () => { cancelled = true; };
    }
    const endpoint = historyTab === 'OPEN' ? '/spot/orders/open' : historyTab === 'ORDERS' ? '/spot/orders/history' : '/spot/trades/history';
    setStatus('LOADING');
    api.get(endpoint, { timeout: 15_000 })
      .then((response) => {
        if (cancelled || sessionPrincipalId() !== userId) return;
        const nextRows = Array.isArray(response.data) ? response.data.filter((row): row is SpotHistoryRow => Boolean(row && typeof row === 'object')) : [];
        setRows(nextRows);
        setStatus(nextRows.length > 0 ? 'LIVE' : 'UNAVAILABLE');
      })
      .catch(() => {
        if (cancelled || sessionPrincipalId() !== userId) return;
        setRows([]);
        setStatus('ERROR');
      });
    return () => { cancelled = true; };
  }, [historyTab, userId, refreshRevision]);

  return { rows, status };
}

function useSpotMarketFeed({
  backendConfigured,
  displayPair,
  normalizedSymbol,
  referenceFeedSupported,
}: {
  backendConfigured: boolean;
  displayPair: string;
  normalizedSymbol: string;
  referenceFeedSupported: boolean;
}) {
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const [trades, setTrades] = useState<MarketTradeRow[]>([]);
  const [tradeStatus, setTradeStatus] = useState<'LOADING' | 'LIVE' | 'STALE' | 'EMPTY' | 'UNAVAILABLE' | 'ERROR' | 'CONNECTION_LOST'>('UNAVAILABLE');
  const [bookStatus, setBookStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR' | 'CONNECTION_LOST'>('UNAVAILABLE');

  useEffect(() => {
    let cancelled = false;
    let lastBookAt = 0;
    let lastTradeAt = 0;
    let depthRevision = 0;
    let tradeRevision = 0;
    let depthRequestSequence = 0;
    let tradeRequestSequence = 0;
    let lastUpdateId = BigInt(0);
    const seenTrades = new Set<string>();
    setBids([]); setAsks([]); setTrades([]);
    if (!backendConfigured || !referenceFeedSupported) {
      setBookStatus('UNAVAILABLE'); setTradeStatus('UNAVAILABLE');
      return () => { cancelled = true; };
    }
    setBookStatus('LOADING'); setTradeStatus('LOADING');

    const socket = io(`${apiBaseUrl}/market`, {
      transports: ['polling', 'websocket'], tryAllTransports: true, reconnection: true,
      reconnectionAttempts: 8, reconnectionDelay: 500, reconnectionDelayMax: 8_000,
    });
    const validEvent = (event: Record<string, unknown>, kind: 'depth' | 'trade') => {
      const eventTime = Number(event.eventTime);
      return normalizePair(String(event.symbol ?? '')) === normalizedSymbol
        && event.event === `market.reference.${kind}`
        && normalizePair(String(event.providerInstrument ?? '')) === normalizedSymbol
        && event.version === 'v1' && event.kind === kind && event.provider === 'binance-spot' && event.source === 'websocket'
        && Number.isFinite(eventTime) && eventTime <= Date.now() + 5_000 && Date.now() - eventTime < 30_000;
    };
    const refreshTrades = () => {
      const revision = tradeRevision;
      const request = ++tradeRequestSequence;
      void api.get('/market/trades', { params: { symbol: normalizedSymbol, limit: 50 }, timeout: 15_000 })
        .then((response) => {
          if (cancelled || request !== tradeRequestSequence) return;
          const payload = response.data as unknown;
          if (!Array.isArray(payload)) {
            if (revision === tradeRevision) setTradeStatus('UNAVAILABLE');
            return;
          }
          const rows = finiteTrades(payload.filter((row) => row && typeof row === 'object' && (row as Record<string, unknown>).provider === 'binance-spot' && (row as Record<string, unknown>).source === 'rest' && normalizePair(String((row as Record<string, unknown>).pair ?? (row as Record<string, unknown>).symbol ?? '')) === normalizedSymbol));
          if (!rows.length) {
            if (revision === tradeRevision) setTradeStatus(lastTradeAt ? socket.connected ? 'STALE' : 'CONNECTION_LOST' : 'EMPTY');
            return;
          }
          const latestTradeAt = rows.reduce((latest, row) => Math.max(latest, Date.parse(row.executedAt)), 0);
          if (latestTradeAt > Date.now() + 5_000 || Date.now() - latestTradeAt > 300_000) {
            if (revision === tradeRevision) setTradeStatus('STALE');
            return;
          }
          const ordered = rows.sort(compareTradesNewestFirst);
          for (const row of ordered) seenTrades.add(row.id);
          setTrades((current) => [...current, ...ordered]
            .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
            .sort(compareTradesNewestFirst).slice(0, 50));
          if (revision === tradeRevision) {
            lastTradeAt = latestTradeAt;
            const fresh = Date.now() - latestTradeAt <= 30_000;
            setTradeStatus(socket.connected ? fresh ? 'LIVE' : 'STALE' : 'CONNECTION_LOST');
          }
        })
        .catch(() => { if (!cancelled && revision === tradeRevision && request === tradeRequestSequence) setTradeStatus('ERROR'); });
    };

    const refreshBook = () => {
      const revision = depthRevision;
      const request = ++depthRequestSequence;
      void api.get('/market/depth', { params: { symbol: normalizedSymbol, limit: 20 }, timeout: 15_000 })
        .then((response) => {
          if (cancelled || revision !== depthRevision || request !== depthRequestSequence) return;
          const payload = response.data as Record<string, unknown>;
          const observedAt = Date.parse(String(payload.observedAt ?? ''));
          const snapshotUpdateId = String(payload.lastUpdateId ?? '');
          if (normalizePair(String(payload.pair ?? payload.symbol ?? '')) !== normalizedSymbol || payload.provider !== 'binance-spot' || payload.source !== 'rest' || payload.state !== 'LIVE' || !Number.isFinite(observedAt)
            || !/^[0-9]+$/.test(snapshotUpdateId) || Date.now() - observedAt > 30_000 || observedAt > Date.now() + 5_000) {
            setBookStatus('UNAVAILABLE'); return;
          }
          if (BigInt(snapshotUpdateId) < lastUpdateId) { setBookStatus('CONNECTION_LOST'); return; }
          const nextBids = finiteRows(payload.bids).sort((a, b) => Number(b.price) - Number(a.price));
          const nextAsks = finiteRows(payload.asks).sort((a, b) => Number(a.price) - Number(b.price));
          if (!nextBids.length || !nextAsks.length) { setBookStatus('UNAVAILABLE'); return; }
          lastUpdateId = BigInt(snapshotUpdateId);
          setBids(nextBids); setAsks(nextAsks);
          lastBookAt = Date.now();
          setBookStatus(socket.connected ? 'LIVE' : 'CONNECTION_LOST');
        })
        .catch(() => { if (!cancelled && revision === depthRevision && request === depthRequestSequence) setBookStatus('ERROR'); });
    };
    const handleDepth = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const event = raw as Record<string, unknown>;
      const updateIdText = String(event.updateId ?? '');
      if (!validEvent(event, 'depth') || !/^\d+$/.test(updateIdText)) return;
      const updateId = BigInt(updateIdText);
      if (updateId <= lastUpdateId) return;
      const nextBids = finiteRows(event.bids).sort((a, b) => Number(b.price) - Number(a.price));
      const nextAsks = finiteRows(event.asks).sort((a, b) => Number(a.price) - Number(b.price));
      if (!nextBids.length || !nextAsks.length) return;
      lastUpdateId = updateId; depthRevision++; lastBookAt = Date.now();
      setBids(nextBids); setAsks(nextAsks); setBookStatus('LIVE');
    };
    const handleTrade = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const event = raw as Record<string, unknown>;
      if (!validEvent(event, 'trade')) return;
      const [trade] = finiteTrades([event]);
      if (!trade || seenTrades.has(trade.id)) return;
      seenTrades.add(trade.id);
      if (seenTrades.size > 2_000) seenTrades.delete(seenTrades.values().next().value as string);
      tradeRevision++;
      const tradeTime = Date.parse(trade.executedAt);
      lastTradeAt = Math.max(lastTradeAt, tradeTime);
      setTrades((current) => [trade, ...current.filter((item) => item.id !== trade.id)]
        .sort(compareTradesNewestFirst).slice(0, 50));
      setTradeStatus(socket.connected ? Date.now() - lastTradeAt <= 30_000 ? 'LIVE' : 'STALE' : 'CONNECTION_LOST');
    };
    const handleConnect = () => { setBookStatus('LOADING'); setTradeStatus('LOADING'); refreshBook(); refreshTrades(); };
    const handleConnectionLoss = () => { setBookStatus('CONNECTION_LOST'); setTradeStatus('CONNECTION_LOST'); };
    const freshnessTimer = window.setInterval(() => {
      const now = Date.now();
      if (lastBookAt && now - lastBookAt > 30_000) setBookStatus('CONNECTION_LOST');
      if (lastTradeAt && now - lastTradeAt > 30_000) setTradeStatus(socket.connected ? 'STALE' : 'CONNECTION_LOST');
    }, 5_000);

    refreshBook(); refreshTrades();
    socket.on('disconnect', handleConnectionLoss); socket.on('connect_error', handleConnectionLoss);
    socket.on('connect', handleConnect); socket.on('market.reference.depth', handleDepth);
    socket.on('market.reference.trade', handleTrade);
    return () => {
      cancelled = true; window.clearInterval(freshnessTimer);
      socket.off('disconnect', handleConnectionLoss); socket.off('connect_error', handleConnectionLoss);
      socket.off('connect', handleConnect); socket.off('market.reference.depth', handleDepth);
      socket.off('market.reference.trade', handleTrade); socket.disconnect();
    };
  }, [backendConfigured, displayPair, normalizedSymbol, referenceFeedSupported]);

  const feedEnabled = backendConfigured && referenceFeedSupported;
  return { bids: feedEnabled ? bids : [], asks: feedEnabled ? asks : [], trades: feedEnabled ? trades : [],
    tradeStatus: feedEnabled ? tradeStatus : 'UNAVAILABLE', bookStatus: feedEnabled ? bookStatus : 'UNAVAILABLE' };
}


type MarketConnectionStatus = 'LOADING' | 'LIVE' | 'STALE' | 'EMPTY' | 'UNAVAILABLE' | 'ERROR' | 'CONNECTION_LOST';

function MarginWorkspace({
  displayPair, normalizedSymbol, chartInterval, setChartInterval, sessionClosed,
  marginDirection, setMarginDirection, marginLeverageOptions, effectiveMarginLeverage, setMarginLeverage,
  marginCollateral, setMarginCollateral, marginQuote, handleOpenMargin, marginReady, marginPositions,
  userId, marginSubmitting, handleMarkMargin, handleCloseMargin, handleCancelPendingMargin, marginFeedback,
  marginUnknownIntentKey, recheckUnknownMarginOpening, unknownMarginExit, recheckUnknownMarginExit, walletState, marginUsdtBalance,
}: {
  displayPair: string; normalizedSymbol: string; chartInterval: ChartInterval;
  setChartInterval: React.Dispatch<React.SetStateAction<ChartInterval>>; sessionClosed: boolean;
  marginDirection: MarginDirection; setMarginDirection: React.Dispatch<React.SetStateAction<MarginDirection>>;
  marginLeverageOptions: MarginLeverage[]; effectiveMarginLeverage: MarginLeverage | 0;
  setMarginLeverage: React.Dispatch<React.SetStateAction<MarginLeverage>>;
  marginCollateral: string; setMarginCollateral: React.Dispatch<React.SetStateAction<string>>;
  marginQuote: MarginQuoteResponse | null; handleOpenMargin: () => void | Promise<void>; marginReady: boolean;
  marginPositions: MarginPositionResponse[]; userId: string | null; marginSubmitting: boolean;
  handleMarkMargin: (positionId: string) => void | Promise<void>;
  handleCloseMargin: (positionId: string) => void | Promise<void>;
  handleCancelPendingMargin: (positionId: string) => void | Promise<void>; marginFeedback: string | null;
  marginUnknownIntentKey: string | null; recheckUnknownMarginOpening: (key: string) => void | Promise<void>;
  unknownMarginExit: { positionId: string; operation: 'close' | 'cancel-pending'; key: string } | null;
  recheckUnknownMarginExit: () => void | Promise<void>;
  walletState: WalletReadState; marginUsdtBalance: ScopedBalance | undefined;
}) {
  return (
    <section className="nexi-margin-workspace nexi-station-card mx-3 mt-3 min-w-0 rounded-2xl p-3 sm:mx-4 sm:p-5" aria-labelledby="isolated-margin-heading">
        <div className="nexi-margin-heading flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#48C0CC]">Spot isolated margin</p>
            <h2 id="isolated-margin-heading" className="mt-1 text-lg font-semibold">{displayPair} margin workspace</h2>
          </div>
        </div>
        <div className="nexi-margin-chart-frame mt-4 min-w-0 overflow-hidden rounded-xl border border-violet-300/10 bg-[#0B0711]">
          <div className="nexi-trading-intervals flex min-w-0 items-center gap-2 border-b border-white/5 px-3 py-2">
            <div className="nexi-scroll-rail flex min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto" role="tablist" aria-label="Margin chart interval">
              {CHART_INTERVALS.map((value) => (
                <button key={value} type="button" role="tab" aria-selected={chartInterval === value} onClick={() => setChartInterval(value)} className={`nexi-interactive min-h-11 min-w-11 shrink-0 rounded-md px-2 text-[10px] font-semibold ${chartInterval === value ? 'bg-[#2C146C] text-white' : 'text-[#8C8299] hover:text-white'}`}>{value}</button>
              ))}
            </div>
          </div>
          <div className="nexi-trading-plot-shell h-[300px] md:h-[360px] xl:h-[430px]">
            <SpotRealtimeTradingChart symbol={normalizedSymbol} interval={chartInterval} marketStatus={sessionClosed ? 'CLOSED' : undefined} />
          </div>
        </div>
        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-3">
            <div className="grid min-w-0 grid-cols-2 gap-2 rounded-xl bg-[#0B0711] p-1" role="tablist" aria-label="Margin direction">
              {(['LONG', 'SHORT'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={marginDirection === value} onClick={() => setMarginDirection(value)} className={`min-h-11 rounded-lg text-xs font-semibold ${marginDirection === value ? value === 'LONG' ? 'bg-emerald-400/15 text-[#22D3A6]' : 'bg-rose-400/15 text-[#FF5C7C]' : 'text-[#8C8299]'}`}>{value}</button>)}
            </div>
            <div className="grid min-w-0 grid-cols-3 gap-2" role="tablist" aria-label="Margin leverage">
              {marginLeverageOptions.map((value) => <button key={value} type="button" role="tab" aria-selected={effectiveMarginLeverage === value} onClick={() => setMarginLeverage(value)} className={`min-h-11 rounded-lg border text-xs font-semibold ${effectiveMarginLeverage === value ? 'border-violet-300/35 bg-[#2A1742] text-white' : 'border-violet-300/10 text-[#8C8299]'}`}>{value}x</button>)}
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] px-3 py-2 text-xs min-[430px]:grid-cols-2" aria-label="Margin wallet USDT balance">
              <div><p className="text-[#8C8299]">Margin available</p><p className="mt-1 min-w-0 break-all font-mono">{walletAmountLabel(walletState, marginUsdtBalance, 'USDT')}</p></div>
              <div><p className="text-[#8C8299]">Margin locked</p><p className="mt-1 min-w-0 break-all font-mono">{walletAmountLabel(walletState, marginUsdtBalance, 'USDT', 'locked')}</p></div>
            </div>
            <label className="block text-xs text-[#C3BBD0]">Collateral (USDT)
              <input type="number" inputMode="decimal" min="0" step="any" value={marginCollateral} onChange={(event) => setMarginCollateral(event.target.value)} placeholder="Enter positive collateral" className="mt-1 min-h-11 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-right font-mono outline-none focus:border-[#8B5CF6]" />
            </label>
            <dl className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs">
              {marginQuote?.price != null && <div><dt className="text-[#8C8299]">Mark price</dt><dd className="mt-1 font-mono">{marginQuote.price}</dd></div>}
              {marginQuote?.maintenanceRatio != null && <div><dt className="text-[#8C8299]">Maintenance ratio</dt><dd className="mt-1 font-mono">{marginQuote.maintenanceRatio}</dd></div>}
            </dl>
            <button type="button" onClick={handleOpenMargin} disabled={!marginReady} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:from-[#21152F] disabled:to-[#21152F] disabled:text-[#766D82]">Open {marginDirection} {effectiveMarginLeverage}x</button>
          </div>
          <div className="min-w-0 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Positions</h3><span className="text-xs text-[#8C8299]">{marginPositions.length} loaded</span></div>
            {marginPositions.length === 0 ? <p className="mt-5 text-center text-sm text-[#8C8299]">{userId ? 'No margin positions are available.' : 'Verify the wallet to load margin positions.'}</p> : <div className="mt-3 space-y-2">{marginPositions.map((position) => <article key={position.id} className="rounded-lg border border-violet-300/10 p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className={position.direction === 'LONG' ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}>{position.direction} {position.leverage}x</span><span className="rounded-full border border-violet-300/15 px-2 py-1 uppercase text-[#C3BBD0]">{position.status}</span></div><p className="mt-2 break-all font-mono">Collateral {position.collateral} · Entry {position.entryPrice} · Mark {position.markPrice ?? '—'}</p><div className="mt-2 flex flex-wrap gap-2">{position.status === 'OPEN' && <button type="button" disabled={marginSubmitting} onClick={() => void handleMarkMargin(position.id)} className="rounded border border-cyan-300/20 px-2 py-1 text-[#48C0CC] disabled:opacity-50">Mark</button>} {position.status === 'OPEN' && <button type="button" disabled={marginSubmitting} onClick={() => void handleCloseMargin(position.id)} className="min-h-11 rounded border border-rose-300/20 px-3 py-2 text-[#FF9CB0] disabled:opacity-50">Close</button>}
{position.status === 'PENDING' && /^0+(?:\.0+)?$/.test(position.quantity) && <button type="button" disabled={marginSubmitting} onClick={() => void handleCancelPendingMargin(position.id)} className="min-h-11 rounded border border-amber-300/25 px-3 py-2 text-amber-100 disabled:opacity-50">Cancel pending entry</button>}</div></article>)}</div>}
          </div>
        </div>
        {marginFeedback && <p role="status" className="mt-3 text-xs text-[#C3BBD0]">{marginFeedback}</p>}
        {marginUnknownIntentKey && <button type="button" onClick={() => void recheckUnknownMarginOpening(marginUnknownIntentKey)} className="mt-3 min-h-11 w-full rounded-lg border border-amber-300/30 px-3 text-sm font-semibold text-amber-100">Recheck margin submission</button>}
        {unknownMarginExit && <button type="button" onClick={() => void recheckUnknownMarginExit()} className="mt-3 min-h-11 w-full rounded-lg border border-amber-300/30 px-3 text-sm font-semibold text-amber-100">Recheck original Margin {unknownMarginExit.operation === 'close' ? 'close' : 'cancellation'}</button>}
        <p className="mt-3 text-[10px] text-[#8C8299]">Isolated margin uses only the collateral assigned to each position. Leverage increases both potential gains and losses.</p>
      </section>
  );
}

type SpotWorkspaceProps = {
  displayPair: string; normalizedSymbol: string; chartInterval: ChartInterval;
  setChartInterval: React.Dispatch<React.SetStateAction<ChartInterval>>; sessionClosed: boolean;
  mobileMarketPanel: MobileMarketPanel; setMobileMarketPanel: React.Dispatch<React.SetStateAction<MobileMarketPanel>>;
  bids: OrderBookRow[]; asks: OrderBookRow[]; bookStatus: MarketConnectionStatus;
  setPrice: React.Dispatch<React.SetStateAction<string>>; marketTrades: MarketTradeRow[]; tradeStatus: MarketConnectionStatus;
  historyTab: HistoryTab; setHistoryTab: React.Dispatch<React.SetStateAction<HistoryTab>>;
  historyRows: SpotHistoryRow[]; historyStatus: MarketConnectionStatus;
  onCancelOrder: (orderId: string) => void; cancellingOrderId: string | null; cancelFeedback: string | null;
  unknownSpotCancelOrderId: string | null; recheckSpotCancel: () => void | Promise<void>;
  side: 'BUY' | 'SELL'; setSide: React.Dispatch<React.SetStateAction<'BUY' | 'SELL'>>;
  orderType: OrderType; setOrderType: React.Dispatch<React.SetStateAction<OrderType>>;
  price: string; stopPrice: string; setStopPrice: React.Dispatch<React.SetStateAction<string>>;
  amount: string; setAmount: React.Dispatch<React.SetStateAction<string>>; baseSymbol: string; quoteSymbol: string;
  tpSlState: TpSlState; configureTpSl: (enabled: boolean) => void; tp: string;
  setTp: React.Dispatch<React.SetStateAction<string>>; sl: string; setSl: React.Dispatch<React.SetStateAction<string>>;
  total: number | null; orderState: SpotOrderState; feedback: string | null; reviewReady: boolean; ready: boolean;
  unknownSpotIntentKey: string | null; recheckUnknownSpotOrder: (key: string) => void | Promise<void>;
  availableBalance: string; openReview: () => void;
};

function SpotChartArea({displayPair, normalizedSymbol, chartInterval, setChartInterval, sessionClosed, mobileMarketPanel, setMobileMarketPanel}: SpotWorkspaceProps) {
  return (
    <>
          <div className="nexi-trading-heading order-1 hidden min-w-0 flex-wrap items-end justify-between gap-3 md:flex xl:order-none">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A78BFA]">Spot trading</p>
              <h1 id="spot-market-heading" className="mt-1 text-2xl font-semibold">{displayPair}</h1>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" aria-label="Market connection status">
            </div>
          </div>

          <div className={`nexi-trading-chart-card nexi-station-card order-2 min-h-[210px] min-w-0 overflow-hidden rounded-xl sm:rounded-2xl xl:block md:min-h-[360px] xl:order-none xl:min-h-[430px] ${mobileMarketPanel === 'CHART' ? 'block' : 'hidden'}`}>
            <div className="nexi-trading-intervals flex min-w-0 items-center gap-2 border-b border-white/5 px-3 py-2">
              <div className="nexi-scroll-rail flex min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto" role="tablist" aria-label="Chart interval">
                {CHART_INTERVALS.map((value) => (
                  <button key={value} type="button" role="tab" aria-selected={chartInterval === value} onClick={() => setChartInterval(value)} className={`nexi-interactive min-h-11 min-w-11 shrink-0 rounded-md px-2 text-[10px] font-semibold ${chartInterval === value ? 'bg-[#2C146C] text-white' : 'text-[#8C8299] hover:text-white'}`}>{value}</button>
                ))}
              </div>
            </div>
            <div className="nexi-trading-plot-shell h-[300px] md:h-[360px] xl:h-[430px]">
              <SpotRealtimeTradingChart symbol={normalizedSymbol} interval={chartInterval} marketStatus={sessionClosed ? 'CLOSED' : undefined} />
            </div>
          </div>

          <div className="order-3 grid min-w-0 grid-cols-3 border-b border-violet-300/20 xl:hidden" role="tablist" aria-label="Mobile market view">
            {([
              ['CHART', 'Chart'],
              ['BOOK', 'Order book'],
              ['TRADES', 'Trades'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={mobileMarketPanel === value} onClick={() => setMobileMarketPanel(value)} className={`nexi-interactive min-h-11 min-w-0 px-1 text-xs ${mobileMarketPanel === value ? 'border-b-2 border-[#7353DD] text-white' : 'text-[#8C8299]'}`}>{label}</button>
            ))}
          </div>
    </>
  );
}

function SpotOrderBook({mobileMarketPanel, bids, asks, bookStatus, setPrice, baseSymbol, quoteSymbol}: SpotWorkspaceProps) {
  return (
            <section className={`nexi-station-card min-w-0 overflow-hidden rounded-2xl xl:block ${mobileMarketPanel === 'BOOK' ? 'block' : 'hidden'}`} aria-labelledby="order-book-heading">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div><h2 id="order-book-heading" className="font-semibold">Market depth</h2><p className="text-[10px] text-[#8C8299]">Binance Spot reference data · not executable NEXI liquidity</p></div>
                {bookStatus === 'LIVE' ? <span className="text-xs text-[#8C8299]">Live</span> : bookStatus === 'CONNECTION_LOST' ? <span className="text-xs text-amber-200">Updates paused · last received depth</span> : bookStatus === 'LOADING' ? <span className="text-xs text-[#8C8299]">Loading</span> : bookStatus === 'ERROR' ? <span className="text-xs text-[#8C8299]">Request error</span> : bookStatus === 'UNAVAILABLE' ? <span className="text-xs text-amber-200">Unavailable</span> : null}
              </div>
              <div className="grid min-w-0 grid-cols-2 text-xs">
                <div className="min-w-0 border-r border-white/5 p-3">
                  <div className="mb-2 flex justify-between text-[10px] text-[#8C8299]"><span>Bid · {quoteSymbol}</span><span>Quantity {baseSymbol}</span></div>
                  {bids.slice(0, 12).map((row) => <button key={orderBookRowKey(row)} type="button" onClick={() => setPrice(row.price)} className="nexi-interactive flex min-h-9 min-w-0 w-full flex-col justify-center rounded px-1 text-left font-mono tabular-nums hover:bg-emerald-400/5"><span className="text-xs text-[#22D3A6]">{row.price}</span><span className="break-all text-[10px] text-[#C3BBD0]">{row.amount} {baseSymbol}</span></button>)}
                </div>
                <div className="min-w-0 p-3">
                  <div className="mb-2 flex justify-between text-[10px] text-[#8C8299]"><span>Ask · {quoteSymbol}</span><span>Quantity {baseSymbol}</span></div>
                  {asks.slice(0, 12).map((row) => <button key={orderBookRowKey(row)} type="button" onClick={() => setPrice(row.price)} className="nexi-interactive flex min-h-9 min-w-0 w-full flex-col items-end justify-center rounded px-1 text-right font-mono tabular-nums hover:bg-rose-400/5"><span className="text-xs text-[#FF5C7C]">{row.price}</span><span className="break-all text-[10px] text-[#C3BBD0]">{row.amount} {baseSymbol}</span></button>)}
                </div>
              </div>
              {bids.length === 0 && asks.length === 0 && (
                <p className="px-4 pb-6 text-center text-sm text-[#8C8299]">
                  {bookStatus === 'LOADING'
                    ? 'Loading the order book…'
                    : bookStatus === 'ERROR'
                      ? 'The order book could not be loaded.'
                      : 'Reference depth is unavailable or unsupported for this symbol.'}
                </p>
              )}
            </section>
  );
}

function streamStatusText(status: MarketConnectionStatus, liveLabel: string, lostLabel: string) {
  if (status === 'LIVE') return liveLabel;
  if (status === 'STALE') return 'Stale reference data · waiting for a fresh trade';
  if (status === 'CONNECTION_LOST') return lostLabel;
  if (status === 'LOADING') return 'Loading';
  if (status === 'ERROR') return 'Request error';
  return null;
}

function recentTradesEmptyText(status: MarketConnectionStatus) {
  if (status === 'LOADING') return 'Loading recent trades…';
  if (status === 'ERROR') return 'Recent trades could not be loaded. Retry when connected.';
  if (status === 'STALE') return 'Recent reference trades are stale. Waiting for fresh data.';
  if (status === 'EMPTY') return 'No recent reference trades yet.';
  if (status === 'CONNECTION_LOST') return 'Market connection lost. Recent trades will resume after reconnecting.';
  if (status === 'UNAVAILABLE') return 'Reference trades are unavailable or unsupported for this symbol.';
  return 'No recent trades yet.';
}

function SpotRecentTrades({mobileMarketPanel, marketTrades, tradeStatus, baseSymbol, quoteSymbol}: SpotWorkspaceProps) {
  const statusText = streamStatusText(tradeStatus, 'Live reference trades', 'Connection lost · showing last received trades');
  const statusClass = tradeStatus === 'CONNECTION_LOST' || tradeStatus === 'STALE' ? 'text-[10px] text-amber-200' : 'text-[10px] text-[#8C8299]';
  return (
            <section className={`nexi-station-card min-w-0 overflow-hidden rounded-2xl xl:block ${mobileMarketPanel === 'TRADES' ? 'block' : 'hidden'}`} aria-labelledby="recent-trades-heading">
              <div className="flex items-center justify-between gap-2 border-b border-white/5 px-3 py-3 sm:px-4">
                <div className="min-w-0"><h2 id="recent-trades-heading" className="font-semibold">Recent trades</h2><p className="text-[10px] text-[#8C8299]">Binance Spot reference trades</p></div>
                {statusText && <span className={`${statusClass} shrink-0 text-right`}>{statusText}</span>}
              </div>
              {marketTrades.length > 0
                ? <>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-1 border-b border-white/5 px-3 py-2 text-[9px] text-[#8C8299] sm:px-4 sm:text-[10px]"><span>Price ({quoteSymbol})</span><span>Amount ({baseSymbol})</span><span className="text-right">Time</span></div>
                    <div className="max-h-[min(55vh,520px)] divide-y divide-white/5 overflow-y-auto text-[10px] sm:text-xs">{marketTrades.slice(0, 50).map((trade) => <div key={trade.id} aria-label={`${trade.side} Binance reference trade at ${trade.price} ${quoteSymbol}, amount ${trade.amount} ${baseSymbol}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1 px-3 py-2 font-mono tabular-nums sm:px-4"><span className={`min-w-0 break-all ${trade.side === 'BUY' ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}`}>{formatMarketDecimal(trade.price)}</span><span className="min-w-0 break-all text-[#C3BBD0]">{formatMarketDecimal(trade.amount)}</span><span className="min-w-[54px] whitespace-nowrap text-right text-[#8C8299]"><LocalDateTime value={trade.executedAt} timeStyle="medium" /></span></div>)}</div>
                  </>
                : <div className="flex min-h-52 items-center justify-center p-6 text-center text-sm text-[#8C8299]" role="status">{recentTradesEmptyText(tradeStatus)}</div>}
            </section>
  );
}

function SpotReferenceArea(props: SpotWorkspaceProps) {
  return (
    <div className="order-4 grid min-w-0 gap-4 lg:grid-cols-2 xl:order-none">
      <SpotOrderBook {...props} />
      <SpotRecentTrades {...props} />
    </div>
  );
}

function SpotActivityArea({historyTab, setHistoryTab, historyRows, historyStatus, displayPair, onCancelOrder, cancellingOrderId, cancelFeedback, unknownSpotCancelOrderId, recheckSpotCancel}: SpotWorkspaceProps) {
  return (
          <section className="nexi-station-card order-6 min-w-0 rounded-2xl xl:order-none" aria-label="Spot activity">
            <div className="grid min-w-0 grid-cols-3 border-b border-white/5" role="tablist" aria-label="Spot activity">
              {([
                ['OPEN', 'Open', 'Open orders'],
                ['ORDERS', 'Orders', 'Order history'],
                ['TRADES', 'Trades', 'Trade history'],
              ] as const).map(([value, mobileLabel, desktopLabel]) => (
                <button key={value} type="button" role="tab" aria-selected={historyTab === value} onClick={() => setHistoryTab(value)} className={`min-h-12 min-w-0 px-1 text-[11px] sm:px-2 sm:text-sm ${historyTab === value ? 'border-b-2 border-[#8B5CF6] text-white' : 'text-[#8C8299]'}`}>
                  <span className="sm:hidden">{mobileLabel}</span>
                  <span className="hidden sm:inline">{desktopLabel}</span>
                </button>
              ))}
            </div>
            <div className="p-4">
              {cancelFeedback && <p role="status" className="mb-3 text-xs text-amber-200">{cancelFeedback}</p>}
              {unknownSpotCancelOrderId && <button type="button" onClick={() => void recheckSpotCancel()} className="mb-3 min-h-11 w-full rounded-lg border border-amber-300/30 px-3 text-sm font-semibold text-amber-100">Recheck cancellation of order {unknownSpotCancelOrderId}</button>}
              {historyRows.length > 0 ? (
                <div className="space-y-2">{historyRows.slice(0, 30).map((row) => {
                  const id = String(row.id ?? row.orderId ?? [historyTab, row.pair, row.side, row.amount ?? row.quantity, row.price, row.createdAt ?? row.executedAt].map((value) => String(value ?? '')).join(':'));
                  const pair = String(row.pair ?? displayPair);
                  const status = String(row.status ?? row.state ?? 'UNKNOWN').replaceAll('_', ' ');
                  const rowSide = row.side ? String(row.side) : '';
                  const rowAmount = String(row.amount ?? row.quantity ?? row.filled ?? '—');
                  const rowPrice = String(row.price ?? row.entryPrice ?? '—');
                  const when = row.createdAt ?? row.executedAt ?? row.updatedAt;
                  const isOrder = historyTab !== 'TRADES';
                  const canCancel = historyTab === 'OPEN' && typeof row.id === 'string' && ['OPEN', 'PARTIALLY FILLED'].includes(status);
                  const filled = row.filled === undefined ? null : String(row.filled);
                  const remaining = row.remaining === undefined ? null : String(row.remaining);
                  const reserved = row.reservedAmount === undefined ? null : String(row.reservedAmount);
                  const reserveAsset = String(row.reserveAsset ?? '');
                  return <article key={id} className="rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{pair}{rowSide ? ` · ${rowSide}` : ''}</span><span className="rounded-full border border-violet-300/20 px-2 py-1 uppercase text-[#C3BBD0]">{status}</span></div><div className="mt-2 grid grid-cols-2 gap-2 font-mono sm:grid-cols-4"><span>{isOrder ? 'Ordered base qty' : 'Filled base qty'} {rowAmount}</span><span>{isOrder ? String(row.type ?? '').toUpperCase() === 'MARKET' ? 'Protection price' : 'Order limit price' : 'Execution price'} {rowPrice}</span><span className="break-all">ID {id}</span><span><LocalDateTime value={when == null ? null : String(when)} dateStyle="short" timeStyle="short" /></span></div>{isOrder && <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#A99DB8]">{filled !== null && <span>Filled {filled}</span>}{remaining !== null && <span>Remaining {remaining}</span>}{reserved !== null && <span>Initial reserve {reserved} {reserveAsset}</span>}</div>}{canCancel && <button type="button" aria-label={`Cancel Spot order ${id}`} disabled={cancellingOrderId !== null || unknownSpotCancelOrderId !== null} onClick={() => onCancelOrder(id)} className="mt-3 min-h-11 rounded-lg border border-amber-300/30 px-3 text-xs font-semibold text-amber-100 disabled:opacity-50">{cancellingOrderId === id ? 'Cancelling…' : 'Cancel remaining order'}</button>}</article>;
                })}</div>
              ) : (
                <div className="flex min-h-32 items-center justify-center text-center text-sm text-[#8C8299]">{historyStatus === 'LOADING' ? 'Loading activity…' : historyStatus === 'ERROR' ? 'Activity request failed.' : historyTab === 'OPEN' ? 'No open orders.' : historyTab === 'ORDERS' ? 'No order history.' : 'No trade history.'}</div>
              )}
            </div>
          </section>
  );
}

function SpotMarketArea(props: SpotWorkspaceProps) {
  return (
    <section className="contents xl:block xl:space-y-4" aria-labelledby="spot-market-heading">
      <SpotChartArea {...props} />
      <SpotReferenceArea {...props} />
      <SpotActivityArea {...props} />
    </section>
  );
}

function SpotOrderTicket({side, setSide, orderType, setOrderType, price, setPrice, stopPrice, setStopPrice, amount, setAmount, baseSymbol, tpSlState, configureTpSl, tp, setTp, sl, setSl, total, orderState, feedback, reviewReady, ready, unknownSpotIntentKey, recheckUnknownSpotOrder, availableBalance, openReview}: SpotWorkspaceProps) {
  return (
        <aside className="nexi-station-card order-5 h-fit min-w-0 overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 xl:sticky xl:top-20 xl:order-none" aria-labelledby="spot-ticket-heading">
          <div className="hidden items-start justify-between gap-3 sm:flex">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#48C0CC]">Execution ticket</p><h2 id="spot-ticket-heading" className="mt-1 text-xl font-semibold gradient-text">Place a Spot order</h2></div>
            <Wallet className="mt-1 h-5 w-5 shrink-0 text-[#A995FF]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 grid min-w-0 grid-cols-2 rounded-xl bg-[#0B0711] p-1 sm:mt-3" data-testid="spot-buy-sell">
            {(['BUY', 'SELL'] as const).map((value) => <button key={value} type="button" onClick={() => setSide(value)} className={`nexi-interactive min-h-11 min-w-0 rounded-lg px-1 text-xs font-semibold sm:text-sm ${side === value ? value === 'BUY' ? 'bg-emerald-400/15 text-[#22D3A6]' : 'bg-rose-400/15 text-[#FF5C7C]' : 'text-[#8C8299]'}`}>{value === 'BUY' ? 'Buy' : 'Sell'}</button>)}
          </div>
          <div className="mt-2 grid min-w-0 grid-cols-3 gap-1 rounded-xl bg-[#0B0711] p-1" role="tablist" aria-label="Order type" data-testid="spot-order-type">
            {(['MARKET', 'LIMIT', 'STOP'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={orderType === value} onClick={() => setOrderType(value)} className={`nexi-interactive min-h-11 min-w-0 whitespace-normal rounded-lg px-1 text-[10px] leading-tight sm:text-xs ${orderType === value ? 'bg-[#2A1742] text-white' : 'text-[#8C8299]'}`}>{value === 'STOP' ? 'Stop Limit' : value[0] + value.slice(1).toLowerCase()}</button>)}
          </div>

          <div className="mt-2.5 space-y-2 sm:mt-3 sm:space-y-2.5" data-testid="spot-inputs">
            <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-xs text-[#C3BBD0] sm:block"><span>Price (USDT)</span>
              <input type="number" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} disabled={orderType === 'MARKET'} placeholder={orderType === 'MARKET' ? 'Market price' : '—'} className="min-h-9 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-right font-mono outline-none focus:border-[#8B5CF6] sm:mt-1 sm:min-h-11" />
            </label>
            {orderType === 'STOP' && <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-xs text-[#C3BBD0] sm:block"><span>Stop price (USDT)</span>
              <input type="number" inputMode="decimal" value={stopPrice} onChange={(event) => setStopPrice(event.target.value)} placeholder="—" className="min-h-9 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-right font-mono outline-none focus:border-[#8B5CF6] sm:mt-1 sm:min-h-11" />
            </label>}
            <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-xs text-[#C3BBD0] sm:block"><span>Amount ({baseSymbol})</span>
              <input type="number" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="min-h-9 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-right font-mono outline-none focus:border-[#8B5CF6] sm:mt-1 sm:min-h-11" />
            </label>
            <div className="grid min-w-0 grid-cols-4 gap-1.5">
              {[25, 50, 75, 100].map((percentage) => <button key={percentage} type="button" disabled aria-label={`${percentage}% allocation requires an available balance`} className="min-h-8 min-w-0 rounded-lg border border-violet-300/10 px-0 text-[10px] text-[#8C8299] disabled:cursor-not-allowed sm:min-h-9">{percentage}%</button>)}
            </div>
            <label className="flex min-h-8 items-center gap-2 rounded-xl border border-violet-300/10 px-3 text-xs sm:min-h-9">
              <input type="checkbox" checked={tpSlState !== 'NOT_CONFIGURED'} onChange={(event) => configureTpSl(event.target.checked)} className="h-4 w-4 accent-violet-500" />
              Configure TP/SL
            </label>
            {tpSlState !== 'NOT_CONFIGURED' && <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="min-w-0 text-xs text-[#C3BBD0]">Take profit<input type="number" inputMode="decimal" value={tp} onChange={(event) => setTp(event.target.value)} placeholder="—" className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-violet-300/15 bg-[#0B0711] px-2 text-right font-mono" /></label>
              <label className="min-w-0 text-xs text-[#C3BBD0]">Stop loss<input type="number" inputMode="decimal" value={sl} onChange={(event) => setSl(event.target.value)} placeholder="—" className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-violet-300/15 bg-[#0B0711] px-2 text-right font-mono" /></label>
              <p className="text-xs text-amber-200/80 sm:col-span-2">Take-profit and stop-loss are not available for this order yet.</p>
            </div>}
          </div>

          <dl className="mt-1.5 grid min-w-0 grid-cols-1 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs min-[430px]:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0"><dt className="text-[#8C8299]">Total</dt><dd className="mt-0.5 break-words font-mono">{total === null ? '—' : `${total.toFixed(2)} USDT`}</dd></div>
            <div className="min-w-0"><dt className="text-[#8C8299]">Fee</dt><dd className="mt-0.5 break-words font-mono">—</dd></div>
            <div className="min-w-0"><dt className="text-[#8C8299]">Available</dt><dd className="mt-0.5 break-words font-mono">{availableBalance}</dd></div>
            <div className="hidden min-w-0 lg:block"><dt className="text-[#8C8299]">State</dt><dd className="mt-0.5 break-words font-mono">{productStateLabel(orderState)}</dd></div>
          </dl>

          {feedback && <p role="status" className="mt-3 text-sm text-[#C3BBD0]">{feedback}</p>}
          {unknownSpotIntentKey && <button type="button" onClick={() => void recheckUnknownSpotOrder(unknownSpotIntentKey)} className="mt-3 min-h-11 w-full rounded-xl border border-amber-300/30 px-3 text-sm font-semibold text-amber-100">Recheck original Spot order</button>}
          <button type="button" onClick={openReview} disabled={!reviewReady} data-testid="spot-submit-btn" className="nexi-interactive mt-1.5 min-h-11 w-full rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-4 text-sm font-semibold shadow-[0_0_24px_rgba(109,40,217,.28)] disabled:cursor-not-allowed disabled:from-[#21152F] disabled:to-[#21152F] disabled:text-[#766D82] disabled:shadow-none sm:mt-3 sm:min-h-11">
            {ready ? `Review ${side.toLowerCase()} order` : 'Enter valid order values'}
          </button>
        </aside>
  );
}

function SpotWorkspace(props: SpotWorkspaceProps) {
  return (
    <div className="nexi-trading-workspace grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
      <SpotMarketArea {...props} />
      <SpotOrderTicket {...props} />
    </div>
  );
}

function SpotOrderReview({
  displayPair, side, orderType, amount, baseSymbol, price, stopPrice, tpSlState, tp, sl,
  onClose, submitOrder, orderState,
}: {
  displayPair: string; side: 'BUY' | 'SELL'; orderType: OrderType; amount: string; baseSymbol: string;
  price: string; stopPrice: string; tpSlState: TpSlState; tp: string; sl: string;
  onClose: () => void; submitOrder: () => void | Promise<void>; orderState: SpotOrderState;
}) {
  return (
    <ModalSurface open onClose={() => onClose()} title="Review Spot order">
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#48C0CC]">Review order</p><h2 id="spot-confirm-title" className="mt-1 text-xl font-semibold">Confirm Spot order</h2></div></div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">Pair</dt><dd className="min-w-0 break-words text-right">{displayPair}</dd></div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">Side / type</dt><dd className="min-w-0 break-words text-right">{side} · {orderType === 'STOP' ? 'STOP LIMIT' : orderType}</dd></div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">Amount</dt><dd className="min-w-0 break-words text-right font-mono">{amount} {baseSymbol}</dd></div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">Price</dt><dd className="min-w-0 break-words text-right font-mono">{orderType === 'MARKET' ? 'Market' : `${price} USDT`}</dd></div>
            {orderType === 'STOP' && <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">Stop price</dt><dd className="min-w-0 break-words text-right font-mono">{stopPrice} USDT</dd></div>}
            {tpSlState !== 'NOT_CONFIGURED' && <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3"><dt className="text-[#8C8299]">TP / SL</dt><dd className="min-w-0 break-words text-right font-mono">{tp || '—'} / {sl || '—'}</dd></div>}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onClose()} className="min-h-12 rounded-xl border border-violet-300/15">Back</button>
            <button type="button" onClick={submitOrder} disabled={orderState === 'SUBMITTING'} className="min-h-12 rounded-xl bg-[#7C3AED] font-semibold disabled:opacity-50">{orderState === 'SUBMITTING' ? 'Submitting…' : 'Confirm'}</button>
          </div>
        </div>
      </ModalSurface>
  );
}

function resolvePriceStatus(marketLoading: boolean, market: { dataState?: string; sessionState?: string } | undefined, currentPrice: number | null, backendConfigured: boolean, marketRequestError: boolean): MarketDataStatus {
  if (marketLoading) return 'LOADING';
  if (market?.sessionState === 'CLOSED') return 'CLOSED';
  if (market?.dataState === 'LIVE' && currentPrice !== null) return 'LIVE';
  if (market?.dataState === 'STALE') return 'STALE';
  if (market?.dataState === 'ERROR' || marketRequestError) return 'ERROR';
  return backendConfigured ? 'UNAVAILABLE' : 'DISABLED';
}

function useSpotOrderState({
  normalizedSymbol,
  currentPrice,
  userId,
  backendConfigured,
  displayPair,
  onOrderChanged,
}: {
  normalizedSymbol: string;
  currentPrice: number | null;
  userId: string | null;
  backendConfigured: boolean;
  displayPair: string;
  onOrderChanged: () => void;
}) {
  const [mobileMarketPanel, setMobileMarketPanel] = useState<MobileMarketPanel>('CHART');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [tpSlState, setTpSlState] = useState<TpSlState>('NOT_CONFIGURED');
  const [orderState, setOrderState] = useState<SpotOrderState>('DRAFT');
  const [unknownSpotIntentKey, setUnknownSpotIntentKey] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const orderSubmissionLock = useRef(false);
  const pendingSpotIntent = useRef<PendingIntentKey | null>(null);
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current === userId) return;
    previousUserId.current = userId;
    setPrice('');
    setStopPrice('');
    setAmount('');
    setTp('');
    setSl('');
    setTpSlState('NOT_CONFIGURED');
    setOrderState('DRAFT');
    setConfirmationOpen(false);
    const stored = userId ? readPendingEconomicIntent('spot-order', userId) : null;
    pendingSpotIntent.current = stored?.intent ?? null;
    setUnknownSpotIntentKey(stored?.intent.key ?? null);
    setFeedback(stored ? 'A previous Spot order outcome is unresolved. Recheck the original order before submitting another.' : null);
  }, [userId]);

  useEffect(() => {
    if (currentPrice !== null) setPrice((current) => current || String(currentPrice));
  }, [currentPrice]);

  const backendSupportsTpSl = tpSlState === 'NOT_CONFIGURED';
  const tpSlReady = tpSlState === 'NOT_CONFIGURED' || (
    (tp.trim() !== '' || sl.trim() !== '')
    && (tp.trim() === '' || positiveNumber(tp) !== null)
    && (sl.trim() === '' || positiveNumber(sl) !== null)
  );
  // The backend requires an approved live quote even for LIMIT/STOP reserves.
  const ready = !unknownSpotIntentKey && currentPrice !== null && backendSupportsTpSl && spotOrderReady({
    authenticated: Boolean(userId),
    backendConfigured,
    amount,
    orderType,
    price,
    stopPrice,
  });
  const executionPrice = orderType === 'MARKET' ? currentPrice : positiveNumber(price);
  const amountValue = positiveNumber(amount);
  const total = amountValue !== null && executionPrice !== null ? amountValue * executionPrice : null;

  const openReview = () => {
    setFeedback(null);
    if (ready) {
      setConfirmationOpen(true);
      return;
    }
    setFeedback(!backendConfigured
      ? 'Trading is not available right now.'
      : currentPrice === null
        ? 'A fresh market quote is required before any Spot order can be submitted.'
      : !userId
        ? 'Sign in to submit an order.'
        : !backendSupportsTpSl
          ? 'Take-profit and stop-loss are not available for this order yet. Disable them to continue.'
          : !tpSlReady
            ? 'Enter a valid take-profit or stop-loss value.'
            : 'Enter valid order values.');
  };

  const recheckUnknownSpotOrder = async (key: string) => {
    if (!userId || sessionPrincipalId() !== userId || pendingSpotIntent.current?.key !== key) return;
    try {
      const response = await api.get<{ id?: string; idempotencyKey?: string; status?: unknown } | null>('/spot/orders/by-intent', { params: { idempotencyKey: key } });
      if (sessionPrincipalId() !== userId || pendingSpotIntent.current?.key !== key) return;
      if (!response.data || response.data.idempotencyKey !== key || typeof response.data.id !== 'string') {
        setFeedback('Spot order outcome remains unknown. Do not submit another order until account history confirms the result.');
        return;
      }
      clearPendingEconomicIntent('spot-order', userId, key);
      pendingSpotIntent.current = null;
      setUnknownSpotIntentKey(null);
      setOrderState(normalizeSpotOrderState(response.data.status));
      setFeedback('The original Spot order was recovered from account records.');
      onOrderChanged();
    } catch {
      if (sessionPrincipalId() === userId) setFeedback('Spot order readback failed. The original submission remains unresolved.');
    }
  };

  const submitOrder = async () => {
    if (orderSubmissionLock.current || unknownSpotIntentKey || !ready || !userId || sessionPrincipalId() !== userId) return;
    orderSubmissionLock.current = true;
    setOrderState('SUBMITTING');
    setFeedback(null);
    try {
      const intent = { pair: displayPair, side, type: orderType, amount: amount.trim(), price: price.trim(), ...(orderType === 'STOP' ? { stopPrice: stopPrice.trim() } : {}) };
      pendingSpotIntent.current = getIntentKey(pendingSpotIntent.current, JSON.stringify([userId, intent]), 'spot');
      if (!persistPendingEconomicIntent('spot-order', { principal: userId, intent: { key: pendingSpotIntent.current.key, fingerprint: 'redacted' }, context: {} })) {
        const existing = readPendingEconomicIntent('spot-order', userId);
        pendingSpotIntent.current = existing?.intent ?? null;
        setUnknownSpotIntentKey(existing?.intent.key ?? 'unresolved');
        setOrderState('UNKNOWN');
        setFeedback('A previous Spot order may be unresolved or recovery storage is unavailable. No new order was submitted.');
        return;
      }
      const submittedKey = pendingSpotIntent.current.key;
      const response = await api.post('/spot/order', {
        pair: displayPair,
        side,
        type: orderType,
        amount: amount.trim(),
        price: price.trim(),
        ...(orderType === 'STOP' ? { stopPrice: stopPrice.trim() } : {}),
        idempotencyKey: pendingSpotIntent.current.key,
      });
      if (sessionPrincipalId() !== userId) return;
      const confirmed = response.data as { id?: unknown; idempotencyKey?: unknown } | null;
      if (typeof confirmed?.id !== 'string' || confirmed.idempotencyKey !== submittedKey) {
        setOrderState('UNKNOWN');
        setUnknownSpotIntentKey(submittedKey);
        setConfirmationOpen(false);
        setFeedback('Spot order response could not be matched to its original intent. Recheck before another order.');
        void recheckUnknownSpotOrder(submittedKey);
        return;
      }
      clearPendingEconomicIntent('spot-order', userId, submittedKey);
      pendingSpotIntent.current = null;
      setUnknownSpotIntentKey(null);
      onOrderChanged();
      const finalOrderState = normalizeSpotOrderState((response.data as { status?: unknown })?.status);
      setOrderState(finalOrderState);
      setConfirmationOpen(false);
      setAmount('');
      setFeedback(finalOrderState === 'FILLED'
        ? 'Order filled. Review trade history for execution details.'
        : finalOrderState === 'PARTIALLY_FILLED'
          ? 'Order partially filled. Remaining quantity is shown in Open orders.'
          : finalOrderState === 'OPEN'
            ? 'Order accepted and open; execution is not yet confirmed.'
            : finalOrderState === 'CANCELLED'
              ? 'Unfilled order quantity was cancelled. Review trade and order history.'
              : 'Order response received, but the final order state is not confirmed. Refresh history before retrying.');
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      // Conflicts, timeouts and throttling do not prove the financial request was rolled back.
      const rejected = [400, 401, 403, 404, 422].includes(status ?? -1);
      setOrderState(rejected ? 'REJECTED' : 'UNKNOWN');
      if (rejected && pendingSpotIntent.current) {
        clearPendingEconomicIntent('spot-order', userId, pendingSpotIntent.current.key);
        pendingSpotIntent.current = null;
        setUnknownSpotIntentKey(null);
      } else if (!rejected && pendingSpotIntent.current) {
        setUnknownSpotIntentKey(pendingSpotIntent.current.key);
        void recheckUnknownSpotOrder(pendingSpotIntent.current.key);
      }
      if (!rejected) onOrderChanged();
      setConfirmationOpen(false);
      setFeedback(rejected
        ? 'The order was rejected. Review order details before retrying.'
        : 'Order outcome is unknown. Check Open orders and Trade history before submitting again.');
    } finally {
      orderSubmissionLock.current = false;
    }
  };

  const configureTpSl = (enabled: boolean) => {
    setTpSlState(enabled ? 'CONFIGURED' : 'NOT_CONFIGURED');
    if (!enabled) {
      setTp('');
      setSl('');
    }
  };

  return {
    mobileMarketPanel, setMobileMarketPanel, side, setSide, orderType, setOrderType, price, setPrice,
    stopPrice, setStopPrice, amount, setAmount, tp, setTp, sl, setSl, tpSlState, orderState,
    confirmationOpen, setConfirmationOpen, feedback, total, reviewReady: ready, ready, openReview,
    unknownSpotIntentKey, recheckUnknownSpotOrder, submitOrder, configureTpSl,
  };
}

function useMarginTradingState({
  userId,
  displayPair,
  normalizedSymbol,
}: {
  userId: string | null;
  displayPair: string;
  normalizedSymbol: string;
}) {
  const [marginDirection, setMarginDirection] = useState<MarginDirection>('LONG');
  const [marginLeverage, setMarginLeverage] = useState<MarginLeverage>(0);
  const [marginCollateral, setMarginCollateral] = useState('');
  const [marginQuote, setMarginQuote] = useState<MarginQuoteResponse | null>(null);
  const [marginPositions, setMarginPositions] = useState<MarginPositionResponse[]>([]);
  const [marginFeedback, setMarginFeedback] = useState<string | null>(null);
  const [marginUnknownIntentKey, setMarginUnknownIntentKey] = useState<string | null>(null);
  const [marginSubmitting, setMarginSubmitting] = useState(false);
  const marginSubmissionLock = useRef(false);
  const pendingMarginIntent = useRef<PendingIntentKey | null>(null);
  const [unknownMarginExit, setUnknownMarginExit] = useState<{ positionId: string; operation: 'close' | 'cancel-pending'; key: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hasToken = hasAuthSession();
    setMarginQuote(null);
    setMarginPositions([]);
    if (!userId || !hasToken) {
      return () => { cancelled = true; };
    }

    setMarginFeedback(null);
    Promise.allSettled([getMarginQuote(displayPair), listMarginPositions()]).then(([quoteResult, positionsResult]) => {
      if (cancelled || sessionPrincipalId() !== userId) return;
      setMarginQuote(quoteResult.status === 'fulfilled' ? quoteResult.value : null);
      setMarginPositions(positionsResult.status === 'fulfilled' ? positionsResult.value : []);
    });
    return () => { cancelled = true; };
  }, [displayPair, userId]);

  useEffect(() => {
    const stored = userId ? readPendingEconomicIntent('margin-open', userId) : null;
    pendingMarginIntent.current = stored?.intent ?? null;
    setMarginUnknownIntentKey(stored?.intent.key ?? null);
    if (stored) setMarginFeedback('A previous Margin opening outcome is unresolved. Recheck the original position before another opening.');
    const savedExit = userId ? readPendingEconomicIntent('margin-exit', userId) : null;
    const operation = savedExit?.context.operation;
    setUnknownMarginExit(savedExit && (operation === 'close' || operation === 'cancel-pending') && savedExit.context.positionId
      ? { key: savedExit.intent.key, positionId: savedExit.context.positionId, operation }
      : null);
  }, [userId]);

  const marginCollateralValue = positiveNumber(marginCollateral);
  const marginLeverageOptions = useMemo(
    () => (marginQuote?.leverageOptions ?? []).filter((value) => [2, 3, 5].includes(value)),
    [marginQuote],
  );
  const effectiveMarginLeverage = marginLeverageOptions.includes(marginLeverage)
    ? marginLeverage
    : (marginLeverageOptions[0] ?? 0);
  const marginReady = Boolean(
    userId && marginQuote?.state === 'LIVE' && normalizePair(marginQuote.pair) === normalizedSymbol
    && effectiveMarginLeverage !== 0 && marginCollateralValue !== null && !marginSubmitting
    && !marginUnknownIntentKey,
  );

  const refreshMarginPositions = async (requestUserId: string) => {
    try {
      const positions = await listMarginPositions();
      if (sessionPrincipalId() === requestUserId) setMarginPositions(positions);
    } catch {
      if (sessionPrincipalId() === requestUserId) setMarginFeedback('Margin positions could not be refreshed.');
    }
  };

  const recheckUnknownMarginOpening = async (key: string) => {
    if (!userId) return;
    try {
      const positions = await listMarginPositions();
      if (sessionPrincipalId() !== userId || pendingMarginIntent.current?.key !== key) return;
      setMarginPositions(positions);
      if (positions.some((position) => position.openIdempotencyKey === key)) {
        clearPendingEconomicIntent('margin-open', userId, key);
        pendingMarginIntent.current = null;
        setMarginUnknownIntentKey(null);
        setMarginCollateral('');
        setMarginFeedback('The submitted margin position was found in your account records.');
      } else {
        setMarginFeedback('The margin submission is still unconfirmed. Do not open another position; contact Support if it remains unresolved.');
      }
    } catch {
      if (sessionPrincipalId() === userId && pendingMarginIntent.current?.key === key) {
        setMarginFeedback('Position records could not be checked. The submission outcome remains unknown.');
      }
    }
  };

  const handleOpenMargin = async () => {
    if (marginSubmissionLock.current || marginUnknownIntentKey) return;
    if (!marginReady || marginCollateralValue === null || !userId || sessionPrincipalId() !== userId) {
      setMarginFeedback(!userId ? 'Verify the wallet before opening an isolated-margin position.' : 'Enter positive collateral and wait for the latest margin quote.');
      return;
    }
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      const intent = { userId, pair: displayPair, direction: marginDirection, leverage: effectiveMarginLeverage, collateral: marginCollateral.trim() };
      pendingMarginIntent.current = getIntentKey(pendingMarginIntent.current, JSON.stringify(intent), 'margin');
      if (!persistPendingEconomicIntent('margin-open', { principal: userId, intent: { key: pendingMarginIntent.current.key, fingerprint: 'redacted' }, context: {} })) {
        const previous = readPendingEconomicIntent('margin-open', userId);
        pendingMarginIntent.current = previous?.intent ?? null;
        setMarginUnknownIntentKey(previous?.intent.key ?? 'unresolved');
        setMarginFeedback('A previous Margin opening may be unresolved or recovery storage is unavailable. No new opening was submitted.');
        return;
      }
      const submittedMarginKey = pendingMarginIntent.current.key;
      const opening = await openMarginPosition({
        pair: displayPair,
        direction: marginDirection,
        leverage: effectiveMarginLeverage,
        collateral: marginCollateral.trim(),
        idempotencyKey: pendingMarginIntent.current.key,
      });
      if (sessionPrincipalId() !== userId) return;
      if (typeof opening?.id !== 'string' || opening.openIdempotencyKey !== submittedMarginKey) {
        setMarginUnknownIntentKey(submittedMarginKey);
        setMarginFeedback('Margin opening response did not confirm the original intent. Recheck the position before another opening.');
        void recheckUnknownMarginOpening(submittedMarginKey);
        return;
      }
      clearPendingEconomicIntent('margin-open', userId, submittedMarginKey);
      pendingMarginIntent.current = null;
      setMarginUnknownIntentKey(null);
      setMarginCollateral('');
      setMarginFeedback(`${marginDirection} ${effectiveMarginLeverage}x position submitted.`);
      await refreshMarginPositions(userId);
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if ([400, 401, 403, 404, 422].includes(status ?? -1)) {
        if (pendingMarginIntent.current) clearPendingEconomicIntent('margin-open', userId, pendingMarginIntent.current.key);
        pendingMarginIntent.current = null;
        setMarginUnknownIntentKey(null);
        setMarginFeedback('The margin opening was rejected. Review the account and order inputs.');
      } else if (pendingMarginIntent.current) {
        const key = pendingMarginIntent.current.key;
        setMarginUnknownIntentKey(key);
        setMarginFeedback('Margin opening outcome is unknown. Recheck account positions; do not submit another opening.');
        void recheckUnknownMarginOpening(key);
      } else {
        setMarginFeedback('Margin opening could not be prepared. No position was submitted.');
      }
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };

  const recheckUnknownMarginExit = async () => {
    const pending = unknownMarginExit;
    if (!pending || !userId || sessionPrincipalId() !== userId) return;
    try {
      const result = await getMarginExitIntent(pending.positionId, pending.key, pending.operation);
      if (sessionPrincipalId() !== userId) return;
      if (!result.confirmed || result.positionId !== pending.positionId) {
        setMarginFeedback('The original Margin exit remains unconfirmed. Do not submit another exit request.');
        return;
      }
      clearPendingEconomicIntent('margin-exit', userId, pending.key);
      setUnknownMarginExit(null);
      setMarginFeedback(result.state === 'CLOSING'
        ? 'Original close order confirmed. Settlement remains pending.'
        : result.state === 'CLOSED' || result.state === 'LIQUIDATED'
          ? 'Original Margin exit confirmed in account records.'
          : 'Original exit accepted. Refresh positions for current status.');
      await refreshMarginPositions(userId);
    } catch {
      if (sessionPrincipalId() === userId) {
        setMarginFeedback('Margin exit records are unavailable. The original request stays locked.');
      }
    }
  };

  const requestMarginExit = async (positionId: string, operation: 'close' | 'cancel-pending') => {
    if (marginSubmissionLock.current || unknownMarginExit || !userId || sessionPrincipalId() !== userId) return;
    // A single unresolved exit per principal prevents a new close/cancel with a different intent.
    const intent = getIntentKey(null, `${userId}:${positionId}:${operation}`, `margin:${operation}`);
    if (!persistPendingEconomicIntent('margin-exit', {
      principal: userId, intent: { key: intent.key, fingerprint: 'redacted' },
      context: { positionId, operation },
    })) {
      const previous = readPendingEconomicIntent('margin-exit', userId);
      const previousOperation = previous?.context.operation;
      if (previous && (previousOperation === 'close' || previousOperation === 'cancel-pending') && previous.context.positionId) {
        setUnknownMarginExit({ key: previous.intent.key, positionId: previous.context.positionId, operation: previousOperation });
      }
      setMarginFeedback('An earlier Margin exit may be unresolved or recovery storage is unavailable. No new exit was submitted.');
      return;
    }
    setUnknownMarginExit({ positionId, operation, key: intent.key });
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      const result = operation === 'close'
        ? await closeMarginPosition(positionId, intent.key)
        : await cancelPendingMarginPosition(positionId, intent.key);
      if (sessionPrincipalId() !== userId) return;
      if (result.positionId !== positionId ||
          !(['CLOSING', 'CLOSED', 'LIQUIDATED'].includes(result.state)) ||
          (operation === 'cancel-pending' && result.state !== 'CLOSED')) {
        setMarginFeedback('Margin exit response was not confirmed. Recheck the original request before proceeding.');
        return;
      }
      clearPendingEconomicIntent('margin-exit', userId, intent.key);
      setUnknownMarginExit(null);
      setMarginFeedback(result.state === 'CLOSING'
        ? 'Close order is recorded. The position remains CLOSING until settlement.'
        : 'Original Margin exit confirmed.');
      await refreshMarginPositions(userId);
    } catch {
      if (sessionPrincipalId() === userId) {
        setMarginFeedback('Margin exit outcome is unknown. Recheck the original intent; do not submit a new request.');
      }
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };

  const handleCloseMargin = (positionId: string) => requestMarginExit(positionId, 'close');
  const handleCancelPendingMargin = (positionId: string) => requestMarginExit(positionId, 'cancel-pending');

  const handleMarkMargin = async (positionId: string) => {
    if (marginSubmissionLock.current || !userId || sessionPrincipalId() !== userId) return;
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      await markMarginPosition(positionId);
      if (sessionPrincipalId() !== userId) return;
      setMarginFeedback('Margin position refreshed with the latest quote.');
      await refreshMarginPositions(userId);
    } catch {
      if (sessionPrincipalId() !== userId) return;
      setMarginFeedback('The margin quote refresh failed.');
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };

  return {
    marginDirection, setMarginDirection, marginLeverageOptions, effectiveMarginLeverage, setMarginLeverage,
    marginCollateral, setMarginCollateral, marginQuote, marginReady, marginPositions, marginSubmitting,
    handleOpenMargin, handleMarkMargin, handleCloseMargin, handleCancelPendingMargin, marginFeedback,
    marginUnknownIntentKey, recheckUnknownMarginOpening, unknownMarginExit, recheckUnknownMarginExit,
  };
}

function SpotHeader({
  displayPair,
  onSelectSymbol,
  currentPrice,
  marketChange,
  priceStatus,
}: {
  displayPair: string;
  onSelectSymbol: (symbol: string) => void;
  currentPrice: number | null;
  marketChange: number | null;
  priceStatus: MarketDataStatus;
}) {
  const changeClass = marketChange !== null && marketChange >= 0 ? 'text-[#22D3A6]' : 'text-[#FF5C7C]';
  return (
    <header className="nexi-station-header sticky top-0 z-20 flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4">
      <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
      <div className="min-w-0 flex-1">
        <SymbolSelector currentSymbol={displayPair} onSelect={onSelectSymbol} />
      </div>
      {currentPrice !== null && (
        <div className="shrink-0 text-right" aria-label="Current market price">
          <p className="font-mono text-sm text-[#C3BBD0]">{numberFormatter.format(currentPrice)}</p>
          {marketChange !== null && (
            <p className={`mt-0.5 font-mono text-[10px] ${changeClass}`}>
              {marketChange > 0 ? '+' : ''}{marketChange.toFixed(2)}% 24h
            </p>
          )}
        </div>
      )}
      {priceStatus !== 'LIVE' && priceStatus !== 'LOADING' && (
        <div className="max-w-24 shrink-0 text-right" role="status" aria-label="Market data status">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${priceStatus === 'ERROR' ? 'text-[#FF9CB0]' : 'text-amber-200'}`}>
            {priceStatus === 'CLOSED' ? 'Market closed' : priceStatus === 'STALE' ? 'Price stale' : priceStatus === 'ERROR' ? 'Market error' : 'Price unavailable'}
          </p>
        </div>
      )}
    </header>
  );
}

function SpotProductTabs({
  activeSurface,
  setActiveSurface,
}: {
  activeSurface: SpotSurface;
  setActiveSurface: React.Dispatch<React.SetStateAction<SpotSurface>>;
}) {
  return (
    <div className="nexi-trading-products mx-3 mt-3 grid grid-cols-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-1 sm:mx-4" role="tablist" aria-label="Spot product">
      {(['SPOT', 'MARGIN'] as const).map((value) => (
        <button key={value} type="button" role="tab" aria-selected={activeSurface === value} onClick={() => setActiveSurface(value)} className={`nexi-interactive min-h-11 rounded-lg text-xs font-semibold sm:min-h-11 sm:text-sm ${activeSurface === value ? 'bg-[#2A1742] text-white shadow-[0_0_18px_rgba(109,65,255,.16)]' : 'text-[#8C8299]'}`}>
          {value === 'SPOT' ? 'Spot' : 'Margin'}
        </button>
      ))}
    </div>
  );
}

function SpotPageBody({
  normalizedSymbol,
  baseSymbol,
  displayPair,
  backendConfigured,
  onSelectSymbol,
}: {
  normalizedSymbol: string;
  baseSymbol: string;
  displayPair: string;
  backendConfigured: boolean;
  onSelectSymbol: (symbol: string) => void;
}) {

  const { marketPairs, metal, shares, forex, loading: marketLoading, error: marketRequestError } = useMarketData();
  const market = [...marketPairs, metal, shares, forex].flat().find((row) => normalizePair(row.symbol) === normalizedSymbol);
  const currentPrice = market?.dataState === 'LIVE' ? market.price : null;
  const pairParts = displayPair.split('/');
  const quoteSymbol = (pairParts.length > 1 ? pairParts.at(-1) : normalizedSymbol.slice(baseSymbol.length))?.trim().toUpperCase() || '—';
  const marketChange = market?.dataState === 'LIVE' ? market.change : null;

  const [userId, setUserId] = useState<string | null>(null);
  const [walletOverview, setWalletOverview] = useState<WalletOverviewRead>({ state: 'UNAUTHENTICATED', scopes: {} });
  const { bids, asks, trades: marketTrades, tradeStatus, bookStatus } = useSpotMarketFeed({
    backendConfigured,
    displayPair,
    normalizedSymbol,
    referenceFeedSupported: market?.category === 'Crypto',
  });
  const [chartInterval, setChartInterval] = useState<ChartInterval>('1m');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('OPEN');
  const [historyRevision, setHistoryRevision] = useState(0);
  const { rows: historyRows, status: historyStatus } = useSpotHistory(userId, historyTab, historyRevision);
  const [activeSurface, setActiveSurface] = useState<SpotSurface>('SPOT');
  const {
    mobileMarketPanel, setMobileMarketPanel, side, setSide, orderType, setOrderType, price, setPrice,
    stopPrice, setStopPrice, amount, setAmount, tp, setTp, sl, setSl, tpSlState, orderState,
    confirmationOpen, setConfirmationOpen, feedback, total, reviewReady, ready, openReview,
    unknownSpotIntentKey, recheckUnknownSpotOrder, submitOrder, configureTpSl,
  } = useSpotOrderState({ normalizedSymbol, currentPrice, userId, backendConfigured, displayPair, onOrderChanged: () => setHistoryRevision((value) => value + 1) });
  const {
    marginDirection, setMarginDirection, marginLeverageOptions, effectiveMarginLeverage, setMarginLeverage,
    marginCollateral, setMarginCollateral, marginQuote, marginReady, marginPositions, marginSubmitting,
    handleOpenMargin, handleMarkMargin, handleCloseMargin, handleCancelPendingMargin, marginFeedback,
    marginUnknownIntentKey, recheckUnknownMarginOpening, unknownMarginExit, recheckUnknownMarginExit,
  } = useMarginTradingState({ userId, displayPair, normalizedSymbol });

  useEffect(() => {
    const sync = () => setUserId(sessionPrincipalId());
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setWalletOverview({ state: 'UNAUTHENTICATED', scopes: {} });
      return () => { cancelled = true; };
    }
    setWalletOverview({ state: 'LOADING', scopes: {} });
    api.get('/wallet/overview').then((response) => {
      if (!cancelled && sessionPrincipalId() === userId) setWalletOverview(readWalletOverview(response.data));
    }).catch(() => {
      if (!cancelled && sessionPrincipalId() === userId) setWalletOverview({ state: 'ERROR', scopes: {} });
    });
    return () => { cancelled = true; };
  }, [userId]);


  const priceStatus = resolvePriceStatus(marketLoading, market, currentPrice, backendConfigured, marketRequestError);
  const spotBalances = walletOverview.scopes.SPOT ?? {};
  const marginUsdtBalance = walletOverview.scopes.MARGIN?.USDT;
  const spotSpendAsset = side === 'BUY' ? 'USDT' : baseSymbol.toUpperCase();
  const spotAvailableBalance = walletAmountLabel(walletOverview.state, spotBalances[spotSpendAsset], spotSpendAsset);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);
  const [unknownSpotCancelOrderId, setUnknownSpotCancelOrderId] = useState<string | null>(null);
  const cancelInFlight = useRef(false);

  useEffect(() => {
    const saved = userId ? readPendingEconomicIntent('spot-cancel', userId) : null;
    setUnknownSpotCancelOrderId(saved?.context.orderId ?? null);
  }, [userId]);

  const recheckSpotCancel = async () => {
    if (!unknownSpotCancelOrderId || !userId || sessionPrincipalId() !== userId) return;
    const orderId = unknownSpotCancelOrderId;
    try {
      const response = await api.get<{ id?: string; status?: string } | null>(
        `/spot/orders/${encodeURIComponent(orderId)}`,
      );
      if (sessionPrincipalId() !== userId || unknownSpotCancelOrderId !== orderId) return;
      const order = response.data;
      if (order?.id !== orderId || !['CANCELED', 'FILLED', 'REJECTED'].includes(String(order.status))) {
        setCancelFeedback('Original cancellation remains unconfirmed. Review the order without submitting another cancellation.');
        return;
      }
      clearPendingEconomicIntent('spot-cancel', userId, orderId);
      setUnknownSpotCancelOrderId(null);
      setCancelFeedback(order.status === 'CANCELED'
        ? 'Original cancellation confirmed by the persisted order.'
        : 'Order reached a terminal state before cancellation could be confirmed.');
      setHistoryRevision((value) => value + 1);
    } catch {
      if (sessionPrincipalId() === userId) setCancelFeedback('Order readback unavailable. Original cancellation remains unresolved.');
    }
  };

  const handleCancelSpotOrder = async (orderId: string) => {
    if (!userId || sessionPrincipalId() !== userId || cancelInFlight.current || unknownSpotCancelOrderId) return;
    if (!window.confirm('Cancel the remaining unfilled quantity for this Spot order?')) return;
    if (!persistPendingEconomicIntent('spot-cancel', {
      principal: userId, intent: { key: orderId, fingerprint: 'order' }, context: { orderId },
    })) {
      setUnknownSpotCancelOrderId(readPendingEconomicIntent('spot-cancel', userId)?.context.orderId ?? null);
      setCancelFeedback('An unresolved cancellation exists or recovery storage is unavailable. No new cancellation was submitted.');
      return;
    }
    cancelInFlight.current = true;
    setUnknownSpotCancelOrderId(orderId);
    setCancellingOrderId(orderId);
    setCancelFeedback(null);
    try {
      const response = await api.post<{ id?: string; status?: string }>('/spot/cancel', { orderId }, { timeout: 15_000 });
      if (sessionPrincipalId() !== userId) return;
      if (response.data?.id !== orderId || response.data.status !== 'CANCELED') {
        setCancelFeedback('Cancellation response is not definitive. Recheck the original order before further action.');
        return;
      }
      clearPendingEconomicIntent('spot-cancel', userId, orderId);
      setUnknownSpotCancelOrderId(null);
      setCancelFeedback('Order cancellation confirmed. Refreshed order history shows the final state.');
    } catch {
      if (sessionPrincipalId() === userId) {
        setCancelFeedback('Cancellation outcome is unknown. Recheck the persisted order before submitting another request.');
      }
    } finally {
      cancelInFlight.current = false;
      setCancellingOrderId(null);
      if (sessionPrincipalId() === userId) setHistoryRevision((value) => value + 1);
    }
  };

  return (
    <main className="nexi-trading-page nexi-page-shell min-h-full w-full min-w-0 overflow-x-clip pb-8 text-[#F8F6FF]">
      <SpotHeader
        displayPair={displayPair}
        onSelectSymbol={onSelectSymbol}
        currentPrice={currentPrice}
        marketChange={marketChange}
        priceStatus={priceStatus}
      />
      <SpotProductTabs activeSurface={activeSurface} setActiveSurface={setActiveSurface} />

      {activeSurface === 'MARGIN' && <MarginWorkspace
        displayPair={displayPair} normalizedSymbol={normalizedSymbol} chartInterval={chartInterval} setChartInterval={setChartInterval}
        sessionClosed={market?.sessionState === 'CLOSED'} marginDirection={marginDirection} setMarginDirection={setMarginDirection}
        marginLeverageOptions={marginLeverageOptions} effectiveMarginLeverage={effectiveMarginLeverage} setMarginLeverage={setMarginLeverage}
        marginCollateral={marginCollateral} setMarginCollateral={setMarginCollateral} marginQuote={marginQuote}
        handleOpenMargin={handleOpenMargin} marginReady={marginReady} marginPositions={marginPositions} userId={userId}
        marginSubmitting={marginSubmitting} handleMarkMargin={handleMarkMargin} handleCloseMargin={handleCloseMargin} handleCancelPendingMargin={handleCancelPendingMargin}
        marginFeedback={marginFeedback} marginUnknownIntentKey={marginUnknownIntentKey}
        recheckUnknownMarginOpening={recheckUnknownMarginOpening} unknownMarginExit={unknownMarginExit} recheckUnknownMarginExit={recheckUnknownMarginExit} walletState={walletOverview.state} marginUsdtBalance={marginUsdtBalance}
      />}

      {activeSurface === 'SPOT' && <SpotWorkspace
        availableBalance={spotAvailableBalance}
        displayPair={displayPair} normalizedSymbol={normalizedSymbol} chartInterval={chartInterval} setChartInterval={setChartInterval}
        sessionClosed={market?.sessionState === 'CLOSED'} mobileMarketPanel={mobileMarketPanel} setMobileMarketPanel={setMobileMarketPanel}
        bids={bids} asks={asks} bookStatus={bookStatus} setPrice={setPrice} marketTrades={marketTrades} tradeStatus={tradeStatus}
        historyTab={historyTab} setHistoryTab={setHistoryTab} historyRows={historyRows} historyStatus={historyStatus}
        onCancelOrder={(orderId) => { void handleCancelSpotOrder(orderId); }} cancellingOrderId={cancellingOrderId} cancelFeedback={cancelFeedback}
        unknownSpotCancelOrderId={unknownSpotCancelOrderId} recheckSpotCancel={recheckSpotCancel}
        side={side} setSide={setSide} orderType={orderType} setOrderType={setOrderType} price={price} stopPrice={stopPrice}
        setStopPrice={setStopPrice} amount={amount} setAmount={setAmount} baseSymbol={baseSymbol} quoteSymbol={quoteSymbol} tpSlState={tpSlState}
        configureTpSl={configureTpSl} tp={tp} setTp={setTp} sl={sl} setSl={setSl} total={total} orderState={orderState}
        feedback={feedback} reviewReady={reviewReady} ready={ready} openReview={openReview}
      />}

      {confirmationOpen && <SpotOrderReview
        displayPair={displayPair} side={side} orderType={orderType} amount={amount} baseSymbol={baseSymbol} price={price}
        stopPrice={stopPrice} tpSlState={tpSlState} tp={tp} sl={sl} onClose={() => setConfirmationOpen(false)}
        submitOrder={submitOrder} orderState={orderState}
      />}
    </main>
  );
}


export default function SpotPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activePair, setActivePair } = useActivePair();
  const querySymbol = searchParams.get('symbol');
  const symbol = querySymbol || activePair;
  const normalizedSymbol = normalizePair(symbol);
  const selectedAsset = findAsset(symbol);
  const displayPair = selectedAsset?.pair ?? (normalizedSymbol.endsWith('USDT') ? `${normalizedSymbol.slice(0, -4)}/USDT` : symbol);
  const pairParts = displayPair.split('/');
  const baseSymbol = (pairParts.length > 1 ? pairParts[0] : selectedAsset?.baseAsset ?? (normalizedSymbol.endsWith('USDT') ? normalizedSymbol.slice(0, -4) : normalizedSymbol)).trim().toUpperCase();
  const backendConfigured = Boolean(apiBaseUrl);

  useEffect(() => {
    if (querySymbol) setActivePair(querySymbol);
  }, [querySymbol, setActivePair]);

  const handleSelectSymbol = (next: string) => {
    setActivePair(next);
    router.push(`/dashboard/spot?symbol=${next}`);
  };

  return (
    <SpotPageBody
      key={normalizedSymbol}
      normalizedSymbol={normalizedSymbol}
      baseSymbol={baseSymbol}
      displayPair={displayPair}
      backendConfigured={backendConfigured}
      onSelectSymbol={handleSelectSymbol}
    />
  );
}
