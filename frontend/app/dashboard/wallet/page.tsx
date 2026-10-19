'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Clock3, History, RefreshCw, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { useMarketData } from '../../hooks/useMarketData';
import { authoritativeValue } from '../../lib/product-states';
import { ASSET_REGISTRY, findAsset, type AssetCategory } from '../../lib/asset-registry';
import AssetIcon from '../../components/AssetIcon';
import WalletConnectControl from '../../components/WalletConnectControl';
import DepositModal from './components/DepositModal';
import TransferModal from './components/TransferModal';
import WithdrawModal from './components/WithdrawModal';
import ConvertModal from './components/ConvertModal';
import { DataStatePanel, Metric, PageShell, Panel, PanelHeading, SecondaryButton, StatusBadge, TabButton } from '../../components/PagePrimitives';
import WalletDashboardLayout from './components/WalletDashboardLayout';

type Tab = 'Overview' | 'Funding' | 'Spot' | 'Margin' | 'Binary' | 'Finance';
type Action = 'Deposit' | 'Withdraw' | 'Transfer' | 'Convert';
type Category = 'All' | AssetCategory;
type WalletAsset = { name: string; available: unknown; locked: unknown; total: unknown };
type Activity = { id: string; type: unknown; source: unknown; destination: unknown; asset: unknown; amount: unknown; status: unknown; createdAt: unknown; ledgerId: unknown; referenceType: unknown; referenceId: unknown; correlationId: unknown; details: Record<string, unknown>; postings: Array<Record<string, unknown>> };

const tabs: Tab[] = ['Overview', 'Funding', 'Spot', 'Margin', 'Binary', 'Finance'];
const categories: Category[] = ['All', 'Crypto', 'Stocks', 'Metals', 'Forex'];
const actionIcons: Record<Action, typeof ArrowDownToLine> = { Deposit: ArrowDownToLine, Withdraw: ArrowUpFromLine, Transfer: ArrowLeftRight, Convert: RefreshCw };

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function text(value: unknown): string { return authoritativeValue(value); }

function sumDecimalStrings(values: unknown[]): string {
  const parts = values.map((value) => String(value ?? '0')).map((value) => {
    const [whole = '0', fraction = ''] = value.split('.');
    return { whole: whole || '0', fraction };
  });
  const scale = Math.max(0, ...parts.map((part) => part.fraction.length));
  const total = parts.reduce((sum, part) => sum + BigInt(`${part.whole}${part.fraction.padEnd(scale, '0')}` || '0'), BigInt(0));
  const divisor = BigInt(10) ** BigInt(scale);
  const whole = total / divisor;
  const fraction = scale ? String(total % divisor).padStart(scale, '0').replace(/0+$/, '') : '';
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function readAssets(payload: unknown, selectedTab: Tab): WalletAsset[] {
  const root = record(payload);
  const source = Array.isArray(root.assets) ? root.assets : [];
  const targetScope = selectedTab === 'Overview' ? null : selectedTab === 'Funding' ? 'MAIN' : selectedTab === 'Binary' ? 'BINARY' : selectedTab.toUpperCase();
  return source.flatMap((value) => {
    const asset = record(value);
    const scopes = record(asset.scopes);
    const balances = (targetScope ? [scopes[targetScope]] : Object.values(scopes)).filter(Boolean).map(record);
    if (!balances.length) return [];
    const available = sumDecimalStrings(balances.map((balance) => balance.available));
    const locked = sumDecimalStrings(balances.map((balance) => balance.locked));
    const total = sumDecimalStrings(balances.map((balance) => balance.total));
    const name = String(asset.asset ?? '');
    return name ? [{ name, available, locked, total }] : [];
  });
}

type PortfolioValuation = { available: string; locked: string; total: string; state: 'LIVE' | 'STALE' | 'UNAVAILABLE'; unpriced: number };
type WalletQuote = ReturnType<typeof useMarketData>['marketPairs'][number];

function estimatePortfolio(assets: WalletAsset[], currencies: unknown, quotes: WalletQuote[]): PortfolioValuation {
  const supported = Array.isArray(currencies) && currencies.some((value) => String(value).toUpperCase() === 'USDT');
  let available = 0; let locked = 0; let total = 0; let unpriced = 0; let stale = false;
  for (const asset of assets) {
    const nativeTotal = Number(asset.total ?? 0);
    if (!Number.isFinite(nativeTotal) || nativeTotal <= 0) continue;
    let price: number | null = null;
    if (asset.name.toUpperCase() === 'USDT' && supported) price = 1;
    else {
      const quote = quotes.find((item) => item.symbol.replaceAll('/', '').toUpperCase() === `${asset.name.toUpperCase()}USDT` || item.pair.replaceAll('/', '').toUpperCase() === `${asset.name.toUpperCase()}USDT`);
      if (quote?.dataState === 'LIVE' && quote.price !== null && Number.isFinite(quote.price) && quote.price > 0) price = quote.price;
      else if (quote?.dataState === 'STALE') stale = true;
    }
    if (price === null) { unpriced += 1; continue; }
    const availableAmount = Number(asset.available ?? 0);
    const lockedAmount = Number(asset.locked ?? 0);
    if (Number.isFinite(availableAmount)) available += availableAmount * price;
    if (Number.isFinite(lockedAmount)) locked += lockedAmount * price;
    total += nativeTotal * price;
  }
  const format = (amount: number) => `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT${unpriced ? ` · ${unpriced} unpriced` : ''}`;
  return { available: format(available), locked: format(locked), total: format(total), state: unpriced === 0 ? 'LIVE' : stale ? 'STALE' : 'UNAVAILABLE', unpriced };
}

function isActivityIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readActivityDetails(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try { return record(JSON.parse(value)); } catch { return {}; }
  }
  return record(value);
}

function readActivities(payload: unknown): Activity[] {
  const root = record(payload);
  const source = Array.isArray(payload) ? payload : root.activities;
  if (!Array.isArray(source)) throw new Error('Wallet activity collection is unavailable.');
  const activities = source.flatMap((value) => {
    const item = record(value);
    const details = readActivityDetails(item.details);
    const postings = Array.isArray(item.relatedLedgerPostings) ? item.relatedLedgerPostings.map(record) : [];
    const id = item.activityId ?? item.id;
    const ledgerId = item.ledgerTransactionId ?? item.ledgerId ?? item.ledgerCorrelationId ?? item.ledgerCorrelationId ?? item.ledgerPostingId ?? details.debitPostingId ?? postings[0]?.id;
    if (!isActivityIdentifier(id) || !isActivityIdentifier(ledgerId)) return [];
    return [{
      id, ledgerId, type: item.type, asset: item.asset, amount: item.amount, status: item.status, createdAt: item.createdAt,
      source: item.sourceAccount ?? details.sourceScope ?? details.fromScope ?? details.fromUserId,
      destination: item.destinationAccount ?? details.destinationScope ?? details.toScope ?? details.toUserId,
      referenceType: item.referenceType, referenceId: item.referenceId, correlationId: item.ledgerCorrelationId,
      details, postings,
    }];
  });
  if (activities.length !== source.length) throw new Error('Wallet activity ledger identity is unavailable.');
  return activities;
}

type ReadState = 'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR';
type AuthorityResult<T> = { state: 'LIVE'; data: T } | { state: 'ERROR'; data: null };

async function readAuthority<T>(endpoint: string, parse: (data: unknown) => T): Promise<AuthorityResult<T>> {
  try {
    const response = await api.get(endpoint);
    return { state: 'LIVE', data: parse(response.data) };
  } catch {
    return { state: 'ERROR', data: null };
  }
}

function loadWalletData(walletEndpoint: string, activityEndpoint: string) {
  // Each reader owns its failure: activity cannot revoke successful balances.
  return Promise.all([
    readAuthority(walletEndpoint, (data) => data),
    readAuthority(activityEndpoint, readActivities),
  ]);
}

function assetMeta(name: string) { return findAsset(name) ?? ASSET_REGISTRY.find((asset) => asset.symbol.toLowerCase() === name.toLowerCase()); }

function activityTypeLabel(value: unknown) {
  const type = String(value ?? '').toUpperCase();
  if (type.includes('WALLET_ACCOUNT_TRANSFER') || type.includes('INTERNAL_TRANSFER')) return 'Wallet transfer';
  return type ? type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Financial activity';
}

function WalletActivityHistory({ state, activities }: { state: ReadState; activities: Activity[] }) {
  return <div id="wallet-activity"><Panel className="p-3 sm:p-4"><PanelHeading title="Activity History" action={<History size={18} className="text-[#8C8299]" />} />{state !== 'LIVE' ? <DataStatePanel state={state} title="Activity authority unavailable" message="Activity details could not be loaded yet. Refresh to try again." /> : activities.length === 0 ? <DataStatePanel state="EMPTY" title="No wallet activity yet" message="Ledger-backed wallet activity will appear here when it is available." /> : <div className="divide-y divide-[#2B2037] overflow-hidden rounded-xl border border-[#2B2037]">{activities.map((item) => <article key={item.id} className="bg-[#171022] p-3"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{activityTypeLabel(item.type)} · {text(item.asset)}</p><StatusBadge state={text(item.status)} /></div><p className="mt-1 truncate text-xs text-[#8C8299]">{text(item.createdAt)} · Activity {item.id} · Ledger {text(item.ledgerId)}</p></div><div className="flex gap-4 text-xs text-[#C3BBD0] sm:text-right"><span>Amount <strong className="font-mono">{text(item.amount)}</strong></span><span>{text(item.source)}{text(item.destination) !== '—' ? ` → ${text(item.destination)}` : ''}</span></div></div><details className="mt-2 rounded-lg border border-violet-300/10 px-3 py-2 text-xs"><summary className="min-h-7 cursor-pointer text-[#C3BBD0]">Accounting details · {item.postings.length} ledger posting{item.postings.length === 1 ? '' : 's'}</summary><div className="mt-2 space-y-2"><p className="break-all text-[#8C8299]">Reference {text(item.referenceType)} · {text(item.referenceId)} · Correlation {text(item.correlationId)}</p>{Object.keys(item.details).length > 0 && <p className="break-all text-[#8C8299]">{Object.entries(item.details).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join(' · ')}</p>}{item.postings.map((posting, index) => <div key={String(posting.id ?? index)} className="grid gap-x-3 gap-y-1 rounded-md bg-[#0B0711] p-2 sm:grid-cols-2"><span>Posting {text(posting.id)} · {text(posting.scope)} · {text(posting.kind)}</span><span>Amount {text(posting.amount)} {text(posting.asset)}</span><span>Available Δ {text(posting.availableDelta)}</span><span>Locked Δ {text(posting.lockedDelta)}</span></div>)}</div></details></article>)}</div>}</Panel></div>;
}

function useWalletSession(onPrincipalChange: (next: string | null) => void) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        onPrincipalChange(next);
        previousUserId.current = next;
      }
      setUserId(next);
      setSessionChecked(true);
    };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, [onPrincipalChange]);

  return { userId, sessionChecked };
}

function useWalletAuthority() {
  const [state, setState] = useState<ReadState>('LOADING');
  const [payload, setPayload] = useState<unknown>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityState, setActivityState] = useState<ReadState>('LOADING');
  const [error, setError] = useState('');


  const reset = useCallback((next: string | null) => {
        setPayload(null);
        setActivities([]);
        setState(next ? 'LOADING' : 'UNAVAILABLE');
        setActivityState(next ? 'LOADING' : 'UNAVAILABLE');
        setError(next ? '' : 'Connect and verify a wallet to load private wallet data.');
  }, []);
  const { userId, sessionChecked } = useWalletSession(reset);

  const loadWallet = useCallback(async () => {
    if (!sessionChecked || !userId) return;
    setState('LOADING'); setActivityState('LOADING');
    const [walletResult, activityResult] = await loadWalletData('/wallet/overview', '/wallet/activity');
    if (sessionPrincipalId() !== userId) return;
    setPayload(walletResult.data);
    setState(walletResult.state);
    setError(walletResult.state === 'ERROR' ? 'Wallet data could not be loaded. Refresh to try again.' : '');
    setActivities(activityResult.data ?? []);
    setActivityState(activityResult.state);
  }, [sessionChecked, userId]);
  useEffect(() => { void loadWallet(); }, [loadWallet]);

  return { userId, sessionChecked, state, payload, activities, activityState, error, loadWallet };
}

function walletMetricValue(state: ReadState, value: unknown) {
  return state === 'LIVE' ? text(value) : 'UNAVAILABLE';
}

function performanceValue(state: ReadState, value: unknown, percent: unknown) {
  if (state !== 'LIVE') return 'UNAVAILABLE';
  const suffix = percent !== undefined ? ` · ${text(percent)}` : '';
  return `${text(value)}${suffix}`;
}

function WalletPerformance({ root, state }: { root: Record<string, unknown>; state: ReadState }) {
  const metrics = [
    { label: 'P/L', value: root.pnl ?? root.profitLoss ?? root.profitAndLoss, percent: root.pnlPercent ?? root.profitLossPercent ?? root.profitAndLossPercent },
    { label: 'Total return', value: root.totalReturn ?? root.allTimeReturn, percent: root.totalReturnPercent ?? root.allTimeReturnPercent },
  ].filter((item) => item.value !== undefined);
  if (!metrics.length) return null;
  return <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 border-t border-violet-300/10 pt-2" aria-label="Portfolio performance">{metrics.map((item) => <Metric key={item.label} label={item.label} value={performanceValue(state, item.value, item.percent)} />)}</div>;
}

function WalletSummary({ root, state, valuation }: { root: Record<string, unknown>; state: ReadState; valuation: PortfolioValuation }) {
  return <section aria-label="Total assets and portfolio summary">
        <Panel className="overflow-hidden p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C3BBD0] sm:text-xs"><WalletCards size={16} className="shrink-0 text-[#48C0CC]" /> Wallet balance</div>
            {valuation.state !== 'LIVE' && <StatusBadge state={valuation.state} />}
          </div>
          <p className="mt-1 text-[10px] leading-4 text-[#8C8299]">Estimated portfolio value · USDT. Native balances remain unchanged.</p>
          <div className="mt-3 grid min-w-0 grid-cols-3 gap-2" aria-label="Estimated available, locked and total portfolio value in USDT">
            <Metric label="Available · USDT" value={state === 'LIVE' ? valuation.available : 'UNAVAILABLE'} />
            <Metric label="Locked · USDT" value={state === 'LIVE' ? valuation.locked : 'UNAVAILABLE'} />
            <Metric label="Total · USDT" value={state === 'LIVE' ? valuation.total : 'UNAVAILABLE'} />
          </div>
          <WalletPerformance root={root} state={state} />
        </Panel>
      </section>;
}

function assetLabel(asset: ReturnType<typeof assetMeta>, key: 'id' | 'symbol' | 'displaySymbol' | 'name', fallback: string) {
  return asset?.[key] ?? fallback;
}

function WalletAssetRow({ item }: { item: WalletAsset }) {
  const asset = assetMeta(item.name); const iconItem = { assetId: assetLabel(asset, 'id', item.name), symbol: assetLabel(asset, 'symbol', item.name), displaySymbol: assetLabel(asset, 'displaySymbol', item.name), name: assetLabel(asset, 'name', item.name) }; return <div key={item.name} className="grid min-w-0 grid-cols-[minmax(3rem,1fr)_repeat(3,minmax(3rem,auto))] items-center gap-1.5 bg-[#171022] px-2 py-2 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:gap-3 sm:px-4"><div className="flex min-w-0 items-center gap-2"><AssetIcon item={iconItem} /><span className="min-w-0"><span className="block truncate text-xs font-semibold sm:text-sm">{assetLabel(asset, 'name', item.name)}</span><span className="block truncate text-[10px] text-[#8C8299] sm:text-xs">{assetLabel(asset, 'displaySymbol', item.name)}</span></span></div><span className="truncate text-right font-mono text-xs tabular-nums">{text(item.available)}</span><span className="truncate text-right font-mono text-[10px] tabular-nums sm:text-xs">{text(item.locked)}</span><span className="truncate text-right font-mono text-xs font-semibold tabular-nums">{text(item.total)}</span></div>;
}

function WalletActionButton({ item, action, enabled, onSelect }: { item: Action; action: Action | null; enabled: boolean; onSelect: (action: Action) => void }) {
  const Icon = actionIcons[item];
  return <button key={item} type="button" disabled={!enabled} onClick={() => onSelect(item)} aria-label={`${item}${enabled ? '' : ' unavailable'}`} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-1 text-center text-[11px] font-semibold sm:min-h-14 sm:flex-row sm:gap-2 sm:text-xs ${action === item ? 'border-[#8B5CF6] bg-[#2A1742]' : 'border-[#2B2037] bg-[#171022]'} disabled:cursor-not-allowed disabled:opacity-50`}><Icon size={16} className="shrink-0 text-[#48C0CC]" /><span className="truncate">{item}</span></button>;
}

function WalletActions({ authenticated, state, action, onSelect }: { authenticated: boolean; state: ReadState; action: Action | null; onSelect: (action: Action) => void }) {
  const enabled = authenticated && state === 'LIVE';
  return <section aria-label="Wallet actions"><Panel className="p-3 sm:p-4"><PanelHeading title="Quick actions" description="Choose an available wallet action." /><div className="grid grid-cols-4 gap-2">{(['Deposit', 'Withdraw', 'Transfer', 'Convert'] as Action[]).map((item) => <WalletActionButton key={item} item={item} action={action} enabled={enabled} onSelect={onSelect} />)}</div><button type="button" onClick={() => document.getElementById('wallet-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#2B2037] bg-[#171022] text-xs font-semibold text-[#C3BBD0]"><Clock3 size={15} />View activity</button></Panel></section>;
}

function WalletAccountTabs({ tab, onTabChange }: { tab: Tab; onTabChange: (tab: Tab) => void }) {
  return <section aria-label="Wallet account tabs"><Panel className="p-2 sm:p-3"><div className="nexi-scroll-rail flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Wallet account tabs">{tabs.map((item) => <TabButton key={item} active={tab === item} onClick={() => onTabChange(item)}>{item === 'Binary' ? 'Options' : item}</TabButton>)}</div></Panel></section>;
}

function WalletAccountPanel({ tab }: { tab: Tab }) {
  if (tab !== 'Finance') return null;
  return <Panel className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4"><div><p className="text-sm font-semibold">Finance commitments and loans</p><p className="mt-1 text-xs text-[#8C8299]">Committed or locked funds are not available to transfer. Loan balances and repayment terms remain tied to loan records.</p></div><Link href="/dashboard/loans" className="inline-flex min-h-11 items-center rounded-lg border border-violet-300/20 px-3 text-sm font-semibold text-[#CFC4FF] hover:bg-[#2A1742]">Review loan obligations</Link></Panel>;
}

function WalletAssets({ tab, category, onCategoryChange, state, userId, error, visibleAssets }: { tab: Tab; category: Category; onCategoryChange: (category: Category) => void; state: ReadState; userId: string | null; error: string; visibleAssets: WalletAsset[] }) {
  return <Panel className="p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-3"><PanelHeading title={tab === 'Overview' ? 'All account assets' : `${tab === 'Binary' ? 'Options' : tab} assets`} /><label className="shrink-0 text-xs text-[#C3BBD0]">Asset filter <select aria-label="Asset category" value={category} onChange={(event) => onCategoryChange(event.target.value as Category)} className="nexi-input ml-2 min-h-[44px] px-2 text-xs"><option>All</option><option>Crypto</option><option>Stocks</option><option>Metals</option><option>Forex</option></select></label></div>{state !== 'LIVE' ? <DataStatePanel state={state} title={userId ? 'Wallet data unavailable' : 'Wallet is locked'} message={error || 'No authenticated wallet session is available.'} /> : visibleAssets.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No asset data for this filter" message="No matching wallet assets are available right now." /> : <div className="overflow-hidden rounded-xl border border-[#2B2037]"><div className="grid grid-cols-[minmax(3rem,1fr)_repeat(3,minmax(3rem,auto))] gap-1.5 bg-[#171022] px-2 py-2 text-[9px] uppercase tracking-[0.04em] text-[#8C8299] sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:gap-3 sm:px-4 sm:text-[10px] sm:tracking-[0.12em]"><span>Asset</span><span className="text-right">Available</span><span className="text-right">{tab === 'Finance' ? 'Committed' : 'Locked'}</span><span className="text-right">Total</span></div><div className="divide-y divide-[#2B2037]">{visibleAssets.map((item) => <WalletAssetRow key={item.name} item={item} />)}</div></div>}</Panel>;
}

export default function WalletPage() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [category, setCategory] = useState<Category>('All');
  const { userId, sessionChecked, state, payload, activities, activityState, error, loadWallet } = useWalletAuthority();
  const { marketPairs, metal, shares, forex } = useMarketData();
  const [action, setAction] = useState<Action | null>(null);
  const [currency, setCurrency] = useState('');

  const root = record(payload);
  const assets = useMemo(() => readAssets(payload, tab), [payload, tab]);
  const overviewAssets = useMemo(() => readAssets(payload, 'Overview'), [payload]);
  const valuation = useMemo(() => estimatePortfolio(overviewAssets, root.currencies, [...marketPairs, ...metal, ...shares, ...forex]), [overviewAssets, root.currencies, marketPairs, metal, shares, forex]);
  const visibleAssets = useMemo(() => assets.filter((item) => category === 'All' || assetMeta(item.name)?.category === category), [assets, category]);
  const authenticated = Boolean(userId);
  const currencies = useMemo(() => assets.map((asset) => ({ symbol: asset.name })), [assets]);
  const transferCurrencies = useMemo(() => Array.isArray(root.currencies) ? root.currencies.map((symbol) => ({ symbol: String(symbol).toUpperCase() })) : currencies, [root.currencies, currencies]);

  const selectAction = (next: Action) => {
    setAction(next);
    if (next !== 'Convert') setCurrency(currencies[0]?.symbol ?? '');
  };


  if (sessionChecked && !authenticated) {
    return <PageShell><div className="mx-auto max-w-xl pt-8 sm:pt-14"><Panel className="p-5 text-center sm:p-7"><div className="mx-auto max-w-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">Protected wallet</p><h1 className="mt-2 text-xl font-semibold text-white">Verify your Ethereum wallet</h1><p className="mt-2 text-sm leading-6 text-[#8C8299]">Market surfaces remain available without a NEXI session. Wallet balances and financial actions require wallet verification.</p><div className="mx-auto mt-5 max-w-xs"><WalletConnectControl compact /></div></div></Panel></div></PageShell>;
  }

  return <PageShell>
    <header className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 pl-14 sm:pl-0">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">Financial control center</p><h1 className="mt-1 truncate text-xl font-semibold tracking-tight gradient-text sm:text-2xl">Wallet</h1><p className="mt-1 truncate text-xs text-[#8C8299]">Wallet accounts, assets and activity.</p></div>
      <div className="flex shrink-0 items-center gap-2"><SecondaryButton onClick={() => void loadWallet()}><RefreshCw size={15} className="sm:mr-2" /><span className="sr-only sm:not-sr-only">Refresh</span></SecondaryButton></div>
    </header>
    <WalletDashboardLayout>
      <WalletSummary root={root} state={state} valuation={valuation} />
      <WalletActions authenticated={authenticated} state={state} action={action} onSelect={selectAction} />
      <WalletAccountTabs tab={tab} onTabChange={setTab} />
      <section className="min-w-0"><div className="min-w-0 space-y-3">
        <WalletAccountPanel tab={tab} />
        <WalletAssets tab={tab} category={category} onCategoryChange={setCategory} state={state} userId={userId} error={error} visibleAssets={visibleAssets} />
        <WalletActivityHistory state={activityState} activities={activities} />
      </div></section>
      <DepositModal isOpen={action === 'Deposit'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <WithdrawModal isOpen={action === 'Withdraw'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <TransferModal isOpen={action === 'Transfer'} onClose={() => setAction(null)} currencies={transferCurrencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <ConvertModal isOpen={action === 'Convert'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onCompleted={loadWallet} />
    </WalletDashboardLayout>
  </PageShell>;
}
