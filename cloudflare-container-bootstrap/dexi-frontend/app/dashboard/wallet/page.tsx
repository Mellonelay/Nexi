'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Clock3, History, RefreshCw, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { authoritativeValue } from '../../lib/product-states';
import { ASSET_REGISTRY, findAsset, type AssetCategory } from '../../lib/asset-registry';
import AssetIcon from '../../components/AssetIcon';
import WalletConnectControl from '../../components/WalletConnectControl';
import DepositModal from './components/DepositModal';
import TransferModal from './components/TransferModal';
import WithdrawModal from './components/WithdrawModal';
import ConvertModal from './components/ConvertModal';
import { DataStatePanel, Metric, PageShell, Panel, PanelHeading, SecondaryButton, StatusBadge, TabButton } from './components/ProductPrimitives';
import WalletDashboardLayout from './components/WalletDashboardLayout';

type Tab = 'Overview' | 'Funding' | 'Spot' | 'Margin' | 'Binary' | 'Finance';
type Action = 'Deposit' | 'Withdraw' | 'Transfer' | 'Convert';
type Category = 'All' | AssetCategory;
type WalletAsset = { name: string; available: unknown; locked: unknown; total: unknown };
type Activity = { id: string; type: unknown; source: unknown; destination: unknown; asset: unknown; amount: unknown; status: unknown; createdAt: unknown; completedAt: unknown; productId: unknown; txHash: unknown; ledgerId: unknown };

const tabs: Tab[] = ['Overview', 'Funding', 'Spot', 'Margin', 'Binary', 'Finance'];
const categories: Category[] = ['All', 'Crypto', 'Stocks', 'Metals', 'Forex'];
const accountLabels: Record<Exclude<Tab, 'Overview'>, string> = { Funding: 'Funding', Spot: 'Spot', Margin: 'Margin', Binary: 'Binary', Finance: 'Finance' };
const actionIcons: Record<Action, typeof ArrowDownToLine> = { Deposit: ArrowDownToLine, Withdraw: ArrowUpFromLine, Transfer: ArrowLeftRight, Convert: RefreshCw };

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function text(value: unknown): string { return authoritativeValue(value); }

function readAssets(payload: unknown): WalletAsset[] {
  const root = record(payload);
  // The authoritative wallet route currently returns the legacy flat asset
  // map. Prefer the canonical `balances` envelope when available, while
  // keeping the overview truthful during contract transition.
  const source = record(root.balances ?? payload);
  return Object.entries(source).flatMap(([name, value]) => {
    const item = record(value);
    const available = typeof value === 'number' || typeof value === 'string' ? value : item.available;
    const locked = item.locked;
    const total = item.total;
    if ([available, locked, total].every((value) => text(value) === '—')) return [];
    return [{ name, available, locked, total }];
  });
}

function isActivityIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function readActivities(payload: unknown): Activity[] {
  const root = record(payload);
  const source = Array.isArray(payload) ? payload : root.activities;
  if (!Array.isArray(source)) throw new Error('Wallet activity collection is unavailable.');
  const activities = source.flatMap((value) => {
    const item = record(value);
    const id = item.activityId ?? item.id;
    const ledgerId = item.ledgerTransactionId ?? item.ledgerId ?? item.ledgerCorrelationId ?? item.ledgerPostingId;
    if (!isActivityIdentifier(id)) return [];
    if (!isActivityIdentifier(ledgerId)) return [];
    return [{ id, ledgerId, type: item.type, source: item.sourceAccount, destination: item.destinationAccount, asset: item.asset, amount: item.amount, status: item.status, createdAt: item.createdAt, completedAt: item.completedAt, productId: item.productId, txHash: item.blockchainTransactionHash }];
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

function WalletActivityHistory({ state, activities }: { state: ReadState; activities: Activity[] }) {
  return <div id="wallet-activity"><Panel className="p-3 sm:p-4"><PanelHeading title="Activity History" action={<History size={18} className="text-[#8C8299]" />} />{state !== 'LIVE' ? <DataStatePanel state={state} title="Activity authority unavailable" message="Activity details could not be loaded yet. Refresh to try again." /> : activities.length === 0 ? <DataStatePanel state="EMPTY" title="No wallet activity yet" message="Ledger-backed wallet activity will appear here when it is available." /> : <div className="divide-y divide-[#2B2037] overflow-hidden rounded-xl border border-[#2B2037]">{activities.map((item) => <article key={item.id} className="grid gap-2 bg-[#171022] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{text(item.type)} · {text(item.asset)}</p><StatusBadge state={text(item.status)} /></div><p className="mt-1 truncate text-xs text-[#8C8299]">{text(item.createdAt)} · Activity {item.id} · Ledger {text(item.ledgerId)}</p></div><div className="flex gap-4 text-xs text-[#C3BBD0] sm:text-right"><span>Amount <strong className="font-mono">{text(item.amount)}</strong></span><span className="hidden sm:inline">{text(item.source)}{text(item.destination) !== '—' ? ` → ${text(item.destination)}` : ''}</span></div></article>)}</div>}</Panel></div>;
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
    const [walletResult, activityResult] = await loadWalletData('/wallet/me', '/wallet/activity');
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

function WalletSummary({ root, state }: { root: Record<string, unknown>; state: ReadState }) {
  return <section aria-label="Total assets and portfolio summary">
        <Panel className="overflow-hidden p-3 sm:p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C3BBD0] sm:text-xs"><WalletCards size={16} className="shrink-0 text-[#48C0CC]" /> Total assets</div>
              <p className="mt-1.5 truncate font-mono text-[1.75rem] font-semibold leading-none tabular-nums sm:mt-2 sm:text-3xl">{walletMetricValue(state, root.total)}</p>
              <p className="mt-1.5 text-[10px] leading-4 text-[#8C8299] sm:text-xs">Current wallet value.</p>
            </div>
            {state !== 'LIVE' && <StatusBadge state={state} />}
          </div>
          <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
            <Metric label="Available" value={walletMetricValue(state, root.available)} />
            <Metric label="Locked / in orders" value={walletMetricValue(state, root.locked)} />
          </div>
          <WalletPerformance root={root} state={state} />
        </Panel>
      </section>;
}

function assetLabel(asset: ReturnType<typeof assetMeta>, key: 'id' | 'symbol' | 'displaySymbol' | 'name', fallback: string) {
  return asset?.[key] ?? fallback;
}

function WalletAssetRow({ item }: { item: WalletAsset }) {
  const asset = assetMeta(item.name); const iconItem = { assetId: assetLabel(asset, 'id', item.name), symbol: assetLabel(asset, 'symbol', item.name), displaySymbol: assetLabel(asset, 'displaySymbol', item.name), name: assetLabel(asset, 'name', item.name) }; return <div key={item.name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] items-center gap-3 bg-[#171022] px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:px-4"><div className="flex min-w-0 items-center gap-2"><AssetIcon item={iconItem} /><span className="min-w-0"><span className="block truncate text-xs font-semibold sm:text-sm">{assetLabel(asset, 'name', item.name)}</span><span className="block truncate text-[10px] text-[#8C8299] sm:text-xs">{assetLabel(asset, 'displaySymbol', item.name)}</span></span></div><span className="truncate text-right font-mono text-xs tabular-nums">{text(item.available)}</span><span className="hidden truncate text-right font-mono text-xs tabular-nums sm:block">{text(item.locked)}</span><span className="truncate text-right font-mono text-xs font-semibold tabular-nums">{text(item.total)}</span></div>;
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

function accountSummary(accounts: Record<string, unknown>, name: Exclude<Tab, 'Overview'>) {
  const item = record(accounts[accountLabels[name]] ?? accounts[name.toUpperCase()]); return { available: item.available, locked: item.locked, total: item.total, state: item.status ?? (Object.keys(item).length ? 'LIVE' : 'UNAVAILABLE') };
}

function WalletAccountPanel({ tab, accountPayload, accounts }: { tab: Tab; accountPayload: unknown; accounts: Record<string, unknown> }) {
  if (tab === 'Overview') return null;
  return <Panel className="p-4"><PanelHeading title={`${tab} account`} description={tab === 'Finance' ? 'This projection is not available for this account yet.' : 'Account values appear when they are available.'} />{tab === 'Finance' && !Object.keys(record(accountPayload)).length ? <DataStatePanel state="UNAVAILABLE" title={`${tab} account unavailable`} message="Balance and activity are not available for this account yet." /> : <div className="grid gap-3 sm:grid-cols-3">{(['available', 'locked', 'total'] as const).map((key) => <Metric key={key} label={key} value={text(accountSummary(accounts, tab)[key])} />)}</div>}</Panel>;
}

function WalletAssets({ tab, category, onCategoryChange, state, userId, error, visibleAssets }: { tab: Tab; category: Category; onCategoryChange: (category: Category) => void; state: ReadState; userId: string | null; error: string; visibleAssets: WalletAsset[] }) {
  return <Panel className="p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-3"><PanelHeading title={tab === 'Overview' ? 'All account assets' : `${tab} assets`} description="Available, reserved and total amounts for this wallet." /><label className="shrink-0 text-xs text-[#C3BBD0]">Asset filter <select aria-label="Asset category" value={category} onChange={(event) => onCategoryChange(event.target.value as Category)} className="nexi-input ml-2 min-h-[44px] px-2 text-xs"><option>All</option><option>Crypto</option><option>Stocks</option><option>Metals</option><option>Forex</option></select></label></div>{state !== 'LIVE' ? <DataStatePanel state={state} title={userId ? 'Wallet data unavailable' : 'Wallet is locked'} message={error || 'No authenticated wallet session is available.'} /> : visibleAssets.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No asset data for this filter" message="No matching wallet assets are available right now." /> : <div className="overflow-hidden rounded-xl border border-[#2B2037]"><div className="grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] gap-3 bg-[#171022] px-3 py-2 text-[9px] uppercase tracking-[0.08em] text-[#8C8299] sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:px-4 sm:text-[10px] sm:tracking-[0.12em]"><span>Asset</span><span className="text-right">Available</span><span className="hidden text-right sm:block">Locked</span><span className="text-right">Total</span></div><div className="divide-y divide-[#2B2037]">{visibleAssets.map((item) => <WalletAssetRow key={item.name} item={item} />)}</div></div>}</Panel>;
}

export default function WalletPage() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [category, setCategory] = useState<Category>('All');
  const { userId, sessionChecked, state, payload, activities, activityState, error, loadWallet } = useWalletAuthority();
  const [action, setAction] = useState<Action | null>(null);
  const [currency, setCurrency] = useState('');

  const root = record(payload);
  const accounts = record(root.accounts);
  const accountPayload = tab === 'Overview' ? payload : accounts[accountLabels[tab]] ?? accounts[tab.toUpperCase()];
  const assets = useMemo(() => readAssets(accountPayload), [accountPayload]);
  const visibleAssets = useMemo(() => assets.filter((item) => category === 'All' || assetMeta(item.name)?.category === category), [assets, category]);
  const authenticated = Boolean(userId);
  const currencies = useMemo(() => assets.map((asset) => ({ symbol: asset.name })), [assets]);

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
      <WalletSummary root={root} state={state} />
      <WalletActions authenticated={authenticated} state={state} action={action} onSelect={selectAction} />
      <WalletAccountTabs tab={tab} onTabChange={setTab} />
      <section className="min-w-0"><div className="min-w-0 space-y-3">
        <WalletAccountPanel tab={tab} accountPayload={accountPayload} accounts={accounts} />
        <WalletAssets tab={tab} category={category} onCategoryChange={setCategory} state={state} userId={userId} error={error} visibleAssets={visibleAssets} />
        <WalletActivityHistory state={activityState} activities={activities} />
      </div></section>
      <DepositModal isOpen={action === 'Deposit'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <WithdrawModal isOpen={action === 'Withdraw'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <TransferModal isOpen={action === 'Transfer'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <ConvertModal isOpen={action === 'Convert'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onCompleted={loadWallet} />
    </WalletDashboardLayout>
  </PageShell>;
}
