'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Clock3, Wallet } from 'lucide-react';
import { io } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import ModalSurface from '../../components/ModalSurface';
import SafeBackButton from '../../components/SafeBackButton';
import api, { apiBaseUrl } from '../../lib/api';
import RealtimeTradingChart from '../../components/RealtimeTradingChart';
import SymbolSelector from '../../components/SymbolSelector';
import TimeframeSelector from '../../components/TimeframeSelector';
import { useMarketData } from '../../hooks/useMarketData';
import { useActivePair } from '../../state/ActivePairProvider';
import { getAccessToken } from '../../lib/auth-session';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { normalizePair } from '../../state/active-instrument';
import { findAsset } from '../../lib/asset-registry';
import { finiteMarketNumber } from '../../lib/market-data';
import {
  binaryOrderReady,
  BinaryPositionState,
  normalizeBinaryPositionState,
} from '../../lib/trading-states';

type Direction = 'LONG' | 'SHORT';
type BinaryTab = 'TRADE' | 'ACTIVE' | 'HISTORY';
type ConfirmationMode = 'AUTHORITATIVE';

type BinaryConfiguration = {
  pair: string;
  durationSeconds: number;
  payoutRate: number | string;
  minStake: number | string;
  maxStake: number | string;
  enabled: boolean;
};

type BinaryPosition = {
  id: string;
  symbol: string;
  direction: Direction | 'UNKNOWN';
  amount: number | null;
  entryPrice: number | null;
  closePrice: number | null;
  duration: number | null;
  payout: number | null;
  realizedProfit: number | null;
  openedAt: string | null;
  expiresAt: string | null;
  status: BinaryPositionState;
  referenceId: string | null;
};

const toPositive = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const normalizePosition = (value: unknown): BinaryPosition | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;
  const rawSide = String(row.direction ?? row.side ?? '').toUpperCase();
  return {
    id,
    symbol: String(row.symbol ?? row.pair ?? '—'),
    direction: ['SHORT', 'PUT', 'DOWN'].includes(rawSide) ? 'SHORT' : ['LONG', 'CALL', 'UP'].includes(rawSide) ? 'LONG' : 'UNKNOWN',
    amount: toPositive(row.amount ?? row.stake),
    entryPrice: toPositive(row.entryPrice),
    closePrice: toPositive(row.closePrice ?? row.resultPrice ?? row.expiryPrice),
    duration: toPositive(row.duration ?? row.durationSeconds ?? row.timeframe),
    payout: finiteMarketNumber(row.payout ?? row.payoutAmount ?? row.targetPayout),
    realizedProfit: finiteMarketNumber(row.realizedProfit ?? row.profit),
    openedAt: typeof row.openedAt === 'string' ? row.openedAt : typeof row.createdAt === 'string' ? row.createdAt : null,
    expiresAt: typeof row.expiresAt === 'string' ? row.expiresAt : null,
    status: normalizeBinaryPositionState(row.status),
    referenceId: typeof row.referenceId === 'string' ? row.referenceId : id,
  };
};

const FINAL_BINARY_STATES = new Set<BinaryPositionState>(['WIN', 'LOSS', 'ERROR']);
const INTERRUPTIBLE_BINARY_STATES = new Set<BinaryPositionState>(['OPEN', 'SETTLING', 'SETTLEMENT_DELAYED']);

const binaryStateLabel = (state: BinaryPositionState) => {
  if (state === 'ERROR') return 'Settlement failure';
  return state
    .split('_')
    .map((word) => `${word.slice(0, 1)}${word.slice(1).toLowerCase()}`)
    .join(' ');
};

export default function BinaryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activePair, setActivePair } = useActivePair();
  const initialSymbol = searchParams.get('symbol') || activePair;
  const [pair, setPair] = useState(initialSymbol);
  const normalizedPair = normalizePair(pair);
  const displayPair = findAsset(pair)?.pair ?? (normalizedPair.endsWith('USDT')
    ? `${normalizedPair.slice(0, -4)}/USDT`
    : pair);
  const submissionConfigured = Boolean(apiBaseUrl);

  const [interval, setInterval] = useState('1m');
  const [duration, setDuration] = useState(60);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<Direction>('LONG');
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<BinaryTab>('TRADE');
  const [state, setState] = useState<BinaryPositionState>('DRAFT');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>('AUTHORITATIVE');
  const [activePositions, setActivePositions] = useState<BinaryPosition[]>([]);
  const [history, setHistory] = useState<BinaryPosition[]>([]);
  const [selectedResult, setSelectedResult] = useState<BinaryPosition | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [binaryConfigurations, setBinaryConfigurations] = useState<BinaryConfiguration[]>([]);
  const [binaryDurations, setBinaryDurations] = useState<number[]>([]);
  const submissionLock = useRef(false);
  const { marketPairs, metal, shares, forex } = useMarketData();

  useEffect(() => {
    setPair(initialSymbol);
    setActivePair(initialSymbol);
  }, [initialSymbol, setActivePair]);

  useEffect(() => {
    setAmount('');
    setDirection('LONG');
    setTab('TRADE');
    setState('DRAFT');
    setConfirmationOpen(false);
    setConfirmationMode('AUTHORITATIVE');
    setActivePositions([]);
    setHistory([]);
    setSelectedResult(null);
    setFeedback(null);
  }, [normalizedPair]);

  useEffect(() => {
    const sync = () => setUserId(sessionPrincipalId());
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  useEffect(() => {
    if (!userId || !apiBaseUrl) return;
    const token = getAccessToken();
    if (!token) return;
    const socket = io(apiBaseUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelayMax: 8_000,
    });
    const handlePositionUpdate = (raw: unknown) => {
      const payload = raw as { event: string; position: unknown };
      const position = normalizePosition(payload.position);
      if (!position) return;
      setActivePositions((current) => [position, ...current.filter((item) => item.id !== position.id)]);
      if (FINAL_BINARY_STATES.has(position.status)) {
        setActivePositions((current) => current.filter((item) => item.id !== position.id));
        setHistory((current) => [position, ...current.filter((item) => item.id !== position.id)]);
        setSelectedResult(position);
        setTab('HISTORY');
      }
      setState(position.status);
    };
    const handleConnectionLoss = () => {
      setState((current) => INTERRUPTIBLE_BINARY_STATES.has(current) ? 'CONNECTION_LOST' : current);
    };
    socket.on('binary_position_update', handlePositionUpdate);
    socket.on('disconnect', handleConnectionLoss);
    socket.on('connect_error', handleConnectionLoss);
    return () => {
      socket.off('binary_position_update', handlePositionUpdate);
      socket.off('disconnect', handleConnectionLoss);
      socket.off('connect_error', handleConnectionLoss);
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    api.get('/binary/config').then((response) => {
      if (cancelled) return;
      const configurations = Array.isArray(response.data?.configurations) ? response.data.configurations : [];
      const durations = Array.isArray(response.data?.durations)
        ? response.data.durations.map(Number).filter((value: number) => Number.isInteger(value) && value > 0)
        : [];
      setBinaryConfigurations(configurations);
      setBinaryDurations(durations);
    }).catch(() => {
      if (!cancelled) {
        setBinaryConfigurations([]);
        setBinaryDurations([]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) {
      setActivePositions([]);
      setHistory([]);
      setSelectedResult(null);
      return;
    }
    let cancelled = false;
    Promise.allSettled([
      api.get('/binary/positions/current'),
      api.get('/binary/positions/history'),
    ]).then(([currentResult, historyResult]) => {
      if (cancelled) return;
      if (currentResult.status === 'fulfilled' && Array.isArray(currentResult.value.data)) {
        setActivePositions(currentResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item)));
      }
      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
        setHistory(historyResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item)));
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (activePositions.length === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [activePositions.length]);

  const allMarkets = useMemo(() => [...marketPairs, ...metal, ...shares, ...forex], [marketPairs, metal, shares, forex]);
  const market = allMarkets.find((item) => normalizePair(item.symbol) === normalizedPair);
  const currentPrice = market?.dataState === 'LIVE' ? market.price : null;
  const marketChange = market?.dataState === 'LIVE' ? market.change : null;

  const durationOptions = useMemo(() => {
    const configured = new Map(binaryConfigurations
      .filter((item) => normalizePair(item.pair) === normalizedPair)
      .map((item) => [item.durationSeconds, item] as const));
    return binaryDurations.filter((seconds) => configured.get(seconds)?.enabled).map((seconds) => {
      const item = configured.get(seconds);
      const raw = item ? Number(item.payoutRate) : Number.NaN;
      const rate = Number.isFinite(raw) && raw > 0 ? raw : null;
      return { seconds, enabled: Boolean(item?.enabled && rate), rate, minimumAmount: item ? Number(item.minStake) : null, maximumAmount: item ? Number(item.maxStake) : null };
    });
  }, [binaryConfigurations, binaryDurations, normalizedPair]);
  useEffect(() => {
    if (durationOptions.length > 0 && !durationOptions.some((item) => item.seconds === duration && item.enabled)) {
      const firstEnabled = durationOptions.find((item) => item.enabled);
      if (firstEnabled) setDuration(firstEnabled.seconds);
    }
  }, [durationOptions, duration]);

  const selectedDuration = durationOptions.find((item) => item.seconds === duration);
  const payoutRate = selectedDuration?.rate ?? null;
  const minimumStake = selectedDuration?.minimumAmount !== null && selectedDuration?.minimumAmount !== undefined && Number.isFinite(selectedDuration.minimumAmount)
    ? selectedDuration.minimumAmount
    : null;
  const maximumStake = selectedDuration?.maximumAmount !== null && selectedDuration?.maximumAmount !== undefined && Number.isFinite(selectedDuration.maximumAmount)
    ? selectedDuration.maximumAmount
    : null;
  const stake = toPositive(amount);
  const potentialReturn = stake !== null && payoutRate !== null ? stake * (1 + payoutRate) : null;
  const ready = binaryOrderReady({
    authenticated: Boolean(userId),
    backendConfigured: submissionConfigured,
    amount,
    currentPrice,
    durationEnabled: Boolean(selectedDuration?.enabled),
    payoutRate,
    minimumAmount: minimumStake,
    maximumAmount: maximumStake,
  });
  const reviewReady = ready;
  const stateTone = ['WIN', 'OPEN'].includes(state)
    ? 'border-emerald-300/25 bg-emerald-400/5 text-[#98FCE4]'
    : ['LOSS', 'ERROR', 'CONNECTION_LOST'].includes(state)
      ? 'border-rose-300/25 bg-rose-400/5 text-[#FF9CB0]'
      : ['SETTLING', 'SETTLEMENT_DELAYED'].includes(state)
        ? 'border-[#48C0CC]/20 bg-[#48C0CC]/5 text-[#48C0CC]'
        : 'border-violet-300/20 bg-violet-400/5 text-[#CFC4FF]';
  const availabilityCopy = !submissionConfigured
    ? 'Options are unavailable right now.'
    : !userId
      ? 'Verify your wallet to review and submit an options position.'
      : currentPrice === null
        ? 'A fresh market price is required before submission.'
        : !selectedDuration?.enabled
          ? 'The selected duration is not currently available.'
          : 'Enter a stake to review the position before submission.';

  const openReview = (nextDirection: Direction) => {
    setDirection(nextDirection);
    setFeedback(null);
    if (ready) {
      setConfirmationMode('AUTHORITATIVE');
      setState('CONFIRMATION');
      setConfirmationOpen(true);
      return;
    }
    setState(currentPrice === null ? 'PRICE_STALE' : submissionConfigured ? 'DISABLED' : 'UNAVAILABLE');
    setFeedback(!submissionConfigured
      ? 'Options are unavailable right now.'
      : !userId
        ? 'Verify your wallet to submit a position.'
        : currentPrice === null
          ? 'A fresh market price is required before submission.'
          : 'Select an enabled duration and enter a valid stake.');
  };

  const submitPosition = async () => {
    if (submissionLock.current || !ready || !userId) return;
    submissionLock.current = true;
    setState('SUBMITTING');
    try {
      const response = await api.post('/binary/position', {
        pair: normalizedPair,
        stake: String(amount),
        side: direction === 'LONG' ? 'CALL' : 'PUT',
        durationSeconds: duration,
        idempotencyKey: `binary:${normalizedPair}:${duration}:${Date.now()}`,
      });
      const position = normalizePosition(response.data);
      if (!position) throw new Error('Invalid position response');
      setActivePositions((current) => [position, ...current.filter((item) => item.id !== position.id)]);
      setState('OPEN');
      setConfirmationOpen(false);
      setAmount('');
      setTab('ACTIVE');
      setFeedback('Position request accepted.');
    } catch {
      setState('ERROR');
      setConfirmationOpen(false);
      setFeedback('The position request could not be accepted.');
    } finally {
      submissionLock.current = false;
    }
  };

  return (
    <main className="nexi-page-shell min-h-[100dvh] w-full min-w-0 overflow-x-clip pb-8 text-[#F8F6FF] lg:pb-8">
      <header className="nexi-station-header sticky top-0 z-20 flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
        <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
        <div className="min-w-0 flex-1"><SymbolSelector currentSymbol={pair} onSelect={(next) => { setPair(next); setActivePair(next); router.push(`/dashboard/binary?symbol=${next}`); }} /></div>
        {currentPrice !== null && <div className="shrink-0 text-right" aria-label="Current market price"><p className="font-mono text-sm text-[#C3BBD0]">{currentPrice.toLocaleString()}</p>{marketChange !== null && <p className={`mt-0.5 font-mono text-[10px] ${marketChange >= 0 ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}`}>{marketChange > 0 ? '+' : ''}{marketChange.toFixed(2)}% 24h</p>}</div>}
      </header>

      <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <section className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1" aria-labelledby="binary-heading">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A78BFA]">Options</p><h1 id="binary-heading" className="mt-1 truncate text-2xl font-semibold">{displayPair}</h1></div>
            {state !== 'DRAFT' && <span className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs ${stateTone}`}>{binaryStateLabel(state)}</span>}
          </div>
          <div className="nexi-station-card min-w-0 rounded-2xl p-2">
            <div className="border-b border-white/5 px-2 pb-2"><TimeframeSelector interval={interval} onChange={setInterval} /></div>
            <div className="h-[clamp(260px,58vw,420px)] sm:h-[420px] xl:h-[500px]"><RealtimeTradingChart symbol={normalizedPair} type="binary" interval={interval} /></div>
          </div>

        </section>

        <aside className="nexi-station-card h-fit min-w-0 overflow-hidden rounded-2xl p-3 sm:p-5 xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1" aria-labelledby="binary-ticket-heading">
          <div className="flex items-center justify-between gap-4 sm:items-start">
            <div>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[.18em] text-[#48C0CC] sm:block">Position ticket</p>
              <h2 id="binary-ticket-heading" className="text-xs font-semibold uppercase tracking-[.16em] text-[#CFC4FF] sm:mt-1 sm:text-xl sm:normal-case sm:tracking-normal sm:text-white">
                <span className="sm:hidden">Duration</span><span className="hidden sm:inline">Choose the expiry</span>
              </h2>
            </div>
            <Wallet className="hidden h-5 w-5 shrink-0 text-[#A995FF] sm:mt-1 sm:block" aria-hidden="true" />
          </div>
          <p className="mt-2 hidden text-xs leading-5 text-[#8C8299] sm:block">Long means higher at expiry. Short means lower at expiry.</p>
          <div className="mt-2 grid min-w-0 grid-cols-5 gap-1.5 sm:mt-4 sm:gap-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="Expiry duration">
            {durationOptions.map((option) => <button key={option.seconds} type="button" disabled={!option.enabled} onClick={() => setDuration(option.seconds)} className={`nexi-interactive group min-h-[64px] min-w-0 rounded-lg border px-1.5 py-2 text-left transition sm:min-h-[84px] sm:rounded-xl sm:px-2 sm:py-2.5 ${duration === option.seconds ? 'border-[#8B5CF6] bg-[linear-gradient(145deg,rgba(109,65,255,.22),rgba(26,16,36,.92))] text-white shadow-[0_0_22px_rgba(109,65,255,.14)]' : 'border-violet-300/10 bg-[#0B0711]/70 text-[#8C8299] hover:border-violet-300/25'} disabled:cursor-not-allowed disabled:opacity-55`}><span className="block text-[9px] font-semibold uppercase tracking-[.04em] sm:text-[11px] sm:tracking-[.08em]">{option.seconds}s</span><span className="mt-1 block font-mono text-xs text-[#F5F7FB] sm:mt-2 sm:text-base">{option.rate === null ? '—' : `${(option.rate * 100).toFixed(0)}%`}</span><span className="mt-1 hidden text-[10px] text-[#8C8299] sm:block">{option.minimumAmount === null || option.maximumAmount === null ? 'Range unavailable' : `${option.minimumAmount}–${option.maximumAmount} USDT`}</span></button>)}
          </div>
          <div className="mt-2 rounded-xl border border-violet-300/10 bg-[#0B0711]/75 px-3 py-2 text-[10px] leading-4 text-[#AFA4BC] sm:mt-3 sm:py-2.5 sm:text-xs sm:leading-5">{availabilityCopy}</div>
          <label className="mt-4 block text-xs text-[#C3BBD0]">Stake (USDT)
            <div className="relative mt-1"><input type="number" inputMode="decimal" min={minimumStake ?? undefined} max={maximumStake ?? undefined} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={minimumStake !== null && maximumStake !== null ? `${minimumStake}–${maximumStake}` : '0.00'} aria-describedby="binary-stake-range" className="min-h-12 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 pr-14 text-right font-mono outline-none focus:border-[#8B5CF6]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8299]">USDT</span></div>
            <span id="binary-stake-range" className="mt-1 block text-[10px] text-[#8C8299]">{minimumStake !== null && maximumStake !== null ? `Allowed range: ${minimumStake}–${maximumStake} USDT` : 'Stake range unavailable'}</span>
          </label>
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs">
            <div><dt className="text-[#8C8299]">Option Wallet</dt><dd className="mt-1 font-mono">Unavailable</dd></div>
            <div><dt className="text-[#8C8299]">Payout rate</dt><dd className="mt-1 font-mono">{payoutRate === null ? '—' : `${(payoutRate * 100).toFixed(0)}%`}</dd></div>
            <div><dt className="text-[#8C8299]">Potential return</dt><dd className="mt-1 font-mono">{potentialReturn === null ? '—' : `${potentialReturn.toFixed(2)} USDT`}</dd></div>
            <div><dt className="text-[#8C8299]">Duration</dt><dd className="mt-1 font-mono">{selectedDuration ? `${duration}s` : '—'}</dd></div>
          </dl>
          {feedback && <p role="status" className="mt-3 text-sm text-[#C3BBD0]">{feedback}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => openReview('LONG')} disabled={!reviewReady} className="nexi-interactive flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#159B78] font-semibold disabled:cursor-not-allowed disabled:bg-[#17332E] disabled:text-[#6E9188]"><ArrowUp size={16} />Long</button>
            <button type="button" onClick={() => openReview('SHORT')} disabled={!reviewReady} className="nexi-interactive flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D9465F] font-semibold disabled:cursor-not-allowed disabled:bg-[#3A1D25] disabled:text-[#99707A]"><ArrowDown size={16} />Short</button>
          </div>
        </aside>

        <section className="nexi-station-card min-w-0 rounded-2xl xl:col-start-1 xl:row-start-2" aria-label="Binary activity">
          <div className="grid grid-cols-3 border-b border-white/5" role="tablist">
            {([['TRADE', 'Trade'], ['ACTIVE', 'Active trades'], ['HISTORY', 'History']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`nexi-interactive min-h-12 min-w-0 px-1 text-xs sm:px-2 sm:text-sm ${tab === value ? 'border-b-2 border-[#8B5CF6] text-white' : 'text-[#8C8299]'}`}>{label}</button>)}
          </div>
          {tab === 'TRADE' && <div className="p-4">
            <p className="text-sm leading-5 text-[#C3BBD0]">Select a duration, enter a stake, then review. Long = higher; Short = lower.</p>
          </div>}
          {tab === 'ACTIVE' && <PositionList positions={activePositions} now={now} empty="No active options positions are available." onSelect={setSelectedResult} />}
          {tab === 'HISTORY' && <PositionList positions={history} now={now} empty="Position history is unavailable." onSelect={setSelectedResult} />}
        </section>
      </div>

      {confirmationOpen && <ModalSurface open onClose={() => setConfirmationOpen(false)} title="Review Options position">
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-5">
          <h2 id="binary-confirm-heading" className="text-xl font-semibold">Confirm {direction} position</h2>
          <p className="mt-1 text-sm text-[#8C8299]">{direction === 'LONG' ? 'Higher' : 'Lower'} at expiry.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Pair" value={displayPair} /><Row label="Stake" value={`${amount} USDT`} /><Row label="Duration" value={`${duration}s`} />{currentPrice !== null && <Row label="Reference price" value={String(currentPrice)} />}<Row label="Potential return" value={potentialReturn === null ? '—' : `${potentialReturn.toFixed(2)} USDT`} />
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setConfirmationOpen(false); setConfirmationMode('AUTHORITATIVE'); setState('DRAFT'); }} className="min-h-12 rounded-xl border border-violet-300/15">Back</button><button type="button" onClick={submitPosition} disabled={state === 'SUBMITTING'} className="min-h-12 rounded-xl bg-[#7C3AED] font-semibold disabled:opacity-50">{state === 'SUBMITTING' ? 'Submitting…' : 'Confirm'}</button></div>
        </div>
      </ModalSurface>}

      {selectedResult && <ResultDialog position={selectedResult} onClose={() => setSelectedResult(null)} />}
    </main>
  );
}

function PositionList({ positions, now, empty, onSelect }: { positions: BinaryPosition[]; now: number; empty: string; onSelect: (position: BinaryPosition) => void }) {
  if (positions.length === 0) return <div className="flex min-h-44 items-center justify-center p-6 text-center text-sm text-[#8C8299]">{empty}</div>;
  return <ul className="divide-y divide-white/5">{positions.map((position) => {
    const openedAt = position.openedAt ? Date.parse(position.openedAt) : Number.NaN;
    const expiresAt = position.expiresAt ? Date.parse(position.expiresAt) : Number.NaN;
    const durationMs = Number.isFinite(openedAt) && Number.isFinite(expiresAt) ? Math.max(0, expiresAt - openedAt) : 0;
    const remaining = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - now) / 1_000)) : null;
    const progress = durationMs > 0 ? Math.min(100, Math.max(0, ((now - openedAt) / durationMs) * 100)) : null;
    return <li key={position.id}><button type="button" onClick={() => onSelect(position)} className="nexi-interactive block min-h-20 w-full px-4 py-3 text-left hover:bg-white/[.03]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><p className="truncate font-semibold">{position.symbol} · {position.direction}</p><p className="mt-1 text-xs text-[#8C8299]">{binaryStateLabel(position.status)}</p></div>
        <div className="text-right font-mono text-xs"><p>{position.amount === null ? '—' : `${position.amount} USDT`}</p><p className="mt-1 flex items-center justify-end gap-1 text-[#8C8299]"><Clock3 size={12} />{remaining === null ? '—' : `${remaining}s`}</p></div>
      </div>
      {progress !== null && <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5" aria-label={`Position progress ${progress.toFixed(0)} percent`}><div className="h-full rounded-full bg-[#7C3AED] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>}
    </button></li>;
  })}</ul>;
}

function ResultDialog({ position, onClose }: { position: BinaryPosition; onClose: () => void }) {
  const publicResult = ['WIN', 'LOSS'].includes(position.status);
  return <ModalSurface open onClose={onClose} title="Options result">
    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-5">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#A78BFA]">{publicResult ? `Trade result — ${binaryStateLabel(position.status)}` : binaryStateLabel(position.status)}</p>
      <h2 id="binary-result-heading" className="mt-1 text-xl font-semibold">{position.symbol} · {position.direction}</h2>
      <dl className="mt-4 space-y-2 text-sm"><Row label="Stake" value={position.amount === null ? '—' : `${position.amount} USDT`} /><Row label="Entry price" value={position.entryPrice === null ? '—' : String(position.entryPrice)} /><Row label="Result price" value={position.closePrice === null ? '—' : String(position.closePrice)} /><Row label="Duration" value={position.duration === null ? '—' : `${position.duration}s`} /><Row label="Payout" value={position.payout === null ? '—' : `${position.payout} USDT`} /><Row label="Realized P/L" value={position.realizedProfit === null ? '—' : `${position.realizedProfit} USDT`} /><Row label="Open / expiry" value={`${position.openedAt ?? '—'} / ${position.expiresAt ?? '—'}`} /><Row label="Settlement" value={binaryStateLabel(position.status)} /><Row label="Reference ID" value={position.referenceId ?? '—'} /></dl>
      <button type="button" onClick={onClose} className="mt-5 min-h-12 w-full rounded-xl bg-[#7C3AED] font-semibold">Done</button>
    </div>
  </ModalSurface>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 justify-between gap-4"><dt className="text-[#8C8299]">{label}</dt><dd className="min-w-0 break-words text-right font-mono">{value}</dd></div>;
}
