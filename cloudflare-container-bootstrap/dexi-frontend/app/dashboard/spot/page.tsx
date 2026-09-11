'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import SafeBackButton from '../../components/SafeBackButton';
import { io } from 'socket.io-client';
import api, { apiBaseUrl } from '../../lib/api';
import SymbolSelector from '../../components/SymbolSelector';
import { useMarketData } from '../../hooks/useMarketData';
import { useActivePair } from '../../state/ActivePairProvider';
import { type MarketDataStatus } from '../../lib/market-data';
import { hasAuthSession } from '../../lib/auth-session';
import { productStateLabel } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import {
  closeMarginPosition,
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

type OrderBookRow = { id?: string; price: number; amount: number; remaining?: number };
type MarketTradeRow = { id: string; price: number; amount: number; executedAt: string; side: 'MATCHED' };
type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
type HistoryTab = 'OPEN' | 'ORDERS' | 'TRADES';
type SpotHistoryRow = Record<string, unknown>;
type ConfirmationMode = 'AUTHORITATIVE';
type ChartInterval = '1m' | '5m' | '15m' | '1h';
type MobileMarketPanel = 'CHART' | 'BOOK' | 'TRADES';
type SpotSurface = 'SPOT' | 'MARGIN';

const CHART_INTERVALS: ChartInterval[] = ['1m', '5m', '15m', '1h'];

const finiteRows = (value: unknown): OrderBookRow[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const price = Number(item.price);
    const amount = Number(item.remaining ?? item.amount);
    return Number.isFinite(price) && price > 0 && Number.isFinite(amount) && amount > 0
      ? [{ id: typeof item.id === 'string' ? item.id : typeof item.orderId === 'string' ? item.orderId : undefined, price, amount }]
      : [];
  });
};

const finiteTrades = (value: unknown): MarketTradeRow[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const item = row as Record<string, unknown>;
    const price = Number(item.price);
    const amount = Number(item.amount);
    const id = typeof item.id === 'string' ? item.id : null;
    const executedAt = typeof item.executedAt === 'string' ? item.executedAt : null;
    return id && executedAt && Number.isFinite(price) && price > 0 && Number.isFinite(amount) && amount > 0
      ? [{ id, price, amount, executedAt, side: 'MATCHED' as const }]
      : [];
  });
};

export default function SpotPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activePair, setActivePair } = useActivePair();
  const querySymbol = searchParams.get('symbol');
  const symbol = querySymbol || activePair;
  const normalizedSymbol = symbol.replaceAll('/', '').toUpperCase();
  const baseSymbol = normalizedSymbol.endsWith('USDT') ? normalizedSymbol.slice(0, -4) : normalizedSymbol;
  const displayPair = normalizedSymbol.endsWith('USDT') ? `${baseSymbol}/USDT` : symbol;
  const backendConfigured = Boolean(apiBaseUrl);

  const { marketPairs, loading: marketLoading } = useMarketData();
  const market = marketPairs.find((row) => row.symbol === normalizedSymbol || row.displaySymbol === baseSymbol);
  const currentPrice = market?.dataState === 'LIVE' ? market.price : null;
  const marketChange = market?.dataState === 'LIVE' ? market.change : null;
  const marketVolume = market?.dataState === 'LIVE' && market.vol != null ? market.vol : null;
  const marketHigh = market?.dataState === 'LIVE' ? market.high ?? null : null;
  const marketLow = market?.dataState === 'LIVE' ? market.low ?? null : null;

  const [userId, setUserId] = useState<string | null>(null);
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const [marketTrades, setMarketTrades] = useState<MarketTradeRow[]>([]);
  const [tradeStatus, setTradeStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('UNAVAILABLE');
  const [bookStatus, setBookStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('UNAVAILABLE');
  const [chartInterval, setChartInterval] = useState<ChartInterval>('1m');
  const [chartStatus, setChartStatus] = useState<MarketDataStatus>('LOADING');
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
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>('AUTHORITATIVE');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('OPEN');
  const [historyRows, setHistoryRows] = useState<SpotHistoryRow[]>([]);
  const [historyStatus, setHistoryStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('UNAVAILABLE');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [marginDirection, setMarginDirection] = useState<MarginDirection>('LONG');
  const [marginLeverage, setMarginLeverage] = useState<MarginLeverage>(0);
  const [marginCollateral, setMarginCollateral] = useState('');
  const [marginQuote, setMarginQuote] = useState<MarginQuoteResponse | null>(null);
  const [marginPositions, setMarginPositions] = useState<MarginPositionResponse[]>([]);
  const [marginStatus, setMarginStatus] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('UNAVAILABLE');
  const [marginFeedback, setMarginFeedback] = useState<string | null>(null);
  const [marginSubmitting, setMarginSubmitting] = useState(false);
  const [activeSurface, setActiveSurface] = useState<SpotSurface>('SPOT');
  const orderSubmissionLock = useRef(false);
  const marginSubmissionLock = useRef(false);

  useEffect(() => {
    if (querySymbol) setActivePair(querySymbol);
  }, [querySymbol, setActivePair]);

  useEffect(() => {
    const sync = () => setUserId(sessionPrincipalId());
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  useEffect(() => {
    setSide('BUY');
    setOrderType('LIMIT');
    setPrice('');
    setStopPrice('');
    setAmount('');
    setTp('');
    setSl('');
    setTpSlState('NOT_CONFIGURED');
    setOrderState('DRAFT');
    setConfirmationOpen(false);
    setFeedback(null);
    setChartStatus('LOADING');
    setMobileMarketPanel('CHART');
  }, [normalizedSymbol]);

  useEffect(() => {
    if (currentPrice !== null) setPrice((current) => current || String(currentPrice));
  }, [currentPrice]);

  useEffect(() => {
    let cancelled = false;
    const hasToken = hasAuthSession();
    if (!userId || !hasToken) {
      setMarginQuote(null);
      setMarginPositions([]);
      setMarginStatus('UNAVAILABLE');
      return () => { cancelled = true; };
    }

    setMarginStatus('LOADING');
    setMarginFeedback(null);
    Promise.allSettled([getMarginQuote(displayPair), listMarginPositions()]).then(([quoteResult, positionsResult]) => {
      if (cancelled) return;
      if (quoteResult.status === 'fulfilled') {
        setMarginQuote(quoteResult.value);
        setMarginStatus('LIVE');
      } else {
        setMarginQuote(null);
        setMarginStatus('ERROR');
      }
      if (positionsResult.status === 'fulfilled') setMarginPositions(positionsResult.value);
      else setMarginPositions([]);
    });
    return () => { cancelled = true; };
  }, [displayPair, userId]);

  const marginCollateralValue = positiveNumber(marginCollateral);
  const marginLeverageOptions = useMemo(() => marginQuote?.leverageOptions ?? [], [marginQuote]);
  const marginReady = Boolean(userId && marginQuote && marginLeverageOptions.includes(marginLeverage) && marginCollateralValue !== null && !marginSubmitting);

  const refreshMarginPositions = async () => {
    try {
      setMarginPositions(await listMarginPositions());
    } catch {
      setMarginFeedback('Margin positions could not be refreshed.');
    }
  };

  useEffect(() => {
    if (marginLeverageOptions.length > 0 && !marginLeverageOptions.includes(marginLeverage)) {
      setMarginLeverage(marginLeverageOptions[0]);
    }
  }, [marginLeverageOptions, marginLeverage]);


  useEffect(() => {
    let cancelled = false;
    if (!userId || !hasAuthSession()) {
      setHistoryRows([]);
      setHistoryStatus('UNAVAILABLE');
      return () => { cancelled = true; };
    }
    const endpoint = historyTab === 'OPEN' ? '/spot/orders/open' : historyTab === 'ORDERS' ? '/spot/orders/history' : '/spot/trades/history';
    setHistoryStatus('LOADING');
    api.get(endpoint, { timeout: 15_000 })
      .then((response) => {
        if (cancelled) return;
        const rows = Array.isArray(response.data) ? response.data.filter((row): row is SpotHistoryRow => Boolean(row && typeof row === 'object')) : [];
        setHistoryRows(rows);
        setHistoryStatus(rows.length > 0 ? 'LIVE' : 'UNAVAILABLE');
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryRows([]);
        setHistoryStatus('ERROR');
      });
    return () => { cancelled = true; };
  }, [historyTab, userId]);

  const handleOpenMargin = async () => {
    if (marginSubmissionLock.current) return;
    if (!marginReady || marginCollateralValue === null) {
      setMarginFeedback(!userId ? 'Verify the wallet before opening an isolated-margin position.' : 'Enter positive collateral and wait for the latest margin quote.');
      return;
    }
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      await openMarginPosition({
        pair: displayPair,
        direction: marginDirection,
        leverage: marginLeverage,
        collateral: marginCollateral,
        idempotencyKey: `margin:open:${normalizedSymbol}:${Date.now()}`,
      });
      setMarginCollateral('');
      setMarginFeedback(`${marginDirection} ${marginLeverage}x position submitted to the authoritative API.`);
      await refreshMarginPositions();
    } catch {
      setMarginFeedback('This margin position could not be opened.');
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };

  const handleCloseMargin = async (positionId: string) => {
    if (marginSubmissionLock.current) return;
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      await closeMarginPosition(positionId, `margin:close:${positionId}:${Date.now()}`);
      setMarginFeedback('Margin close request accepted.');
      await refreshMarginPositions();
    } catch {
      setMarginFeedback('The margin close request failed.');
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };

  const handleMarkMargin = async (positionId: string) => {
    if (marginSubmissionLock.current) return;
    marginSubmissionLock.current = true;
    setMarginSubmitting(true);
    setMarginFeedback(null);
    try {
      await markMarginPosition(positionId);
      setMarginFeedback('Margin position refreshed with the latest quote.');
      await refreshMarginPositions();
    } catch {
      setMarginFeedback('The margin quote refresh failed.');
    } finally {
      marginSubmissionLock.current = false;
      setMarginSubmitting(false);
    }
  };


  useEffect(() => {
    let cancelled = false;
    if (!backendConfigured) {
      setBids([]);
      setAsks([]);
      setBookStatus('UNAVAILABLE');
      return;
    }
    setBookStatus('LOADING');
    api.get('/spot/orderbook', { params: { pair: displayPair }, timeout: 15_000 })
      .then((response) => {
        if (cancelled) return;
        const payload = response.data as Record<string, unknown>;
        const nextBids = finiteRows(payload.buys ?? payload.bids);
        const nextAsks = finiteRows(payload.sells ?? payload.asks);
        setBids(nextBids);
        setAsks(nextAsks);
        setBookStatus(nextBids.length > 0 || nextAsks.length > 0 ? 'LIVE' : 'UNAVAILABLE');
      })
      .catch(() => {
        if (!cancelled) {
          setBids([]);
          setAsks([]);
          setBookStatus('ERROR');
        }
      });
    return () => { cancelled = true; };
  }, [backendConfigured, displayPair]);

  useEffect(() => {
    if (!backendConfigured) return;
    const socket = io(`${apiBaseUrl}/spot`, {
      // Allow the Socket.IO polling handshake to recover through the staging
      // tunnel before upgrading to websocket.
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
    });

    const refreshTrades = () => {
      void api.get('/spot/market-trades', { params: { pair: displayPair }, timeout: 15_000 })
        .then((response) => {
          const nextTrades = finiteTrades(response.data);
          setMarketTrades(nextTrades);
          setTradeStatus(nextTrades.length > 0 ? 'LIVE' : 'UNAVAILABLE');
        })
        .catch(() => setTradeStatus('ERROR'));
    };

    const refreshBook = () => {
      void api.get('/spot/orderbook', { params: { pair: displayPair }, timeout: 15_000 })
        .then((response) => {
          const payload = response.data as Record<string, unknown>;
          const nextBids = finiteRows(payload.bids);
          const nextAsks = finiteRows(payload.asks);
          setBids(nextBids);
          setAsks(nextAsks);
          setBookStatus(nextBids.length > 0 || nextAsks.length > 0 ? 'LIVE' : 'UNAVAILABLE');
        })
        .catch(() => setBookStatus('ERROR'));
    };

    const handleOrderBook = (raw: unknown) => {
      if (!raw || typeof raw !== 'object') return;
      const event = raw as Record<string, unknown>;
      if (String(event.pair ?? '').replaceAll('/', '').toUpperCase() !== normalizedSymbol) return;
      const payload = event.payload && typeof event.payload === 'object' ? event.payload as Record<string, unknown> : null;
      const orderBook = payload?.orderBook && typeof payload.orderBook === 'object' ? payload.orderBook as Record<string, unknown> : null;
      if (!orderBook) return;
      const nextBids = finiteRows(orderBook.bids);
      const nextAsks = finiteRows(orderBook.asks);
      setBids(nextBids);
      setAsks(nextAsks);
      setBookStatus(nextBids.length > 0 || nextAsks.length > 0 ? 'LIVE' : 'UNAVAILABLE');
      // The emitted book update follows every matcher mutation. Refresh the
      // durable trade projection instead of inventing client-side trade rows.
      refreshTrades();
    };

    const handleConnect = () => {
      socket.emit('spot.subscribe', { pair: normalizedSymbol });
      refreshBook();
      refreshTrades();
    };
    socket.on('connect', handleConnect);
    socket.on('spot.orderbook', handleOrderBook);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('spot.orderbook', handleOrderBook);
      socket.disconnect();
    };
  }, [backendConfigured, displayPair, normalizedSymbol]);

  useEffect(() => {
    let cancelled = false;
    if (!backendConfigured) {
      setMarketTrades([]);
      setTradeStatus('UNAVAILABLE');
      return () => { cancelled = true; };
    }
    setTradeStatus('LOADING');
    api.get('/spot/market-trades', { params: { pair: displayPair }, timeout: 15_000 })
      .then((response) => {
        if (cancelled) return;
        const nextTrades = finiteTrades(response.data);
        setMarketTrades(nextTrades);
        setTradeStatus(nextTrades.length > 0 ? 'LIVE' : 'UNAVAILABLE');
      })
      .catch(() => {
        if (!cancelled) {
          setMarketTrades([]);
          setTradeStatus('ERROR');
        }
      });
    return () => { cancelled = true; };
  }, [backendConfigured, displayPair]);

  const priceStatus: MarketDataStatus = marketLoading
    ? 'LOADING'
    : (market?.source === 'tick' || market?.source === 'external') && currentPrice !== null
      ? 'LIVE'
      : backendConfigured
        ? 'ERROR'
        : 'UNAVAILABLE';
  const backendSupportsTpSl = tpSlState === 'NOT_CONFIGURED';
  const tpSlReady = tpSlState === 'NOT_CONFIGURED' || (
    (tp.trim() !== '' || sl.trim() !== '')
    && (tp.trim() === '' || positiveNumber(tp) !== null)
    && (sl.trim() === '' || positiveNumber(sl) !== null)
  );
  const ready = backendSupportsTpSl && spotOrderReady({
    authenticated: Boolean(userId),
    backendConfigured,
    amount,
    orderType,
    price,
    stopPrice,
  });
  const executionPrice = orderType === 'MARKET' ? currentPrice : positiveNumber(price);
  const total = positiveNumber(amount) !== null && executionPrice !== null
    ? positiveNumber(amount)! * executionPrice
    : null;
  const reviewReady = ready;

  const openReview = () => {
    setFeedback(null);
    if (ready) {
      setConfirmationMode('AUTHORITATIVE');
      setConfirmationOpen(true);
      return;
    }
    setFeedback(!backendConfigured
      ? 'Trading is not available right now.'
      : !userId
        ? 'Sign in to submit an order.'
        : !backendSupportsTpSl
          ? 'Take-profit and stop-loss are not available for this order yet. Disable them to continue.'
          : !tpSlReady
            ? 'Enter a valid take-profit or stop-loss value.'
            : 'Enter valid order values.');
  };

  const submitOrder = async () => {
    if (orderSubmissionLock.current || !ready || !userId) return;
    orderSubmissionLock.current = true;
    setOrderState('SUBMITTING');
    setFeedback(null);
    try {
      const response = await api.post('/spot/order', {
        pair: displayPair,
        side,
        type: orderType,
        amount: amount.trim(),
        price: price.trim(),
        ...(orderType === 'STOP' ? { stopPrice: stopPrice.trim() } : {}),
        idempotencyKey: `spot:${normalizedSymbol}:${side}:${Date.now()}`,
      });
      setOrderState(normalizeSpotOrderState((response.data as { status?: unknown })?.status ?? 'OPEN'));
      setConfirmationOpen(false);
      setAmount('');
      setFeedback('Order accepted.');
    } catch {
      setOrderState('FAILED');
      setConfirmationOpen(false);
      setFeedback('The order could not be accepted.');
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

  return (
    <main className="nexi-page-shell min-h-[100dvh] w-full min-w-0 overflow-x-clip pb-36 text-[#F8F6FF] lg:pb-8">
      <header className="nexi-station-header sticky top-0 z-20 flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
        <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
        <div className="min-w-0 flex-1">
          <SymbolSelector
            currentSymbol={displayPair}
            onSelect={(next) => {
              setActivePair(next);
              router.push(`/dashboard/spot?symbol=${next}`);
            }}
          />
        </div>
        {currentPrice !== null && <div className="shrink-0 text-right" aria-label="Current market price">
          <p className="font-mono text-sm text-[#C3BBD0]">{currentPrice.toLocaleString()}</p>
          {marketChange !== null && <p className={`mt-0.5 font-mono text-[10px] ${marketChange >= 0 ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}`}>{marketChange > 0 ? '+' : ''}{marketChange.toFixed(2)}% 24h</p>}
        </div>}
        {priceStatus === 'ERROR' && <div className="shrink-0 text-right" role="status" aria-label="Market data error">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF9CB0]">Market error</p>
        </div>}
      </header>

      {priceStatus === 'LIVE' && <section className="nexi-station-card mx-4 mt-3 min-w-0 grid-cols-[1.05fr_repeat(5,minmax(0,0.82fr))] overflow-hidden rounded-xl md:grid" aria-label="Active market context">
        <div className="min-w-0 border-r border-violet-300/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[.16em] text-[#8C8299]">Active pair</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{displayPair}</p>
        </div>
        <MarketMetric label="Mark price" value={currentPrice?.toLocaleString('en-US', { maximumFractionDigits: 8 }) ?? null} />
        <MarketMetric label="24h change" value={marketChange === null ? null : `${marketChange > 0 ? '+' : ''}${marketChange.toFixed(2)}%`} tone={marketChange === null ? 'muted' : marketChange >= 0 ? 'positive' : 'negative'} />
        <MarketMetric label="24h high" value={marketHigh?.toLocaleString('en-US', { maximumFractionDigits: 8 }) ?? null} />
        <MarketMetric label="24h low" value={marketLow?.toLocaleString('en-US', { maximumFractionDigits: 8 }) ?? null} />
        <MarketMetric label="24h volume" value={marketVolume?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? null} />
      </section>}

      <div className="mx-3 mt-3 grid grid-cols-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-1 sm:mx-4" role="tablist" aria-label="Spot product">
        {(['SPOT', 'MARGIN'] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={activeSurface === value} onClick={() => setActiveSurface(value)} className={`nexi-interactive min-h-10 rounded-lg text-xs font-semibold sm:min-h-11 sm:text-sm ${activeSurface === value ? 'bg-[#2A1742] text-white shadow-[0_0_18px_rgba(109,65,255,.16)]' : 'text-[#8C8299]'}`}>
            {value === 'SPOT' ? 'Spot' : 'Margin'}
          </button>
        ))}
      </div>


      {activeSurface === 'MARGIN' && <section className="nexi-station-card mx-3 mt-3 min-w-0 rounded-2xl p-3 sm:mx-4 sm:p-5" aria-labelledby="isolated-margin-heading">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#48C0CC]">Spot isolated margin</p>
            <h2 id="isolated-margin-heading" className="mt-1 text-lg font-semibold">{displayPair} margin workspace</h2>
          </div>
        </div>
        <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-violet-300/10 bg-[#0B0711]">
          <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C8299]">{displayPair}</span>
            <div className="flex shrink-0 items-center gap-1" role="tablist" aria-label="Margin chart interval">
              {CHART_INTERVALS.map((value) => (
                <button key={value} type="button" role="tab" aria-selected={chartInterval === value} onClick={() => setChartInterval(value)} className={`nexi-interactive min-h-8 rounded-md px-2 text-[10px] font-semibold ${chartInterval === value ? 'bg-[#2C146C] text-white' : 'text-[#8C8299] hover:text-white'}`}>{value}</button>
              ))}
            </div>
          </div>
          <div className="min-h-[300px] md:min-h-[360px] xl:min-h-[430px]">
            <RealtimeTradingChart symbol={normalizedSymbol} type="spot" interval={chartInterval} onStatusChange={setChartStatus} />
          </div>
        </div>
        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-3">
            <div className="grid min-w-0 grid-cols-2 gap-2 rounded-xl bg-[#0B0711] p-1" role="tablist" aria-label="Margin direction">
              {(['LONG', 'SHORT'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={marginDirection === value} onClick={() => setMarginDirection(value)} className={`min-h-10 rounded-lg text-xs font-semibold ${marginDirection === value ? value === 'LONG' ? 'bg-emerald-400/15 text-[#22D3A6]' : 'bg-rose-400/15 text-[#FF5C7C]' : 'text-[#8C8299]'}`}>{value}</button>)}
            </div>
            <div className="grid min-w-0 grid-cols-3 gap-2" role="tablist" aria-label="Margin leverage">
              {marginLeverageOptions.map((value) => <button key={value} type="button" role="tab" aria-selected={marginLeverage === value} onClick={() => setMarginLeverage(value)} className={`min-h-10 rounded-lg border text-xs font-semibold ${marginLeverage === value ? 'border-violet-300/35 bg-[#2A1742] text-white' : 'border-violet-300/10 text-[#8C8299]'}`}>{value}x</button>)}
            </div>
            <label className="block text-xs text-[#C3BBD0]">Collateral (USDT)
              <input type="number" inputMode="decimal" min="0" step="any" value={marginCollateral} onChange={(event) => setMarginCollateral(event.target.value)} placeholder="Enter positive collateral" className="mt-1 min-h-11 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 text-right font-mono outline-none focus:border-[#8B5CF6]" />
            </label>
            <dl className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs">
              {marginQuote?.price != null && <div><dt className="text-[#8C8299]">Mark price</dt><dd className="mt-1 font-mono">{marginQuote.price}</dd></div>}
              {marginQuote?.maintenanceRatio != null && <div><dt className="text-[#8C8299]">Maintenance ratio</dt><dd className="mt-1 font-mono">{marginQuote.maintenanceRatio}</dd></div>}
            </dl>
            <button type="button" onClick={handleOpenMargin} disabled={!marginReady} className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:from-[#21152F] disabled:to-[#21152F] disabled:text-[#766D82]">Open {marginDirection} {marginLeverage}x</button>
          </div>
          <div className="min-w-0 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Positions</h3><span className="text-xs text-[#8C8299]">{marginPositions.length} loaded</span></div>
            {marginPositions.length === 0 ? <p className="mt-5 text-center text-sm text-[#8C8299]">{userId ? 'No margin positions are available.' : 'Verify the wallet to load margin positions.'}</p> : <div className="mt-3 space-y-2">{marginPositions.map((position) => <article key={position.id} className="rounded-lg border border-violet-300/10 p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className={position.direction === 'LONG' ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}>{position.direction} {position.leverage}x</span><span className="rounded-full border border-violet-300/15 px-2 py-1 uppercase text-[#C3BBD0]">{position.status}</span></div><p className="mt-2 font-mono">Collateral {position.collateral} · Entry {position.entryPrice} · Mark {position.markPrice ?? '—'}</p><div className="mt-2 flex flex-wrap gap-2">{position.status === 'OPEN' && <button type="button" disabled={marginSubmitting} onClick={() => void handleMarkMargin(position.id)} className="rounded border border-cyan-300/20 px-2 py-1 text-[#48C0CC] disabled:opacity-50">Mark</button>}{['PENDING', 'OPEN'].includes(position.status) && <button type="button" disabled={marginSubmitting} onClick={() => void handleCloseMargin(position.id)} className="rounded border border-rose-300/20 px-2 py-1 text-[#FF9CB0] disabled:opacity-50">Close</button>}</div></article>)}</div>}
          </div>
        </div>
        {marginFeedback && <p role="status" className="mt-3 text-xs text-[#C3BBD0]">{marginFeedback}</p>}
        <p className="mt-3 text-[10px] text-[#8C8299]">Backend-authoritative isolated margin only: LONG/SHORT leverage options are Admin-configured. Cross margin, futures, perpetuals, portfolio margin, and C2C are not exposed.</p>
      </section>}

      {activeSurface === 'SPOT' && <div className="grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <section className="contents xl:block xl:space-y-4" aria-labelledby="spot-market-heading">
          <div className="order-1 hidden min-w-0 flex-wrap items-end justify-between gap-3 md:flex xl:order-none">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A78BFA]">Spot trading</p>
              <h1 id="spot-market-heading" className="mt-1 text-2xl font-semibold">{displayPair}</h1>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" aria-label="Market connection status">
            </div>
          </div>

          <div className={`nexi-station-card order-2 min-h-[210px] min-w-0 overflow-hidden rounded-xl sm:rounded-2xl md:block md:min-h-[360px] xl:order-none xl:min-h-[430px] ${mobileMarketPanel === 'CHART' ? 'block' : 'hidden'}`}>
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-white/5 px-3 py-2">
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C8299]">{displayPair}</span>
              <div className="flex shrink-0 items-center gap-1" role="tablist" aria-label="Chart interval">
                {CHART_INTERVALS.map((value) => (
                  <button key={value} type="button" role="tab" aria-selected={chartInterval === value} onClick={() => setChartInterval(value)} className={`nexi-interactive min-h-8 rounded-md px-2 text-[10px] font-semibold ${chartInterval === value ? 'bg-[#2C146C] text-white' : 'text-[#8C8299] hover:text-white'}`}>{value}</button>
                ))}
              </div>
            </div>
            <div className="min-h-[300px] md:min-h-[360px] xl:min-h-[430px]">
              <RealtimeTradingChart symbol={normalizedSymbol} type="spot" interval={chartInterval} onStatusChange={setChartStatus} />
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

          <div className="order-4 grid min-w-0 gap-4 lg:grid-cols-2 xl:order-none">
            <section className={`nexi-station-card min-w-0 overflow-hidden rounded-2xl md:block ${mobileMarketPanel === 'BOOK' ? 'block' : 'hidden'}`} aria-labelledby="order-book-heading">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <h2 id="order-book-heading" className="font-semibold">Order book</h2>
                {bookStatus === 'LIVE' ? <span className="text-xs text-[#8C8299]">Live</span> : bookStatus === 'LOADING' ? <span className="text-xs text-[#8C8299]">Loading</span> : bookStatus === 'ERROR' ? <span className="text-xs text-[#8C8299]">Request error</span> : null}
              </div>
              <div className="grid min-w-0 grid-cols-2 text-xs">
                <div className="min-w-0 border-r border-white/5 p-3">
                  <div className="mb-2 flex min-w-0 justify-between gap-2 text-[#8C8299]"><span>Amount</span><span>Bid</span></div>
                  {bids.slice(0, 12).map((row, index) => <button key={row.id ?? index} type="button" onClick={() => setPrice(String(row.price))} className="nexi-interactive flex min-h-8 min-w-0 w-full justify-between gap-2 rounded px-1 font-mono hover:bg-emerald-400/5"><span className="truncate">{row.amount}</span><span className="truncate text-[#22D3A6]">{row.price}</span></button>)}
                </div>
                <div className="min-w-0 p-3">
                  <div className="mb-2 flex min-w-0 justify-between gap-2 text-[#8C8299]"><span>Ask</span><span>Amount</span></div>
                  {asks.slice(0, 12).map((row, index) => <button key={row.id ?? index} type="button" onClick={() => setPrice(String(row.price))} className="nexi-interactive flex min-h-8 min-w-0 w-full justify-between gap-2 rounded px-1 font-mono hover:bg-rose-400/5"><span className="truncate text-[#FF5C7C]">{row.price}</span><span className="truncate">{row.amount}</span></button>)}
                </div>
              </div>
              {bids.length === 0 && asks.length === 0 && (
                <p className="px-4 pb-6 text-center text-sm text-[#8C8299]">
                  {bookStatus === 'LOADING'
                    ? 'Loading the order book…'
                    : bookStatus === 'ERROR'
                      ? 'The order book could not be loaded.'
                      : 'No order-book data yet.'}
                </p>
              )}
            </section>

            <section className={`nexi-station-card min-w-0 rounded-2xl md:block ${mobileMarketPanel === 'TRADES' ? 'block' : 'hidden'}`} aria-labelledby="recent-trades-heading">
              <div className="flex items-center justify-between gap-2 border-b border-white/5 px-4 py-3"><h2 id="recent-trades-heading" className="font-semibold">Recent trades</h2>{tradeStatus === 'LIVE' ? <span className="text-xs text-[#8C8299]">Live market records</span> : tradeStatus === 'LOADING' ? <span className="text-xs text-[#8C8299]">Loading</span> : tradeStatus === 'ERROR' ? <span className="text-xs text-[#8C8299]">Request error</span> : null}</div>
              {marketTrades.length > 0 ? <div className="divide-y divide-white/5 text-xs">{marketTrades.slice(0, 12).map((trade) => <div key={trade.id} className="grid grid-cols-3 gap-2 px-4 py-2 font-mono"><span>{trade.price.toLocaleString()}</span><span>{trade.amount}</span><span className="text-right text-[#8C8299]">{new Date(trade.executedAt).toLocaleTimeString()}</span></div>)}</div> : <div className="flex min-h-52 items-center justify-center p-6 text-center text-sm text-[#8C8299]">{tradeStatus === 'LOADING' ? 'Loading recent trades…' : tradeStatus === 'ERROR' ? 'Recent trades could not be loaded.' : 'No recent trades yet.'}</div>}
            </section>
          </div>

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
              {historyRows.length > 0 ? (
                <div className="space-y-2">{historyRows.slice(0, 30).map((row, index) => {
                  const id = String(row.id ?? row.orderId ?? `${historyTab}-${index}`);
                  const pair = String(row.pair ?? displayPair);
                  const status = String(row.status ?? row.state ?? 'COMPLETED').replaceAll('_', ' ');
                  const rowSide = row.side ? String(row.side) : '';
                  const rowAmount = String(row.amount ?? row.quantity ?? row.filled ?? '—');
                  const rowPrice = String(row.price ?? row.entryPrice ?? '—');
                  const when = row.createdAt ?? row.executedAt ?? row.updatedAt;
                  return <article key={id} className="rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{pair}{rowSide ? ` · ${rowSide}` : ''}</span><span className="rounded-full border border-violet-300/20 px-2 py-1 uppercase text-[#C3BBD0]">{status}</span></div><div className="mt-2 grid grid-cols-2 gap-2 font-mono sm:grid-cols-4"><span>Amount {rowAmount}</span><span>Price {rowPrice}</span><span className="truncate">ID {id}</span><span>{when ? new Date(String(when)).toLocaleString() : '—'}</span></div></article>;
                })}</div>
              ) : (
                <div className="flex min-h-32 items-center justify-center text-center text-sm text-[#8C8299]">{historyStatus === 'LOADING' ? 'Loading activity…' : historyStatus === 'ERROR' ? 'Activity request failed.' : historyTab === 'OPEN' ? 'No open orders.' : historyTab === 'ORDERS' ? 'No order history.' : 'No trade history.'}</div>
              )}
            </div>
          </section>
        </section>

        <aside className="nexi-station-card order-5 h-fit min-w-0 overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-5 xl:sticky xl:top-20 xl:order-none" aria-labelledby="spot-ticket-heading">
          <div className="hidden items-start justify-between gap-3 sm:flex">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#48C0CC]">Execution ticket</p><h2 id="spot-ticket-heading" className="mt-1 text-xl font-semibold gradient-text">Place a Spot order</h2></div>
            <Wallet className="mt-1 h-5 w-5 shrink-0 text-[#A995FF]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 grid min-w-0 grid-cols-2 rounded-xl bg-[#0B0711] p-1 sm:mt-3" data-testid="spot-buy-sell">
            {(['BUY', 'SELL'] as const).map((value) => <button key={value} type="button" onClick={() => setSide(value)} className={`nexi-interactive min-h-9 min-w-0 rounded-lg px-1 text-xs font-semibold sm:min-h-11 sm:text-sm ${side === value ? value === 'BUY' ? 'bg-emerald-400/15 text-[#22D3A6]' : 'bg-rose-400/15 text-[#FF5C7C]' : 'text-[#8C8299]'}`}>{value === 'BUY' ? 'Buy' : 'Sell'}</button>)}
          </div>
          <div className="mt-2 grid min-w-0 grid-cols-3 gap-1 rounded-xl bg-[#0B0711] p-1" role="tablist" aria-label="Order type" data-testid="spot-order-type">
            {(['MARKET', 'LIMIT', 'STOP'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={orderType === value} onClick={() => setOrderType(value)} className={`nexi-interactive min-h-9 min-w-0 whitespace-normal rounded-lg px-1 text-[10px] leading-tight sm:min-h-11 sm:text-xs ${orderType === value ? 'bg-[#2A1742] text-white' : 'text-[#8C8299]'}`}>{value === 'STOP' ? 'Stop Limit' : value[0] + value.slice(1).toLowerCase()}</button>)}
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

          <dl className="mt-1.5 grid min-w-0 grid-cols-3 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-1.5 text-[10px] sm:mt-3 sm:p-2 sm:text-[11px] md:grid-cols-4 md:p-3 md:text-xs">
            <div className="min-w-0"><dt className="text-[#8C8299]">Total</dt><dd className="mt-0.5 break-words font-mono">{total === null ? '—' : `${total.toFixed(2)} USDT`}</dd></div>
            <div className="min-w-0"><dt className="text-[#8C8299]">Fee</dt><dd className="mt-0.5 break-words font-mono">—</dd></div>
            <div className="min-w-0"><dt className="text-[#8C8299]">Available</dt><dd className="mt-0.5 break-words font-mono">—</dd></div>
            <div className="hidden min-w-0 md:block"><dt className="text-[#8C8299]">State</dt><dd className="mt-0.5 break-words font-mono">{productStateLabel(orderState)}</dd></div>
          </dl>

          {feedback && <p role="status" className="mt-3 text-sm text-[#C3BBD0]">{feedback}</p>}
          <button type="button" onClick={openReview} disabled={!reviewReady} data-testid="spot-submit-btn" className="nexi-interactive mt-1.5 min-h-9 w-full rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-4 text-sm font-semibold shadow-[0_0_24px_rgba(109,40,217,.28)] disabled:cursor-not-allowed disabled:from-[#21152F] disabled:to-[#21152F] disabled:text-[#766D82] disabled:shadow-none sm:mt-3 sm:min-h-11">
            {ready ? `Review ${side.toLowerCase()} order` : 'Enter valid order values'}
          </button>
        </aside>
      </div>}

      {confirmationOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="spot-confirm-title">
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
            <button type="button" onClick={() => setConfirmationOpen(false)} className="min-h-12 rounded-xl border border-violet-300/15">Back</button>
            <button type="button" onClick={submitOrder} disabled={orderState === 'SUBMITTING'} className="min-h-12 rounded-xl bg-[#7C3AED] font-semibold disabled:opacity-50">{orderState === 'SUBMITTING' ? 'Submitting…' : 'Confirm'}</button>
          </div>
        </div>
      </div>}
    </main>
  );
}

function MarketMetric({ label, value, tone = 'muted' }: { label: string; value: string | null; tone?: 'muted' | 'positive' | 'negative' }) {
  if (value === null) return null;
  const toneClass = tone === 'positive'
    ? 'text-[#98FCE4]'
    : tone === 'negative'
      ? 'text-[#FF9CB0]'
      : 'text-[#C3BBD0]';

  return (
    <div className="min-w-0 border-r border-violet-300/10 px-3 py-2 last:border-r-0">
      <p className="text-[10px] uppercase tracking-[.16em] text-[#8C8299]">{label}</p>
      <p className={`mt-0.5 truncate font-mono text-xs ${toneClass}`}>{value}</p>
    </div>
  );
}
