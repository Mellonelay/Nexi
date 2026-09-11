'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Clock3, Coins, History, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { actionCanSubmit, authoritativeValue, EARN_STATES, normalizeProductState, resolveEndpointTemplate } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { DataStatePanel, Field, inputClass, Metric, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, SecondaryButton, StatusBadge } from '../wallet/components/ProductPrimitives';

type RecordValue = Record<string, unknown>;
type FlowStage = 'IDLE' | 'REVIEW' | 'SUBMITTING' | 'PENDING_CONFIRMATION' | 'ERROR';

export default function MiningPage() {
  const [plans, setPlans] = useState<RecordValue[]>([]);
  const [positions, setPositions] = useState<RecordValue[]>([]);
  const [summary, setSummary] = useState<RecordValue | null>(null);
  const [rewards, setRewards] = useState<RecordValue[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RecordValue | null>(null);
  const [amount, setAmount] = useState('');
  const [catalogState, setCatalogState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [positionState, setPositionState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [stage, setStage] = useState<FlowStage>('IDLE');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const plansEndpoint = process.env.NEXT_PUBLIC_MINING_PLANS_ENDPOINT || '/mining/plans';
  const positionsEndpoint = userId
    ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_MINING_POSITIONS_ENDPOINT || '/mining/my/{userId}', { userId })
    : null;
  const subscribeEndpoint = process.env.NEXT_PUBLIC_MINING_SUBSCRIBE_ENDPOINT || '/mining/subscribe';

  useEffect(() => {
    const sync = () => { setUserId(sessionPrincipalId()); setSessionChecked(true); };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const load = useCallback(async () => {
    if (!sessionChecked) return;
    setSelectedPlan(null);
    setStage('IDLE');
    setMessage('');

    if (!plansEndpoint) {
      setPlans([]);
      setCatalogState('UNAVAILABLE');
    } else {
      setCatalogState('LOADING');
      try {
        const result = await api.get(plansEndpoint);
        setPlans(Array.isArray(result.data) ? result.data : []);
        setCatalogState('LIVE');
      } catch {
        setPlans([]);
        setCatalogState('ERROR');
      }
    }

    if (!userId || !positionsEndpoint) {
      setPositions([]);
      setSummary(null);
      setRewards([]);
      setPositionState('UNAVAILABLE');
      return;
    }
    setPositionState('LOADING');
    try {
      const [result, summaryResult, rewardsResult] = await Promise.all([
        api.get(positionsEndpoint),
        api.get('/mining/summary'),
        api.get(`/mining/rewards/${userId}`),
      ]);
      setPositions(Array.isArray(result.data) ? result.data : []);
      setSummary(summaryResult.data && typeof summaryResult.data === 'object' ? summaryResult.data : null);
      setRewards(Array.isArray(rewardsResult.data) ? rewardsResult.data : []);
      setPositionState('LIVE');
    } catch {
      setPositions([]);
      setPositionState('ERROR');
    }
  }, [plansEndpoint, positionsEndpoint, sessionChecked, userId]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!userId || !selectedPlan || !subscribeEndpoint || !actionCanSubmit({ authenticated: true, valid: Number(amount) > 0, backendAvailable: catalogState === 'LIVE' })) return;
    const requestedAmount = Number(amount);
    const minDeposit = Number(selectedPlan.minDeposit);
    const maxDeposit = Number(selectedPlan.maxDeposit);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || (Number.isFinite(minDeposit) && requestedAmount < minDeposit) || (Number.isFinite(maxDeposit) && requestedAmount > maxDeposit)) {
      setStage('ERROR');
      setMessage(`Enter an amount within the product limits: ${authoritativeValue(selectedPlan.minDeposit)} – ${authoritativeValue(selectedPlan.maxDeposit)}.`);
      return;
    }
    setStage('SUBMITTING');
    setMessage('');
    try {
      await api.post(subscribeEndpoint, {
        planId: selectedPlan.id,
        amount: amount.trim(),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `mining-${Date.now()}`,
      });
      setStage('PENDING_CONFIRMATION');
      setMessage('Request sent to the configured backend. Activation and reward values remain pending confirmation.');
      await load();
    } catch (error) {
      setStage('ERROR');
      setMessage(error instanceof Error ? error.message : 'The backend rejected this subscription.');
    }
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (stage === 'REVIEW') void submit(); else setStage('REVIEW'); };

  return <PageShell><PageHeader eyebrow="Product catalog" title="Earn / Mining" description="Backend-authoritative products, subscriptions, rewards, maturity and redemption." action={<SecondaryButton onClick={() => void load()}><RefreshCw size={16} className="mr-2 inline" />Refresh</SecondaryButton>} /><section className="relative mx-auto mb-5 max-w-7xl overflow-hidden rounded-2xl border border-[#49335E] bg-[radial-gradient(circle_at_12%_10%,rgba(109,65,255,.24),transparent_34%),linear-gradient(135deg,#171022,#0B0711)] p-4 sm:p-5"><div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"><div><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]"><Sparkles size={15} />NEXI Earn</p><h2 className="mt-2 text-xl font-semibold sm:text-2xl">Structured earning, with clear terms.</h2><p className="mt-2 max-w-2xl text-sm leading-5 text-[#C3BBD0]">Mining products follow the configured purchase, order-history and redemption flow while retaining NEXI’s ledger-backed authority.</p></div><StatusBadge state={catalogState === 'LIVE' ? 'AVAILABLE' : catalogState} /></div></section><section className="mx-auto mb-4 grid max-w-7xl grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"><Metric label="Locked principal" value={authoritativeValue(summary?.lockedPrincipal)} hint="Active subscriptions" /><Metric label="Subscriptions" value={authoritativeValue(summary?.totalSubscriptions)} hint="All lifecycle records" /><Metric label="Rewards" value={authoritativeValue(summary?.postedRewards ?? summary?.accruedRewards)} hint="Posted reward accruals" /><Metric label="Active products" value={catalogState === 'LIVE' ? authoritativeValue(plans.length) : '—'} hint="Backend catalog" /></section><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]"><div className="space-y-5"><Panel><PanelHeading title="Available products" description="Terms and limits come from the backend." />{catalogState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading product catalog" />}{catalogState === 'ERROR' && <DataStatePanel state="ERROR" title="Mining catalog unavailable" />}{catalogState === 'LIVE' && plans.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No products returned" />}{catalogState === 'LIVE' && plans.length > 0 && <div className="grid gap-3 md:grid-cols-2">{plans.map((plan) => { const state = plan.isActive === true ? 'AVAILABLE' : 'UNAVAILABLE'; return <article key={String(plan.id)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{authoritativeValue(plan.name)}</h3><StatusBadge state={state} /></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-[#8C8299]">Asset</dt><dd>{authoritativeValue(plan.currency)}</dd></div><div className="flex justify-between"><dt className="text-[#8C8299]">Term</dt><dd className="font-mono">{authoritativeValue(plan.lockupPeriod)} days</dd></div><div className="flex justify-between"><dt className="text-[#8C8299]">Daily yield</dt><dd className="font-mono">{authoritativeValue(plan.dailyYieldDecimal ?? plan.dailyYield)}</dd></div><div className="flex justify-between"><dt className="text-[#8C8299]">Limits</dt><dd className="font-mono">{authoritativeValue(plan.minDeposit)} – {authoritativeValue(plan.maxDeposit)}</dd></div></dl><PrimaryButton onClick={() => { setSelectedPlan(plan); setStage('IDLE'); setAmount(''); setMessage(''); }} disabled={!userId}>Review product</PrimaryButton></article>; })}</div>}</Panel><Panel><PanelHeading title="Reward history" description="Each row is linked to a ledger-backed reward accrual." />{rewards.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No reward accruals returned" /> : <div className="space-y-2">{rewards.slice(0, 8).map((reward) => <div key={String(reward.id)} className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm"><span>{authoritativeValue(reward.currency)} · {authoritativeValue(reward.rewardedAt)}</span><span className="font-mono text-[#98FCE4]">+{authoritativeValue(reward.amount)}</span></div>)}</div>}</Panel><Panel><PanelHeading title="Active and historical positions" action={<History size={18} className="text-[#8C8299]" />} />{positionState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading positions" />}{positionState === 'ERROR' && <DataStatePanel state="ERROR" title="Position history unavailable" />}{positionState === 'LIVE' && positions.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No positions returned" />}{positionState === 'LIVE' && positions.length > 0 && <div className="space-y-3">{positions.map((position) => <MiningPosition key={String(position.id)} position={position} onChanged={() => void load()} />)}</div>}</Panel></div><aside>{selectedPlan ? <Panel><PanelHeading title={`Review ${authoritativeValue(selectedPlan.name)}`} description="Confirming creates a ledger-backed mining subscription." /><form onSubmit={onSubmit} className="space-y-4"><Field label="Subscription amount"><input className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Enter amount" aria-label="Subscription amount" /></Field>{message && <div className={`rounded-xl border p-4 text-sm ${stage === 'ERROR' ? 'border-[#FF5C7C]/30 bg-[#561626]/50 text-[#FFD9E0]' : 'border-[#48C0CC]/30 bg-[#12373E]/40 text-[#C8FCFF]'}`} role={stage === 'ERROR' ? 'alert' : 'status'}>{message}</div>}<PrimaryButton type="submit" disabled={stage === 'SUBMITTING' || !userId || Number(amount) <= 0}>{stage === 'REVIEW' ? 'Confirm subscription' : stage === 'SUBMITTING' ? 'Submitting…' : 'Review subscription'}</PrimaryButton></form></Panel> : <DataStatePanel state="AVAILABLE" title="Select a product to review" message="Choose a backend product to see its terms." />}</aside></main></PageShell>;
}

function MiningPosition({ position, onChanged }: { position: RecordValue; onChanged: () => void }) {
  const active = position.status === 'ACTIVE';
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const action = async (path: string) => {
    setBusyAction(path);
    setActionError('');
    try {
      await api.post(path, { subscriptionId: position.id, idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `mining-${Date.now()}` });
      onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The mining action could not be completed.');
    } finally {
      setBusyAction(null);
    }
  };
  return <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold">{authoritativeValue(position.plan && typeof position.plan === 'object' ? (position.plan as RecordValue).name : position.planId)}</span><StatusBadge state={normalizeProductState(position.status, EARN_STATES)} /></div><div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><MetricLike label="Amount" value={authoritativeValue(position.amountDecimal ?? position.amount)} /><MetricLike label="Reward" value={authoritativeValue(position.totalRewardsDecimal ?? position.totalRewards)} /><MetricLike label="End" value={authoritativeValue(position.endDate)} /></div>{actionError && <p className="mt-3 text-sm text-[#FFB8C5]" role="alert">{actionError}</p>}{active && <div className="mt-3 flex gap-2"><SecondaryButton onClick={() => void action('/mining/redeem')} disabled={busyAction !== null}>{busyAction === '/mining/redeem' ? 'Redeeming…' : 'Redeem'}</SecondaryButton><SecondaryButton onClick={() => void action('/mining/cancel')} disabled={busyAction !== null}>{busyAction === '/mining/cancel' ? 'Cancelling…' : 'Cancel'}</SecondaryButton></div>}</div>;
}

function MetricLike({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-[#8C8299]">{label}</p><p className="mt-1 break-words font-mono text-[#F8F6FF]">{value}</p></div>; }
