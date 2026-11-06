'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../lib/intent-key';
import { actionCanSubmit, authoritativeValue, EARN_STATES, normalizeProductState, resolveEndpointTemplate } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { DataStatePanel, Field, inputClass, Metric, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, SecondaryButton, StatusBadge } from '../../components/PagePrimitives';

type RecordValue = Record<string, unknown>;
type FlowStage = 'IDLE' | 'REVIEW' | 'SUBMITTING' | 'PENDING_CONFIRMATION' | 'ERROR';

function normalizePlan(plan: RecordValue): RecordValue {
  return {
    ...plan,
    isActive: plan.isActive === true || plan.isActive === 1,
    minDeposit: plan.minDepositDecimal ?? plan.minDeposit,
    maxDeposit: plan.maxDepositDecimal ?? plan.maxDeposit,
  };
}

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
  const previousUserId = useRef<string | null | undefined>(undefined);
  const pendingSubscription = useRef<PendingIntentKey | null>(null);
  const plansEndpoint = process.env.NEXT_PUBLIC_MINING_PLANS_ENDPOINT || '/mining/plans';
  const positionsEndpoint = userId
    ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_MINING_POSITIONS_ENDPOINT || '/mining/my/{userId}', { userId })
    : null;
  const subscribeEndpoint = process.env.NEXT_PUBLIC_MINING_SUBSCRIBE_ENDPOINT || '/mining/subscribe';

  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        setPositions([]);
        setSummary(null);
        setRewards([]);
        setSelectedPlan(null);
        setAmount('');
        setMessage('');
        setStage('IDLE');
        setPositionState(next ? 'LOADING' : 'UNAVAILABLE');
        previousUserId.current = next;
      }
      setUserId(next);
      setSessionChecked(true);
    };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const load = useCallback(async (options: { preserveFlow?: boolean } = {}) => {
    if (!sessionChecked || sessionPrincipalId() !== userId) return;
    if (!options.preserveFlow) {
      setSelectedPlan(null);
      setStage('IDLE');
      setMessage('');
    }

    if (!plansEndpoint) {
      setPlans([]);
      setCatalogState('UNAVAILABLE');
    } else {
      setCatalogState('LOADING');
      try {
        const result = await api.get(plansEndpoint);
        setPlans(Array.isArray(result.data) ? result.data.map(normalizePlan) : []);
        setCatalogState('LIVE');
      } catch {
        setPlans([]);
        setCatalogState('ERROR');
      }
    }

    if (sessionPrincipalId() !== userId) return;
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
      if (sessionPrincipalId() !== userId) return;
      setPositions(Array.isArray(result.data) ? result.data : []);
      setSummary(summaryResult.data && typeof summaryResult.data === 'object' ? summaryResult.data : null);
      setRewards(Array.isArray(rewardsResult.data) ? rewardsResult.data : []);
      setPositionState('LIVE');
    } catch {
      if (sessionPrincipalId() !== userId) return;
      setPositions([]);
      setSummary(null);
      setRewards([]);
      setPositionState('ERROR');
    }
  }, [plansEndpoint, positionsEndpoint, sessionChecked, userId]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!userId || sessionPrincipalId() !== userId || !selectedPlan || selectedPlan.isActive !== true || !subscribeEndpoint || !actionCanSubmit({ authenticated: true, valid: Number(amount) > 0, backendAvailable: catalogState === 'LIVE' })) return;
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
      pendingSubscription.current = getIntentKey(pendingSubscription.current, JSON.stringify([selectedPlan.id, amount.trim()]), 'mining:subscribe');
      await api.post(subscribeEndpoint, {
        planId: selectedPlan.id,
        amount: amount.trim(),
        idempotencyKey: pendingSubscription.current.key,
      });
      if (sessionPrincipalId() !== userId) return;
      pendingSubscription.current = null;
      setStage('PENDING_CONFIRMATION');
      setMessage('Request sent. Activation and reward values will appear after confirmation.');
      await load({ preserveFlow: true });
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      setStage('ERROR');
      setMessage(error instanceof Error ? error.message : 'This subscription could not be accepted.');
    }
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (stage === 'REVIEW') void submit(); else setStage('REVIEW'); };

  return <PageShell><PageHeader title="Mining" description="Review available plans and track your subscriptions." action={<SecondaryButton onClick={() => void load()}><RefreshCw size={16} className="mr-2 inline" />Refresh</SecondaryButton>} /><section className="mx-auto mb-4 grid max-w-7xl grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"><Metric label="Locked principal" value={authoritativeValue(summary?.lockedPrincipal)} hint="Active subscriptions" /><Metric label="Subscriptions" value={authoritativeValue(summary?.totalSubscriptions)} hint="All lifecycle records" /><Metric label="Rewards" value={authoritativeValue(summary?.postedRewards ?? summary?.accruedRewards)} hint="Posted reward accruals" /><Metric label="Active products" value={catalogState === 'LIVE' ? authoritativeValue(plans.length) : '—'} hint="Available products" /></section><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]"><div className="space-y-5"><Panel><PanelHeading title="Available plans" description="Review each plan’s term, yield and limits." />{catalogState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading product catalog" />}{catalogState === 'ERROR' && <DataStatePanel state="ERROR" title="Mining catalog unavailable" />}{catalogState === 'LIVE' && plans.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No products returned" />}{catalogState === 'LIVE' && plans.length > 0 && <div className="grid gap-3 md:grid-cols-2">{plans.map((plan) => { const state = plan.isActive === true ? 'AVAILABLE' : 'UNAVAILABLE'; return <article key={String(plan.id)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{authoritativeValue(plan.name)}</h3><StatusBadge state={state} /></div><dl className="mt-4 space-y-2.5 text-base leading-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Asset</dt><dd className="text-right">{authoritativeValue(plan.currency)}</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Term</dt><dd className="text-right font-mono">{authoritativeValue(plan.lockupPeriod)} days</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Daily yield</dt><dd className="text-right font-mono">{authoritativeValue(plan.dailyYieldDecimal ?? plan.dailyYield)}</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Limits</dt><dd className="max-w-full break-words text-right font-mono">{authoritativeValue(plan.minDeposit)} – {authoritativeValue(plan.maxDeposit)}</dd></div></dl><div className="mt-4 flex justify-start"><PrimaryButton size="compact" className="min-h-11 w-full px-4 text-base sm:w-auto" onClick={() => { setSelectedPlan(plan); setStage('IDLE'); setAmount(''); setMessage(''); }} disabled={!userId || state !== 'AVAILABLE'}>Choose plan</PrimaryButton></div></article>; })}</div>}</Panel><Panel><PanelHeading title="Reward history" description="Recent rewards from your subscriptions." />{positionState === 'ERROR' ? <DataStatePanel state="ERROR" title="Reward history unavailable" /> : positionState === 'LOADING' ? <DataStatePanel state="LOADING" title="Loading reward history" /> : rewards.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No rewards yet" /> : <div className="space-y-2">{rewards.slice(0, 8).map((reward) => <div key={String(reward.id)} className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm"><span>{authoritativeValue(reward.currency)} · {authoritativeValue(reward.rewardedAt)}</span><span className="font-mono text-[#98FCE4]">+{authoritativeValue(reward.amount)}</span></div>)}</div>}</Panel><Panel><PanelHeading title="My subscriptions" action={<History size={18} className="text-[#8C8299]" />} />{positionState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading positions" />}{positionState === 'ERROR' && <DataStatePanel state="ERROR" title="Position history unavailable" />}{positionState === 'LIVE' && positions.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No subscriptions yet" />}{positionState === 'LIVE' && positions.length > 0 && <div className="space-y-3">{positions.map((position) => <MiningPosition key={String(position.id)} position={position} onChanged={() => void load()} />)}</div>}</Panel></div><aside>{selectedPlan ? <Panel><PanelHeading title={`Review ${authoritativeValue(selectedPlan.name)}`} description="Review your amount before confirming." /><form onSubmit={onSubmit} className="space-y-4"><Field label="Subscription amount"><input className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Enter amount" aria-label="Subscription amount" /></Field>{message && <div className={`rounded-xl border p-4 text-sm ${stage === 'ERROR' ? 'border-[#FF5C7C]/30 bg-[#561626]/50 text-[#FFD9E0]' : 'border-[#48C0CC]/30 bg-[#12373E]/40 text-[#C8FCFF]'}`} role={stage === 'ERROR' ? 'alert' : 'status'}>{message}</div>}<PrimaryButton type="submit" disabled={stage === 'SUBMITTING' || stage === 'PENDING_CONFIRMATION' || !userId || Number(amount) <= 0}>{stage === 'REVIEW' ? 'Confirm subscription' : stage === 'SUBMITTING' ? 'Submitting…' : stage === 'PENDING_CONFIRMATION' ? 'Request sent' : 'Review subscription'}</PrimaryButton></form></Panel> : <DataStatePanel state="AVAILABLE" title="Select a product to review" message="Choose a product to see its terms." />}</aside></main></PageShell>;
}

function MiningPosition({ position, onChanged }: { position: RecordValue; onChanged: () => void }) {
  const active = position.status === 'ACTIVE';
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const pendingAction = useRef<PendingIntentKey | null>(null);
  const action = async (path: string) => {
    setBusyAction(path);
    setActionError('');
    try {
      pendingAction.current = getIntentKey(pendingAction.current, JSON.stringify([path, position.id]), 'mining:action');
      await api.post(path, { subscriptionId: position.id, idempotencyKey: pendingAction.current.key });
      pendingAction.current = null;
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
