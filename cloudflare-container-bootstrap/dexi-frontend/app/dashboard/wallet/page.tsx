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
    if (text(available) === '—' && text(locked) === '—' && text(total) === '—') return [];
    return [{ name, available, locked, total }];
  });
}

function readActivities(payload: unknown): Activity[] {
  const root = record(payload);
  const source = Array.isArray(payload) ? payload : root.activities;
  if (!Array.isArray(source)) return [];
  return source.flatMap((value) => {
    const item = record(value);
    const id = item.activityId ?? item.id;
    const ledgerId = item.ledgerTransactionId ?? item.ledgerId ?? item.ledgerCorrelationId ?? item.ledgerPostingId;
    if (typeof id !== 'string' || !id.trim() || typeof ledgerId !== 'string' || !ledgerId.trim()) return [];
    return [{ id, ledgerId, type: item.type, source: item.sourceAccount, destination: item.destinationAccount, asset: item.asset, amount: item.amount, status: item.status, createdAt: item.createdAt, completedAt: item.completedAt, productId: item.productId, txHash: item.blockchainTransactionHash }];
  });
}

function assetMeta(name: string) { return findAsset(name) ?? ASSET_REGISTRY.find((asset) => asset.symbol.toLowerCase() === name.toLowerCase()); }

export default function WalletPage() {
  const [tab, setTab] = useState<Tab>('Overview');
  const [category, setCategory] = useState<Category>('All');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [payload, setPayload] = useState<unknown>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [currency, setCurrency] = useState('');
  const previousUserId = useRef<string | null | undefined>();

  const readEndpoint = userId ? '/wallet/me' : null;
  const activityEndpoint = userId ? '/wallet/activity' : null;
  const root = record(payload);
  const accounts = record(root.accounts);
  const accountPayload = tab === 'Overview' ? payload : accounts[accountLabels[tab]] ?? accounts[tab.toUpperCase()];
  const assets = useMemo(() => readAssets(accountPayload), [accountPayload]);
  const visibleAssets = useMemo(() => assets.filter((item) => category === 'All' || assetMeta(item.name)?.category === category), [assets, category]);
  const authenticated = Boolean(userId);
  const currencies = useMemo(() => assets.map((asset) => ({ symbol: asset.name })), [assets]);

  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        setPayload(null);
        setActivities([]);
        setState(next ? 'LOADING' : 'UNAVAILABLE');
        setError(next ? '' : 'Connect and verify a wallet to load private wallet data.');
        previousUserId.current = next;
      }
      setUserId(next);
      setSessionChecked(true);
    };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const loadWallet = useCallback(async () => {
    if (!sessionChecked || !userId) return;
    if (!readEndpoint || !activityEndpoint) { setState('UNAVAILABLE'); setError('Wallet and Activity data are unavailable right now.'); return; }
    setState('LOADING');
    try {
      const [walletResponse, activityResponse] = await Promise.all([api.get(readEndpoint), api.get(activityEndpoint)]);
      if (sessionPrincipalId() !== userId) return;
      setPayload(walletResponse.data); setActivities(readActivities(activityResponse.data)); setState('LIVE'); setError('');
    } catch { if (sessionPrincipalId() !== userId) return; setPayload(null); setActivities([]); setState('ERROR'); setError('Wallet data could not be loaded.'); }
  }, [activityEndpoint, readEndpoint, sessionChecked, userId]);
  useEffect(() => { void loadWallet(); }, [loadWallet]);

  const accountSummary = (name: Exclude<Tab, 'Overview'>) => { const item = record(accounts[accountLabels[name]] ?? accounts[name.toUpperCase()]); return { available: item.available, locked: item.locked, total: item.total, state: item.status ?? (Object.keys(item).length ? 'LIVE' : 'UNAVAILABLE') }; };
  const scrollToHistory = () => document.getElementById('wallet-activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const overviewTotal = root.total;

  const authoritativePnl = root.pnl ?? root.profitLoss ?? root.profitAndLoss;
  const authoritativePnlPercent = root.pnlPercent ?? root.profitLossPercent ?? root.profitAndLossPercent;
  const authoritativeTotalReturn = root.totalReturn ?? root.allTimeReturn;
  const authoritativeTotalReturnPercent = root.totalReturnPercent ?? root.allTimeReturnPercent;
  const hasPortfolioPerformance = authoritativePnl !== undefined || authoritativeTotalReturn !== undefined;

  if (sessionChecked && !authenticated) {
    return <PageShell><div className="mx-auto max-w-xl pt-8 sm:pt-14"><Panel className="p-5 text-center sm:p-7"><div className="mx-auto max-w-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">Protected wallet</p><h1 className="mt-2 text-xl font-semibold text-white">Verify your Ethereum wallet</h1><p className="mt-2 text-sm leading-6 text-[#8C8299]">Market surfaces remain available without a NEXI session. Wallet balances and financial actions require wallet verification.</p><div className="mx-auto mt-5 max-w-xs"><WalletConnectControl compact /></div></div></Panel></div></PageShell>;
  }

  return <PageShell>
    <header className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 pl-14 sm:pl-0">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">Financial control center</p><h1 className="mt-1 truncate text-xl font-semibold tracking-tight gradient-text sm:text-2xl">Wallet</h1><p className="mt-1 truncate text-xs text-[#8C8299]">Wallet accounts, assets and activity.</p></div>
      <div className="flex shrink-0 items-center gap-2"><WalletConnectControl /><SecondaryButton onClick={() => void loadWallet()}><RefreshCw size={15} className="sm:mr-2" /><span className="sr-only sm:not-sr-only">Refresh</span></SecondaryButton></div>
    </header>
    <WalletDashboardLayout>
      <section aria-label="Total assets and portfolio summary">
        <Panel className="overflow-hidden p-3 sm:p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C3BBD0] sm:text-xs"><WalletCards size={16} className="shrink-0 text-[#48C0CC]" /> Total assets</div>
              <p className="mt-1.5 truncate font-mono text-[1.75rem] font-semibold leading-none tabular-nums sm:mt-2 sm:text-3xl">{state === 'LIVE' ? text(overviewTotal) : 'UNAVAILABLE'}</p>
              <p className="mt-1.5 text-[10px] leading-4 text-[#8C8299] sm:text-xs">Current wallet value.</p>
            </div>
            {state !== 'LIVE' && <StatusBadge state={state} />}
          </div>
          <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
            <Metric label="Available" value={state === 'LIVE' ? text(root.available) : 'UNAVAILABLE'} />
            <Metric label="Locked / in orders" value={state === 'LIVE' ? text(root.locked) : 'UNAVAILABLE'} />
          </div>
          {hasPortfolioPerformance && <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 border-t border-violet-300/10 pt-2" aria-label="Portfolio performance">
            {authoritativePnl !== undefined && <Metric label="P/L" value={state === 'LIVE' ? `${text(authoritativePnl)}${authoritativePnlPercent !== undefined ? ` · ${text(authoritativePnlPercent)}` : ''}` : 'UNAVAILABLE'} />}
            {authoritativeTotalReturn !== undefined && <Metric label="Total return" value={state === 'LIVE' ? `${text(authoritativeTotalReturn)}${authoritativeTotalReturnPercent !== undefined ? ` · ${text(authoritativeTotalReturnPercent)}` : ''}` : 'UNAVAILABLE'} />}
          </div>}
        </Panel>
      </section>
      <section aria-label="Wallet actions"><Panel className="p-3 sm:p-4"><PanelHeading title="Quick actions" description="Choose an available wallet action." /><div className="grid grid-cols-4 gap-2">{(['Deposit', 'Withdraw', 'Transfer', 'Convert'] as Action[]).map((item) => { const Icon = actionIcons[item]; const enabled = authenticated && state === 'LIVE'; return <button key={item} type="button" disabled={!enabled} onClick={() => { setAction(item); if (item !== 'Convert') setCurrency(currencies[0]?.symbol ?? ''); }} aria-label={`${item}${enabled ? '' : ' unavailable'}`} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-1 text-center text-[11px] font-semibold sm:min-h-14 sm:flex-row sm:gap-2 sm:text-xs ${action === item ? 'border-[#8B5CF6] bg-[#2A1742]' : 'border-[#2B2037] bg-[#171022]'} disabled:cursor-not-allowed disabled:opacity-50`}><Icon size={16} className="shrink-0 text-[#48C0CC]" /><span className="truncate">{item}</span></button>; })}</div><button type="button" onClick={scrollToHistory} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#2B2037] bg-[#171022] text-xs font-semibold text-[#C3BBD0]"><Clock3 size={15} />View activity</button></Panel></section>
      <section aria-label="Wallet account tabs"><Panel className="p-2 sm:p-3"><div className="nexi-scroll-rail flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Wallet account tabs">{tabs.map((item) => <TabButton key={item} active={tab === item} onClick={() => setTab(item)}>{item === 'Binary' ? 'Options' : item}</TabButton>)}</div></Panel></section>
      <section className="min-w-0"><div className="min-w-0 space-y-3">
        {tab !== 'Overview' && <Panel className="p-4"><PanelHeading title={`${tab} account`} description={tab === 'Finance' ? 'This projection is not available for this account yet.' : 'Account values appear when they are available.'} />{tab === 'Finance' && !Object.keys(record(accountPayload)).length ? <DataStatePanel state="UNAVAILABLE" title={`${tab} account unavailable`} message="Balance and activity are not available for this account yet." /> : <div className="grid gap-3 sm:grid-cols-3">{(['available', 'locked', 'total'] as const).map((key) => <Metric key={key} label={key} value={text(accountSummary(tab as Exclude<Tab, 'Overview'>)[key])} />)}</div>}</Panel>}
        <Panel className="p-3 sm:p-4"><div className="flex flex-wrap items-center justify-between gap-3"><PanelHeading title={tab === 'Overview' ? 'All account assets' : `${tab} assets`} description="Available, reserved and total amounts for this wallet." /><label className="shrink-0 text-xs text-[#C3BBD0]">Asset filter <select aria-label="Asset category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className="nexi-input ml-2 min-h-9 px-2 text-xs"><option>All</option><option>Crypto</option><option>Stocks</option><option>Metals</option><option>Forex</option></select></label></div>{state !== 'LIVE' ? <DataStatePanel state={state} title={userId ? 'Wallet data unavailable' : 'Wallet is locked'} message={error || 'No authenticated wallet session is available.'} /> : visibleAssets.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No asset data for this filter" message="No matching wallet assets are available right now." /> : <div className="overflow-hidden rounded-xl border border-[#2B2037]"><div className="grid grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] gap-3 bg-[#171022] px-3 py-2 text-[9px] uppercase tracking-[0.08em] text-[#8C8299] sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:px-4 sm:text-[10px] sm:tracking-[0.12em]"><span>Asset</span><span className="text-right">Available</span><span className="hidden text-right sm:block">Locked</span><span className="text-right">Total</span></div><div className="divide-y divide-[#2B2037]">{visibleAssets.map((item) => { const asset = assetMeta(item.name); const iconItem = { assetId: asset?.id ?? item.name, symbol: asset?.symbol ?? item.name, displaySymbol: asset?.displaySymbol ?? item.name, name: asset?.name ?? item.name }; return <div key={item.name} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)] items-center gap-3 bg-[#171022] px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_repeat(3,minmax(5rem,auto))] sm:px-4"><div className="flex min-w-0 items-center gap-2"><AssetIcon item={iconItem} /><span className="min-w-0"><span className="block truncate text-xs font-semibold sm:text-sm">{asset?.name ?? item.name}</span><span className="block truncate text-[10px] text-[#8C8299] sm:text-xs">{asset?.displaySymbol ?? item.name}</span></span></div><span className="truncate text-right font-mono text-xs tabular-nums">{text(item.available)}</span><span className="hidden truncate text-right font-mono text-xs tabular-nums sm:block">{text(item.locked)}</span><span className="truncate text-right font-mono text-xs font-semibold tabular-nums">{text(item.total)}</span></div>; })}</div></div>}</Panel>
        <div id="wallet-activity"><Panel className="p-3 sm:p-4"><PanelHeading title="Activity History" action={<History size={18} className="text-[#8C8299]" />} />{state !== 'LIVE' || activities.length === 0 ? <DataStatePanel state={state === 'LIVE' ? 'UNAVAILABLE' : state} title="Activity authority unavailable" message="Activity details appear when they are available." /> : <div className="divide-y divide-[#2B2037] overflow-hidden rounded-xl border border-[#2B2037]">{activities.map((item) => <article key={item.id} className="grid gap-2 bg-[#171022] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{text(item.type)} · {text(item.asset)}</p><StatusBadge state={text(item.status)} /></div><p className="mt-1 truncate text-xs text-[#8C8299]">{text(item.createdAt)} · Activity {item.id} · Ledger {text(item.ledgerId)}</p></div><div className="flex gap-4 text-xs text-[#C3BBD0] sm:text-right"><span>Amount <strong className="font-mono">{text(item.amount)}</strong></span><span className="hidden sm:inline">{text(item.source)}{text(item.destination) !== '—' ? ` → ${text(item.destination)}` : ''}</span></div></article>)}</div>}</Panel></div>
      </div></section>
      <DepositModal isOpen={action === 'Deposit'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <WithdrawModal isOpen={action === 'Withdraw'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <TransferModal isOpen={action === 'Transfer'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onSelectCurrency={setCurrency} onCompleted={loadWallet} />
      <ConvertModal isOpen={action === 'Convert'} onClose={() => setAction(null)} currencies={currencies} selectedCurrency={currency} onCompleted={loadWallet} />
    </WalletDashboardLayout>
  </PageShell>;
}
