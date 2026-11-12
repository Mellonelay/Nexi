'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Clock3, Wallet } from 'lucide-react';
import { io } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import ModalSurface from '../../components/ModalSurface';
import SafeBackButton from '../../components/SafeBackButton';
import api, { apiBaseUrl, recoverPublicSession } from '../../lib/api';
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
import { getIntentKey, type PendingIntentKey } from '../../lib/intent-key';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../lib/pending-economic-intent';
import { binarySandboxChartFeed, selectBinarySandboxPosition } from '../../lib/binary-sandbox-chart';
import {
  binaryOrderReady,
  decimalAmountWithinBalance,
  decimalLessThanOrEqual,
  BinaryPositionState,
  normalizeBinaryPositionState,
} from '../../lib/trading-states';

type Direction = 'LONG' | 'SHORT';
type BinaryTab = 'TRADE' | 'ACTIVE' | 'HISTORY';

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
  amount: string | null;
  entryPrice: string | null;
  closePrice: string | null;
  duration: number | null;
  payout: string | null;
  realizedProfit: string | null;
  openedAt: string | null;
  expiresAt: string | null;
  status: BinaryPositionState;
  referenceId: string | null;
  side: 'CALL' | 'PUT' | 'UNKNOWN';
  sandboxSimulation?: unknown;
};

const toPositive = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const financialDecimal = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text) ? text : null;
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const normalizePosition = (value: unknown): BinaryPosition | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  if (!id) return null;
  // The persisted CALL/PUT side is authoritative; a display-only direction cannot override it.
  const rawSide = String(row.side ?? row.direction ?? '').toUpperCase();
  return {
    id,
    symbol: String(row.symbol ?? row.pair ?? '—'),
    direction: ['SHORT', 'PUT', 'DOWN'].includes(rawSide) ? 'SHORT' : ['LONG', 'CALL', 'UP'].includes(rawSide) ? 'LONG' : 'UNKNOWN',
    side: ['SHORT', 'PUT', 'DOWN'].includes(rawSide) ? 'PUT' : ['LONG', 'CALL', 'UP'].includes(rawSide) ? 'CALL' : 'UNKNOWN',
    sandboxSimulation: row.sandboxSimulation,
    amount: financialDecimal(row.amount ?? row.stake),
    entryPrice: financialDecimal(row.entryPrice),
    closePrice: financialDecimal(row.closePrice ?? row.resultPrice ?? row.expiryPrice),
    duration: toPositive(row.duration ?? row.durationSeconds ?? row.timeframe),
    payout: financialDecimal(row.payout ?? row.payoutAmount ?? row.targetPayout),
    realizedProfit: financialDecimal(row.realizedProfit ?? row.profit),
    openedAt: typeof row.openedAt === 'string' ? row.openedAt : typeof row.createdAt === 'string' ? row.createdAt : null,
    expiresAt: typeof row.expiresAt === 'string' ? row.expiresAt : null,
    status: normalizeBinaryPositionState(row.state ?? row.status),
    referenceId: typeof row.referenceId === 'string' ? row.referenceId : id,
  };
};

// An HTTP snapshot may have started before the newest socket event reached us.
// Preserve observed terminal history that a delayed snapshot has not caught up with.
function reconcileTerminalPositions(snapshot: BinaryPosition[], previous: BinaryPosition[], knownTerminalIds: Set<string>, socketVersions: Map<string, number>, startedAtVersion: number) {
  const rows = new Map(snapshot.map((position) => [position.id, position]));
  for (const position of previous) {
    if (knownTerminalIds.has(position.id) && FINAL_BINARY_STATES.has(position.status)
      && (!rows.has(position.id) || (socketVersions.get(position.id) ?? 0) > startedAtVersion)) {
      // A newer socket result wins over a REST request started before that event.
      rows.set(position.id, position);
    }
  }
  return [...rows.values()];
}

function reconcileActivePositions(snapshot: BinaryPosition[], previous: BinaryPosition[], knownTerminalIds: Set<string>, socketVersions: Map<string, number>, startedAtVersion: number) {
  const rows = new Map(snapshot.filter((position) => !knownTerminalIds.has(position.id)).map((position) => [position.id, position]));
  for (const position of previous) {
    if (!knownTerminalIds.has(position.id) && (socketVersions.get(position.id) ?? 0) > startedAtVersion) {
      rows.set(position.id, position);
    }
  }
  return [...rows.values()];
}

type OptionWalletBalance =
  | { state: 'UNAUTHENTICATED' | 'LOADING' | 'UNSUPPORTED' | 'MISSING_ACCOUNT' | 'ERROR' }
  | { state: 'ZERO' | 'POSITIVE'; available: string };

function optionWalletBalanceLabel(balance: OptionWalletBalance): string {
  if (balance.state === 'UNAUTHENTICATED') return 'Sign in to trade';
  if (balance.state === 'LOADING') return 'Loading…';
  if (balance.state === 'UNSUPPORTED') return 'Unavailable for this account';
  if (balance.state === 'MISSING_ACCOUNT') return 'Options account not opened';
  if (balance.state === 'ERROR') return 'Balance request failed';
  if (balance.state === 'ZERO' || balance.state === 'POSITIVE') {
    return balance.state === 'ZERO'
      ? balance.available + ' USDT · no available funds'
      : balance.available + ' USDT available';
  }
  return 'Balance unavailable';
}

function readOptionWalletBalance(payload: unknown): OptionWalletBalance {
  if (!payload || typeof payload !== 'object') return { state: 'ERROR' };
  const overview = payload as { currencies?: unknown; assets?: unknown };
  const currencies = Array.isArray(overview.currencies) ? overview.currencies : [];
  if (!currencies.some((currency) => String(currency).trim().toUpperCase() === 'USDT')) return { state: 'UNSUPPORTED' };
  const assets = Array.isArray(overview.assets) ? overview.assets : [];
  const usdt = assets.find((asset) => asset && typeof asset === 'object' && String((asset as { asset?: unknown }).asset).trim().toUpperCase() === 'USDT') as { scopes?: unknown } | undefined;
  if (!usdt?.scopes || typeof usdt.scopes !== 'object') return { state: 'MISSING_ACCOUNT' };
  const options = (usdt.scopes as Record<string, unknown>).BINARY;
  if (!options || typeof options !== 'object') return { state: 'MISSING_ACCOUNT' };
  const account = options as { accountExists?: unknown; state?: unknown; available?: unknown };
  if (account.accountExists !== true) return { state: 'MISSING_ACCOUNT' };
  if (String(account.state).toUpperCase() !== 'ACTIVE') return { state: 'UNSUPPORTED' };
  if (typeof account.available !== 'string' || !/^[0-9]+([.][0-9]+)?$/.test(account.available)) return { state: 'ERROR' };
  return /^0+([.]0+)?$/.test(account.available) ? { state: 'ZERO', available: account.available } : { state: 'POSITIVE', available: account.available };
}

const FINAL_BINARY_STATES = new Set<BinaryPositionState>(['WIN', 'LOSS', 'ERROR']);
const INTERRUPTIBLE_BINARY_STATES = new Set<BinaryPositionState>(['OPEN', 'SETTLING', 'SETTLEMENT_DELAYED']);

const binaryStateLabel = (state: BinaryPositionState) => {
  if (state === 'ERROR') return 'Settlement failure';
  if (state === 'UNKNOWN') return 'Submission outcome unknown';
  return state
    .split('_')
    .map((word) => `${word.slice(0, 1)}${word.slice(1).toLowerCase()}`)
    .join(' ');
};

// Expiry ends the countdown, not the authoritative financial settlement.
// Preserve the persisted state until an authoritative WIN/LOSS outcome arrives.
const binaryPositionLabel = (position: BinaryPosition, now: number) => {
  const expiry = position.expiresAt ? Date.parse(position.expiresAt) : Number.NaN;
  if (position.status === 'OPEN' && Number.isFinite(expiry) && expiry <= now) return 'Settling';
  return binaryStateLabel(position.status);
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
  const [duration, setDuration] = useState(() => {
    const requested = Number(searchParams.get('duration'));
    return Number.isInteger(requested) && requested > 0 && requested <= 3600 ? requested : 60;
  });
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<Direction>('LONG');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const [tab, setTab] = useState<BinaryTab>('TRADE');
  const [state, setState] = useState<BinaryPositionState>('DRAFT');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [activePositions, setActivePositions] = useState<BinaryPosition[]>([]);
  const [history, setHistory] = useState<BinaryPosition[]>([]);
  const [selectedResult, setSelectedResult] = useState<BinaryPosition | null>(null);
  const [selectedChartTradeId, setSelectedChartTradeId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [unknownBinaryIntentKey, setUnknownBinaryIntentKey] = useState<string | null>(null);
  const [optionWalletBalanceResult, setOptionWalletBalanceResult] = useState<{ userId: string; balance: OptionWalletBalance } | null>(null);
  const optionWalletBalance: OptionWalletBalance = !userId
    ? { state: sessionChecked ? 'UNAUTHENTICATED' : 'LOADING' }
    : !apiBaseUrl
      ? { state: 'UNSUPPORTED' }
      : optionWalletBalanceResult?.userId === userId
        ? optionWalletBalanceResult.balance
        : { state: 'LOADING' };
  const [now, setNow] = useState(Date.now);
  const [binaryConfigurations, setBinaryConfigurations] = useState<BinaryConfiguration[]>([]);
  const [binaryDurations, setBinaryDurations] = useState<number[]>([]);
  const submissionLock = useRef(false);
  const pendingBinaryIntent = useRef<PendingIntentKey | null>(null);
  const lastSubmittedPositionId = useRef<string | null>(null);
  const terminalPositionIds = useRef<Set<string>>(new Set());
  const positionSnapshotRequest = useRef(0);
  const positionSocketRevision = useRef(0);
  const latestPositionEventRevision = useRef<Map<string, number>>(new Map());
  const chartPairRef = useRef(normalizedPair);
  const { marketPairs, metal, shares, forex } = useMarketData();

  useEffect(() => {
    setPair(initialSymbol);
    setActivePair(initialSymbol);
  }, [initialSymbol, setActivePair]);

  useEffect(() => {
    chartPairRef.current = normalizedPair;
    const requestedStake = searchParams.get('stake');
    setAmount(searchParams.get('symbol') && normalizePair(searchParams.get('symbol')!) === normalizedPair && requestedStake && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(requestedStake) && Number(requestedStake) > 0 ? requestedStake : '');
    const requestedDuration = Number(searchParams.get('duration'));
    if (Number.isInteger(requestedDuration) && requestedDuration > 0 && requestedDuration <= 3600) setDuration(requestedDuration);
    setDirection(searchParams.get('side') === 'SHORT' ? 'SHORT' : 'LONG');
    setTab('TRADE');
    setState('DRAFT');
    setConfirmationOpen(false);
    setFundingOpen(false);
    // Position collections are principal-scoped, not route-scoped. Keep the loaded
    // history when pair or funding-return query parameters change.
    setSelectedResult(null);
    setSelectedChartTradeId(null);
    setFeedback(null);
  }, [normalizedPair, searchParams]);

  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        positionSnapshotRequest.current += 1;
        positionSocketRevision.current = 0;
        latestPositionEventRevision.current.clear();
        terminalPositionIds.current.clear();
        setActivePositions([]);
        setHistory([]);
        setSelectedResult(null);
        setSelectedChartTradeId(null);
        setOptionWalletBalanceResult(null);
        setConfirmationOpen(false);
        setFundingOpen(false);
        setState('DRAFT');
        const stored = next ? readPendingEconomicIntent('binary-position', next) : null;
        pendingBinaryIntent.current = stored?.intent ?? null;
        lastSubmittedPositionId.current = null;
        setUnknownBinaryIntentKey(stored?.intent.key ?? null);
        previousUserId.current = next;
      }
      setUserId(next);
    };
    let disposed = false;
    sync();
    void recoverPublicSession().finally(() => {
      if (disposed) return;
      sync();
      setSessionChecked(true);
    });
    window.addEventListener('nexi:wallet-session', sync);
    return () => {
      disposed = true;
      window.removeEventListener('nexi:wallet-session', sync);
    };
  }, []);

  useEffect(() => {
    if (!userId || !apiBaseUrl) return;
    let cancelled = false;
    let requestId = 0;
    const refresh = () => {
      const currentRequest = ++requestId;
      api.get('/wallet/overview').then((response) => {
        if (cancelled || currentRequest !== requestId || sessionPrincipalId() !== userId) return;
        setOptionWalletBalanceResult({ userId, balance: readOptionWalletBalance(response.data) });
      }).catch((error: unknown) => {
        if (cancelled || currentRequest !== requestId || sessionPrincipalId() !== userId) return;
        const status = error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
        setOptionWalletBalanceResult({
          userId,
          balance: { state: status === 401 ? 'UNAUTHENTICATED' : 'ERROR' },
        });
      });
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    refresh();
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || !apiBaseUrl) return;
    const token = getAccessToken();
    if (!token) return;
    let disposed = false;
    const socket = io(apiBaseUrl, {
      auth: (callback) => callback({ token: getAccessToken() }),
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelayMax: 8_000,
    });
    const handleReconnect = () => {
      const snapshotRequest = ++positionSnapshotRequest.current;
      const startedAtEventRevision = positionSocketRevision.current;
      // Resnapshot even on first socket connect: REST may have completed
      // before the authenticated socket joined the user's event room.
      Promise.allSettled([
        api.get('/binary/positions/current'),
        api.get('/binary/positions/history'),
      ]).then(([currentResult, historyResult]) => {
        if (disposed || sessionPrincipalId() !== userId || snapshotRequest !== positionSnapshotRequest.current) return;
        if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
          const settled = historyResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item));
          settled.filter((item) => FINAL_BINARY_STATES.has(item.status)).forEach((item) => terminalPositionIds.current.add(item.id));
          setHistory((previous) => reconcileTerminalPositions(settled, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
        }
        if (currentResult.status === 'fulfilled' && Array.isArray(currentResult.value.data)) {
          const snapshot = currentResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item));
          setActivePositions((previous) => reconcileActivePositions(snapshot, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
        }
        // A socket reconnection may miss the original acceptance event.
        // Reconcile the persisted intent against both authoritative read models.
        const key = pendingBinaryIntent.current?.key;
        if (key) {
          const rows = [currentResult, historyResult].flatMap((result) =>
            result.status === 'fulfilled' && Array.isArray(result.value.data)
              ? result.value.data as unknown[]
              : [],
          );
          const match = rows.find((row) => row !== null && typeof row === 'object'
            && (row as Record<string, unknown>).idempotencyKey === key);
          const recovered = normalizePosition(match);
          if (recovered && pendingBinaryIntent.current?.key === key) {
            if (!FINAL_BINARY_STATES.has(recovered.status) && !terminalPositionIds.current.has(recovered.id)) lastSubmittedPositionId.current = recovered.id;
            if (!clearPendingEconomicIntent('binary-position', userId, key)) {
              setUnknownBinaryIntentKey(key);
              setFeedback('Position confirmed, but recovery storage could not be cleared. Recheck before another order.');
              return;
            }
            pendingBinaryIntent.current = null;
            setUnknownBinaryIntentKey(null);
            setState(recovered.status);
            setFeedback('The submitted position was recovered from account records.');
          }
        }
      });
    };
    const handlePositionUpdate = (raw: unknown) => {
      if (disposed || sessionPrincipalId() !== userId) return;
      const payload = raw as { event: string; position: unknown };
      const position = normalizePosition(payload.position);
      if (!position) return;
      // An older opened event cannot overturn an already observed terminal result.
      if (!FINAL_BINARY_STATES.has(position.status) && terminalPositionIds.current.has(position.id)) return;
      latestPositionEventRevision.current.set(position.id, ++positionSocketRevision.current);
      const receivedIntentKey = payload.position && typeof payload.position === 'object'
        ? (payload.position as Record<string, unknown>).idempotencyKey : null;
      if (pendingBinaryIntent.current && receivedIntentKey === pendingBinaryIntent.current.key) {
        if (!FINAL_BINARY_STATES.has(position.status)) lastSubmittedPositionId.current = position.id;
        if (clearPendingEconomicIntent('binary-position', userId, pendingBinaryIntent.current.key)) {
          pendingBinaryIntent.current = null;
          setUnknownBinaryIntentKey(null);
          setFeedback('The submitted position was confirmed by the server.');
        } else {
          setUnknownBinaryIntentKey(pendingBinaryIntent.current.key);
          setFeedback('Position confirmed, but recovery storage could not be cleared. Recheck before another order.');
        }
      }
      const isTrackedPosition = lastSubmittedPositionId.current === position.id;
      if (FINAL_BINARY_STATES.has(position.status)) {
        terminalPositionIds.current.add(position.id);
        setActivePositions((current) => current.filter((item) => item.id !== position.id));
        setHistory((current) => [position, ...current.filter((item) => item.id !== position.id)]);
        if (isTrackedPosition) {
          setSelectedResult(position);
          setSelectedChartTradeId((current) => current ?? (normalizePair(position.symbol) === chartPairRef.current ? position.id : null));
          setTab('HISTORY');
          lastSubmittedPositionId.current = null;
        }
      } else {
        setActivePositions((current) => [position, ...current.filter((item) => item.id !== position.id)]);
      }
      if (isTrackedPosition) {
        setState((current) => current === 'UNKNOWN' && pendingBinaryIntent.current ? current : position.status);
      }
    };
    const handleConnectionLoss = () => {
      if (disposed || sessionPrincipalId() !== userId) return;
      setState((current) => INTERRUPTIBLE_BINARY_STATES.has(current) ? 'CONNECTION_LOST' : current);
    };
    socket.on('connect', handleReconnect);
    socket.on('binary_position_update', handlePositionUpdate);
    socket.on('disconnect', handleConnectionLoss);
    socket.on('connect_error', handleConnectionLoss);
    return () => {
      disposed = true;
      socket.off('connect', handleReconnect);
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
    setSelectedResult(null);
    setSelectedChartTradeId(null);
    if (!userId) {
      setActivePositions([]);
      setHistory([]);
      return;
    }
    let cancelled = false;
    const snapshotRequest = ++positionSnapshotRequest.current;
    const startedAtEventRevision = positionSocketRevision.current;
    Promise.allSettled([
      api.get('/binary/positions/current'),
      api.get('/binary/positions/history'),
    ]).then(([currentResult, historyResult]) => {
      if (cancelled || sessionPrincipalId() !== userId || snapshotRequest !== positionSnapshotRequest.current) return;
      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
        const settled = historyResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item));
        settled.filter((item) => FINAL_BINARY_STATES.has(item.status)).forEach((item) => terminalPositionIds.current.add(item.id));
        setHistory((previous) => reconcileTerminalPositions(settled, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
      }
      if (currentResult.status === 'fulfilled' && Array.isArray(currentResult.value.data)) {
        const snapshot = currentResult.value.data.map(normalizePosition).filter((item): item is BinaryPosition => Boolean(item));
        setActivePositions((previous) => reconcileActivePositions(snapshot, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
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
  const sandboxChartPosition = selectBinarySandboxPosition(
    activePositions,
    history,
    selectedChartTradeId,
    normalizedPair,
  ) as BinaryPosition | null;
  const sandboxChartFeed = useMemo(
    () => binarySandboxChartFeed(sandboxChartPosition, interval),
    [sandboxChartPosition, interval],
  );

  const durationOptions = useMemo(() => {
    const configured = new Map(binaryConfigurations
      .filter((item) => normalizePair(item.pair) === normalizedPair)
      .map((item) => [item.durationSeconds, item] as const));
    return binaryDurations.filter((seconds) => configured.has(seconds)).map((seconds) => {
      const item = configured.get(seconds);
      const raw = item ? Number(item.payoutRate) : Number.NaN;
      const rate = Number.isFinite(raw) && raw > 0 ? raw : null;
      const minimumAmount = item?.minStake == null ? null : String(item.minStake);
      const maximumAmount = item?.maxStake == null ? null : String(item.maxStake);
      const validRange = decimalLessThanOrEqual(minimumAmount, maximumAmount);
      return { seconds, enabled: Boolean(item?.enabled && rate && validRange), rate, minimumAmount, maximumAmount };
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
  const minimumStake = selectedDuration?.minimumAmount ?? null;
  const maximumStake = selectedDuration?.maximumAmount ?? null;
  const stake = toPositive(amount);
  const estimatedReturn = stake !== null && payoutRate !== null ? stake * (1 + payoutRate) : null;
  const potentialReturn = estimatedReturn !== null && Number.isFinite(estimatedReturn) ? estimatedReturn : null;
  const ready = binaryOrderReady({
    authenticated: Boolean(userId),
    backendConfigured: submissionConfigured,
    optionsAccountActive: optionWalletBalance.state === 'ZERO' || optionWalletBalance.state === 'POSITIVE',
    optionsAvailableBalance: optionWalletBalance.state === 'POSITIVE' ? optionWalletBalance.available : null,
    amount,
    currentPrice,
    durationEnabled: Boolean(selectedDuration?.enabled),
    payoutRate,
    minimumAmount: minimumStake,
    maximumAmount: maximumStake,
  });
  const fundingRequired = Boolean(userId) && submissionConfigured
    && currentPrice !== null && Boolean(selectedDuration?.enabled)
    && payoutRate !== null
    && minimumStake !== null && maximumStake !== null
    && decimalLessThanOrEqual(minimumStake, amount) && decimalAmountWithinBalance(amount, maximumStake)
    && (optionWalletBalance.state === 'MISSING_ACCOUNT'
      || optionWalletBalance.state === 'ZERO'
      || (optionWalletBalance.state === 'POSITIVE' && !decimalAmountWithinBalance(amount, optionWalletBalance.available)));
  // Permit an underfunded customer to request help, never an unfunded order.
  // Insufficient positive balance must open the funding dialog, not disable both trade actions.
  const reviewReady = !unknownBinaryIntentKey && (ready || fundingRequired);
  const trackedPosition = activePositions.find((position) => position.id === lastSubmittedPositionId.current);
  const expiredOpenPosition = state === 'OPEN' && trackedPosition
    ? binaryPositionLabel(trackedPosition, now) === 'Settling'
    : false;
  const stateTone = (['WIN', 'OPEN'].includes(state) && !expiredOpenPosition)
    ? 'border-emerald-300/25 bg-emerald-400/5 text-[#98FCE4]'
    : ['LOSS', 'ERROR', 'CONNECTION_LOST'].includes(state)
      ? 'border-rose-300/25 bg-rose-400/5 text-[#FF9CB0]'
      : ['SETTLING', 'SETTLEMENT_DELAYED'].includes(state) || expiredOpenPosition
        ? 'border-[#48C0CC]/20 bg-[#48C0CC]/5 text-[#48C0CC]'
        : 'border-violet-300/20 bg-violet-400/5 text-[#CFC4FF]';
  const availabilityCopy = !submissionConfigured
    ? 'Options are unavailable right now.'
    : !sessionChecked
      ? 'Checking trading session…'
      : !userId
        ? 'Sign in to trade using the wallet control above.'
      : optionWalletBalance.state === 'MISSING_ACCOUNT'
        ? 'Options account is not open yet. Use Wallet → Transfer to open or fund Options before trading.'
        : optionWalletBalance.state === 'UNSUPPORTED'
          ? 'Options is not available for this currency or account.'
        : optionWalletBalance.state === 'ERROR'
          ? 'Options wallet availability could not be checked. Try again before trading.'
          : optionWalletBalance.state === 'LOADING' || optionWalletBalance.state === 'UNAUTHENTICATED'
            ? 'Checking Options wallet availability…'
          : optionWalletBalance.state === 'ZERO'
            ? 'Options wallet has no available USDT. Use Wallet → Transfer to add funds before trading.'
          : optionWalletBalance.state === 'POSITIVE' && stake !== null && !decimalAmountWithinBalance(amount, optionWalletBalance.available)
            ? 'Stake exceeds the available Options balance.'
      : currentPrice === null
        ? 'A fresh market price is required before submission.'
        : !selectedDuration?.enabled
          ? 'The selected duration is not currently available.'
          : 'Enter a stake to review the position before submission.';

  const openReview = (nextDirection: Direction) => {
    setDirection(nextDirection);
    setFeedback(null);
    if (fundingRequired) {
      setFundingOpen(true);
      return;
    }
    if (ready) {
      setState('CONFIRMATION');
      setConfirmationOpen(true);
      return;
    }
    setState(currentPrice === null ? 'PRICE_STALE' : submissionConfigured ? 'DISABLED' : 'UNAVAILABLE');
    setFeedback(!submissionConfigured
      ? 'Options are unavailable right now.'
      : !userId
        ? 'Sign in to trade using the wallet control above.'
        : currentPrice === null
          ? 'A fresh market price is required before submission.'
          : 'Select an enabled duration and enter a valid stake.');
  };

  const reconcileUnknownSubmission = async (key: string) => {
    if (!userId) return;
    const snapshotRequest = ++positionSnapshotRequest.current;
    const startedAtEventRevision = positionSocketRevision.current;
    const [currentResult, historyResult] = await Promise.allSettled([
      api.get('/binary/positions/current'),
      api.get('/binary/positions/history'),
    ]);
    if (sessionPrincipalId() !== userId || pendingBinaryIntent.current?.key !== key || snapshotRequest !== positionSnapshotRequest.current) return;
    let recovered: BinaryPosition | null = null;
    if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value.data)) {
      const rows = historyResult.value.data as unknown[];
      const settled = rows.map(normalizePosition).filter((item): item is BinaryPosition => item !== null);
      settled.filter((item) => FINAL_BINARY_STATES.has(item.status)).forEach((item) => terminalPositionIds.current.add(item.id));
      setHistory((previous) => reconcileTerminalPositions(settled, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
      const match = rows.find((row) => row !== null && typeof row === 'object'
        && (row as Record<string, unknown>).idempotencyKey === key);
      if (match) recovered = normalizePosition(match);
    }
    if (currentResult.status === 'fulfilled' && Array.isArray(currentResult.value.data)) {
      const rows = currentResult.value.data as unknown[];
      const snapshot = rows.map(normalizePosition).filter((item): item is BinaryPosition => item !== null);
      setActivePositions((previous) => reconcileActivePositions(snapshot, previous, terminalPositionIds.current, latestPositionEventRevision.current, startedAtEventRevision));
      if (!recovered) {
        const match = rows.find((row) => row !== null && typeof row === 'object'
          && (row as Record<string, unknown>).idempotencyKey === key);
        if (match) recovered = normalizePosition(match);
      }
    }
    if (recovered) {
      const alreadySettled = terminalPositionIds.current.has(recovered.id);
      if (!alreadySettled && !FINAL_BINARY_STATES.has(recovered.status)) lastSubmittedPositionId.current = recovered.id;
      if (!clearPendingEconomicIntent('binary-position', userId, key)) {
        setUnknownBinaryIntentKey(key);
        setFeedback('Position confirmed, but recovery storage could not be cleared. Do not submit another order.');
        return;
      }
      pendingBinaryIntent.current = null;
      setUnknownBinaryIntentKey(null);
      if (FINAL_BINARY_STATES.has(recovered.status)) {
        terminalPositionIds.current.add(recovered.id);
        setSelectedResult(recovered);
        setTab('HISTORY');
        setState(recovered.status);
      } else if (!alreadySettled) {
        setState(recovered.status);
      }
      setFeedback('The submitted position was found in your account records.');
    }
  };

  useEffect(() => {
    const key = pendingBinaryIntent.current?.key;
    if (userId && key && sessionPrincipalId() === userId) void reconcileUnknownSubmission(key);
    // A restored immutable intent is read from the owned current/history models.
    // An unmatched read is inconclusive and never permits a new order.
  }, [userId]);

  const submitPosition = async () => {
    if (submissionLock.current || !ready || !userId || unknownBinaryIntentKey) return;
    submissionLock.current = true;
    setState('SUBMITTING');
    let submittedKey: string | null = null;
    try {
      const intent = { pair: normalizedPair, stake: String(amount), side: direction === 'LONG' ? 'CALL' : 'PUT', durationSeconds: duration };
      pendingBinaryIntent.current = getIntentKey(pendingBinaryIntent.current, JSON.stringify([userId, intent]), 'binary');
      submittedKey = pendingBinaryIntent.current.key;
      if (!persistPendingEconomicIntent('binary-position', {
        principal: userId,
        intent: { key: submittedKey, fingerprint: 'redacted' },
        context: {},
      })) {
        const existing = readPendingEconomicIntent('binary-position', userId);
        pendingBinaryIntent.current = existing?.intent ?? null;
        setUnknownBinaryIntentKey(existing?.intent.key ?? 'unresolved');
        setState('UNKNOWN');
        setFeedback('An earlier position may be unresolved, or recovery storage is unavailable. No new order was submitted.');
        return;
      }
      const response = await api.post('/binary/position', {
        pair: normalizedPair,
        stake: String(amount),
        side: direction === 'LONG' ? 'CALL' : 'PUT',
        durationSeconds: duration,
        idempotencyKey: pendingBinaryIntent.current.key,
      });
      const position = normalizePosition(response.data);
      if (sessionPrincipalId() !== userId) return;
      if (!position || !response.data || (response.data as { idempotencyKey?: unknown }).idempotencyKey !== submittedKey) {
        setUnknownBinaryIntentKey(submittedKey);
        setState('UNKNOWN');
        setFeedback('Options response could not confirm the original request key. Recheck account positions before another order.');
        if (submittedKey) void reconcileUnknownSubmission(submittedKey);
        return;
      }
      const alreadySettled = terminalPositionIds.current.has(position.id);
      if (!alreadySettled && !FINAL_BINARY_STATES.has(position.status)) lastSubmittedPositionId.current = position.id;
      if (!clearPendingEconomicIntent('binary-position', userId, submittedKey!)) {
        setUnknownBinaryIntentKey(submittedKey);
        setFeedback('Position accepted, but recovery storage could not be cleared. Do not submit another order.');
        return;
      }
      pendingBinaryIntent.current = null;
      setUnknownBinaryIntentKey(null);
      setConfirmationOpen(false);
      setAmount('');
      if (FINAL_BINARY_STATES.has(position.status)) {
        terminalPositionIds.current.add(position.id);
        setActivePositions((current) => current.filter((item) => item.id !== position.id));
        setHistory((current) => [position, ...current.filter((item) => item.id !== position.id)]);
        setSelectedResult(position);
        setState(position.status);
        setTab('HISTORY');
      } else if (alreadySettled) {
        // A late HTTP acknowledgement cannot reopen a position already settled by socket.
        setTab('HISTORY');
      } else {
        setActivePositions((current) => [position, ...current.filter((item) => item.id !== position.id)]);
        setState(position.status);
        setTab('ACTIVE');
      }
      setFeedback(alreadySettled || FINAL_BINARY_STATES.has(position.status)
        ? 'Position confirmed. Review the final outcome in History.'
        : 'Position request accepted.');
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      // 408, 409, 425 and 429 may follow an accepted economic request; preserve its original key.
      const rejected = [400, 401, 403, 404, 422].includes(status ?? -1);
      setConfirmationOpen(false);
      if (rejected) {
        if (submittedKey && !clearPendingEconomicIntent('binary-position', userId, submittedKey)) {
          setUnknownBinaryIntentKey(submittedKey);
          setState('UNKNOWN');
          setFeedback('Request rejected, but recovery storage could not be cleared. Keep the original intent locked.');
          return;
        }
        pendingBinaryIntent.current = null;
        setUnknownBinaryIntentKey(null);
        setState('DRAFT');
        setFeedback('The position request was rejected. Review your inputs before trying again.');
      } else if (!pendingBinaryIntent.current && submittedKey) {
        // A matching server event already confirmed this intent while its HTTP response failed.
        setFeedback('The position was confirmed by the server. Review Active trades or History.');
      } else if (!pendingBinaryIntent.current) {
        // No idempotency key was prepared, so the economic request was never dispatched.
        setState('DRAFT');
        setFeedback('The request could not be prepared. No position was submitted.');
      } else {
        const key = pendingBinaryIntent.current.key;
        setState('UNKNOWN');
        setUnknownBinaryIntentKey(key);
        setFeedback('The position outcome is unknown. Check Active trades and History before another submission.');
        if (key) void reconcileUnknownSubmission(key);
      }
    } finally {
      submissionLock.current = false;
    }
  };

  return (
    <main className="nexi-trading-page nexi-page-shell min-h-full w-full min-w-0 overflow-x-clip pb-8 text-[#F8F6FF]">
      <header className="nexi-station-header sticky top-0 z-20 flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4">
        <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
        <div className="min-w-0 flex-1"><SymbolSelector compact currentSymbol={pair} onSelect={(next) => { setPair(next); setActivePair(next); router.push(`/dashboard/binary?symbol=${next}`); }} /></div>
        {currentPrice !== null && <div className="shrink-0 text-right" aria-label="Current market price"><p className="font-mono text-sm text-[#C3BBD0]">{currentPrice.toLocaleString()}</p>{marketChange !== null && <p className={`mt-0.5 font-mono text-[10px] ${marketChange >= 0 ? 'text-[#22D3A6]' : 'text-[#FF5C7C]'}`}>{marketChange > 0 ? '+' : ''}{marketChange.toFixed(2)}% 24h</p>}</div>}
      </header>

      <div className="grid min-w-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <section className="min-w-0 space-y-4 xl:col-start-1 xl:row-start-1" aria-labelledby="binary-heading">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <h1 id="binary-heading" className="min-w-0 break-words text-[clamp(1.25rem,5.6vw,1.5rem)] font-semibold leading-[1.3]">Options</h1>
            {state !== 'DRAFT' && <span className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs ${stateTone}`}>{expiredOpenPosition ? 'Settling' : binaryStateLabel(state)}</span>}
          </div>
          <div className="nexi-station-card min-w-0 rounded-2xl p-2">
            <div className="border-b border-white/5 px-2 pb-2"><TimeframeSelector interval={interval} onChange={setInterval} /></div>
            <div className="nexi-options-chart-frame h-[clamp(22rem,110vw,32rem)] sm:h-[420px] xl:h-[500px]"><RealtimeTradingChart symbol={normalizedPair} type="binary" interval={interval} marketStatus={market?.sessionState === 'CLOSED' ? 'CLOSED' : undefined} sandboxFeed={sandboxChartFeed} showIndicatorControls={false} /></div>
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
          <div className="mt-2 grid min-w-0 grid-cols-5 gap-1.5 sm:mt-4 sm:gap-2" role="group" aria-label="Expiry duration">
            {durationOptions.map((option) => <button key={option.seconds} type="button" aria-pressed={duration === option.seconds} aria-label={`${formatDuration(option.seconds)} expiry. ${option.minimumAmount ?? 'Unknown'}–${option.maximumAmount ?? 'unknown'} USDT stake range`} disabled={!option.enabled} onClick={() => setDuration(option.seconds)} className={`nexi-interactive nexi-ripple group min-h-[64px] min-w-0 rounded-lg border px-1.5 py-2 text-center transition sm:min-h-[84px] sm:rounded-xl sm:px-2 sm:py-2.5 ${duration === option.seconds ? 'border-[#8B5CF6] bg-[linear-gradient(145deg,rgba(109,65,255,.22),rgba(26,16,36,.92))] text-white shadow-[0_0_22px_rgba(109,65,255,.14)]' : 'border-violet-300/10 bg-[#0B0711]/70 text-[#8C8299] hover:border-violet-300/25'} disabled:cursor-not-allowed disabled:opacity-55`}><span className="block text-center text-xs font-semibold uppercase tracking-[.02em] sm:tracking-[.08em]">{formatDuration(option.seconds)}</span><span className="mt-1 block font-mono text-xs text-[#F5F7FB] sm:mt-2 sm:text-base">{option.rate === null ? '—' : `${(option.rate * 100).toFixed(0)}%`}</span></button>)}
          </div>
          <p className="mt-2 min-w-0 break-words text-xs leading-5 text-[#C3BBD0]">Selected stake range: <span className="break-all font-mono text-white">{minimumStake !== null && maximumStake !== null ? `${minimumStake}–${maximumStake} USDT` : 'Unavailable'}</span></p>
          <div className="mt-2 rounded-xl border border-violet-300/10 bg-[#0B0711]/75 px-3 py-2 text-xs leading-5 text-[#AFA4BC] sm:mt-3 sm:py-2.5">{availabilityCopy}</div>
          <label className="mt-4 block text-xs text-[#C3BBD0]">Stake (USDT)
            <div className="relative mt-1"><input type="text" inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={minimumStake !== null && maximumStake !== null ? `${minimumStake}–${maximumStake}` : '0.00'} aria-describedby="binary-stake-range" className="min-h-12 w-full rounded-xl border border-violet-300/15 bg-[#0B0711] px-3 pr-14 text-right font-mono text-base outline-none focus:border-[#8B5CF6]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8299]">USDT</span></div>
            <span id="binary-stake-range" className="mt-1 block text-xs text-[#8C8299]">{minimumStake !== null && maximumStake !== null ? `Allowed range: ${minimumStake}–${maximumStake} USDT` : 'Stake range unavailable'}</span>
          </label>
          <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-xs min-[390px]:grid-cols-2">
            <div className="min-w-0"><dt className="text-[#8C8299]">Options Wallet</dt><dd className="mt-1 break-all font-mono tabular-nums" aria-live="polite">{optionWalletBalanceLabel(optionWalletBalance)}</dd></div>
            <div><dt className="text-[#8C8299]">Payout rate</dt><dd className="mt-1 font-mono">{payoutRate === null ? '—' : `${(payoutRate * 100).toFixed(0)}%`}</dd></div>
            <div className="min-w-0"><dt className="text-[#8C8299]">Estimated potential return</dt><dd className="mt-1 break-all font-mono tabular-nums">{potentialReturn === null ? '—' : `${potentialReturn.toFixed(2)} USDT`}</dd></div>
            <div><dt className="text-[#8C8299]">Duration</dt><dd className="mt-1 font-mono">{selectedDuration ? formatDuration(duration) : '—'}</dd></div>
          </dl>
          {feedback && <p role="status" className="mt-3 text-sm text-[#C3BBD0]">{feedback}</p>}
          {unknownBinaryIntentKey && <button type="button" onClick={() => void reconcileUnknownSubmission(unknownBinaryIntentKey)} className="mt-3 min-h-11 w-full rounded-lg border border-amber-300/30 px-3 text-sm font-semibold text-amber-100">Recheck position status</button>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => openReview('LONG')} disabled={!reviewReady} className="nexi-interactive nexi-ripple flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#159B78] font-semibold disabled:cursor-not-allowed disabled:bg-[#17332E] disabled:text-[#6E9188]"><ArrowUp size={16} />Long</button>
            <button type="button" onClick={() => openReview('SHORT')} disabled={!reviewReady} className="nexi-interactive nexi-ripple flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D9465F] font-semibold disabled:cursor-not-allowed disabled:bg-[#3A1D25] disabled:text-[#99707A]"><ArrowDown size={16} />Short</button>
          </div>
          {fundingRequired && optionWalletBalance.state === 'POSITIVE' && <button type="button" onClick={() => setFundingOpen(true)} className="mt-3 min-h-11 w-full rounded-xl border border-violet-300/20 text-sm font-semibold text-[#CFC4FF]">Add funds</button>}
        </aside>

        <section className="nexi-station-card min-w-0 rounded-2xl xl:col-start-1 xl:row-start-2" aria-label="Binary activity">
          <div className="grid grid-cols-3 border-b border-white/5" role="tablist">
            {([['TRADE', 'Trade'], ['ACTIVE', 'Active trades'], ['HISTORY', 'History']] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`nexi-interactive min-h-12 min-w-0 px-1 text-xs sm:px-2 sm:text-sm ${tab === value ? 'border-b-2 border-[#8B5CF6] text-white' : 'text-[#8C8299]'}`}>{label}</button>)}
          </div>
          {tab === 'ACTIVE' && <PositionList positions={activePositions} now={now} empty="No active options positions are available." onSelect={(position) => { setSelectedChartTradeId(position.id); setSelectedResult(position); }} />}
          {tab === 'HISTORY' && <PositionList positions={history} now={now} empty="Position history is unavailable." onSelect={(position) => { setSelectedChartTradeId(position.id); setSelectedResult(position); }} />}
        </section>
      </div>

      {fundingOpen && <ModalSurface open onClose={() => setFundingOpen(false)} title="Open or fund Options">
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-5">
          <h2 className="text-xl font-semibold">Open or fund Options</h2>
          <p className="mt-2 text-sm text-[#C3BBD0]">{optionWalletBalance.state === 'MISSING_ACCOUNT' ? 'Your Options account is not open yet.' : `Your stake is ${amount} USDT, but only ${optionWalletBalance.state === 'ZERO' || optionWalletBalance.state === 'POSITIVE' ? optionWalletBalance.available : '0'} USDT is available in Options.`}</p>
          <p className="mt-2 text-sm text-[#8C8299]">Transfer funds from Funding or deposit into your NEXI Wallet. No trade has been submitted.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setFundingOpen(false)} className="min-h-12 rounded-xl border border-violet-300/15">Not now</button>
            <button type="button" onClick={() => {
              setFundingOpen(false);
              const params = new URLSearchParams({ from: 'options', symbol: normalizedPair, stake: amount, duration: String(duration), side: direction });
              router.push(`/dashboard/wallet?${params.toString()}`);
            }} className="min-h-12 rounded-xl bg-[#7C3AED] font-semibold">Open Wallet</button>
          </div>
        </div>
      </ModalSurface>}

      {confirmationOpen && <ModalSurface open onClose={() => setConfirmationOpen(false)} title="Review Options position">
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-5">
          <h2 id="binary-confirm-heading" className="text-xl font-semibold">Confirm {direction} position</h2>
          <p className="mt-1 text-sm text-[#8C8299]">{direction === 'LONG' ? 'Higher' : 'Lower'} at expiry.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Pair" value={displayPair} /><Row label="Stake" value={`${amount} USDT`} /><Row label="Duration" value={`${duration}s`} />{currentPrice !== null && <Row label="Reference price" value={String(currentPrice)} />}<Row label="Potential return" value={potentialReturn === null ? '—' : `${potentialReturn.toFixed(2)} USDT`} />
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setConfirmationOpen(false); setState('DRAFT'); }} className="min-h-12 rounded-xl border border-violet-300/15">Back</button><button type="button" onClick={submitPosition} disabled={state === 'SUBMITTING'} className="min-h-12 rounded-xl bg-[#7C3AED] font-semibold disabled:opacity-50">{state === 'SUBMITTING' ? 'Submitting…' : 'Confirm'}</button></div>
        </div>
      </ModalSurface>}

      {selectedResult && <ResultDialog position={selectedResult} now={now} onClose={() => setSelectedResult(null)} />}
    </main>
  );
}

function PositionList({ positions, now, empty, onSelect }: { positions: BinaryPosition[]; now: number; empty: string; onSelect: (position: BinaryPosition) => void }) {
  if (positions.length === 0) return <div className="flex min-h-44 items-center justify-center p-6 text-center text-sm text-[#8C8299]">{empty}</div>;
  return <ul className="divide-y divide-white/5">{positions.map((position) => {
    const openedAt = position.openedAt ? Date.parse(position.openedAt) : Number.NaN;
    const expiresAt = position.expiresAt ? Date.parse(position.expiresAt) : Number.NaN;
    const terminal = FINAL_BINARY_STATES.has(position.status);
    const durationMs = Number.isFinite(openedAt) && Number.isFinite(expiresAt) ? Math.max(0, expiresAt - openedAt) : 0;
    const remaining = !terminal && Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - now) / 1_000)) : null;
    const progress = !terminal && durationMs > 0 ? Math.min(100, Math.max(0, ((now - openedAt) / durationMs) * 100)) : null;
    return <li key={position.id}><button type="button" onClick={() => onSelect(position)} className="nexi-interactive block min-h-20 w-full px-4 py-3 text-left hover:bg-white/[.03]">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><p className="truncate font-semibold">{position.symbol} · {position.direction}</p><p className="mt-1 text-xs text-[#8C8299]">{binaryPositionLabel(position, now)}</p></div>
        <div className="text-right font-mono text-xs"><p>{position.amount === null ? '—' : `${position.amount} USDT`}</p>{!terminal && <p role="timer" aria-live="off" aria-label={remaining === null ? "Position expiry unavailable" : remaining === 0 ? "Expiry reached; result pending" : `${remaining} seconds remaining`} className="mt-1 flex items-center justify-end gap-1 text-[#8C8299]"><Clock3 size={12} aria-hidden="true" />{remaining === null ? '—' : remaining === 0 ? 'Result pending' : `${remaining}s`}</p>}</div>
      </div>
      {progress !== null && <div role="progressbar" aria-label="Position duration elapsed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-[#7C3AED] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>}
    </button></li>;
  })}</ul>;
}

function ResultDialog({ position, now, onClose }: { position: BinaryPosition; now: number; onClose: () => void }) {
  const publicResult = ['WIN', 'LOSS'].includes(position.status);
  const resultTone = position.status === 'WIN'
    ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
    : position.status === 'LOSS'
      ? 'border-rose-300/25 bg-rose-300/10 text-rose-100'
      : 'border-violet-300/20 bg-violet-300/10 text-violet-100';
  return <ModalSurface open onClose={onClose} title="Options result">
    <div className="max-h-[min(calc(100dvh-2rem),34rem)] w-[min(100%,22rem)] overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#100A18] p-4 shadow-2xl sm:p-5">
      <div className={`rounded-xl border p-3 ${resultTone}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[.16em]">{publicResult ? 'Trade settled' : 'Trade status'}</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="binary-result-heading" className="text-lg font-semibold leading-tight">{binaryPositionLabel(position, now)}</h2>
          <p className="font-mono text-sm tabular-nums">{position.symbol} · {position.direction}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-violet-300/10 bg-[#0B0711] p-3 text-sm min-[430px]:grid-cols-2">
        <SummaryValue label="Stake" value={position.amount === null ? '—' : `${position.amount} USDT`} />
        <SummaryValue label="Duration" value={position.duration === null ? '—' : `${position.duration}s`} />
        <SummaryValue label="Realized P/L" value={position.realizedProfit === null ? '—' : `${position.realizedProfit} USDT`} />
        <SummaryValue label="Payout" value={position.payout === null ? '—' : `${position.payout} USDT`} />
      </dl>
      <details className="mt-3 rounded-xl border border-violet-300/10 bg-[#0B0711] px-3 py-2">
        <summary className="min-h-9 cursor-pointer py-1 text-sm font-medium text-[#C3BBD0]">Trade details</summary>
        <dl className="space-y-2 pb-2 pt-1 text-xs">
          <Row label="Entry price" value={position.entryPrice === null ? '—' : String(position.entryPrice)} />
          <Row label="Result price" value={position.closePrice === null ? '—' : String(position.closePrice)} />
          <Row label="Opened / expiry" value={`${position.openedAt ?? '—'} / ${position.expiresAt ?? '—'}`} />
          <Row label="Settlement" value={binaryPositionLabel(position, now)} />
          <Row label="Reference ID" value={position.referenceId ?? '—'} />
        </dl>
      </details>
      <button type="button" onClick={onClose} className="mt-3 min-h-11 w-full rounded-xl bg-[#7C3AED] font-semibold">Done</button>
    </div>
  </ModalSurface>;
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-[#8C8299]">{label}</dt><dd className="mt-1 break-words font-mono text-sm tabular-nums">{value}</dd></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 justify-between gap-4"><dt className="text-[#8C8299]">{label}</dt><dd className="min-w-0 break-words text-right font-mono">{value}</dd></div>;
}
