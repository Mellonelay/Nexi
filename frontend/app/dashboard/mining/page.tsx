'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../lib/intent-key';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../lib/pending-economic-intent';
import { actionCanSubmit, authoritativeValue, EARN_STATES, normalizeProductState, resolveEndpointTemplate } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import { decimalAmountWithinBalance, decimalLessThanOrEqual, formatDecimalRatePercent } from '../../lib/trading-states';
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
  const [summaryState, setSummaryState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [rewardState, setRewardState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [stage, setStage] = useState<FlowStage>('IDLE');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const loadRevision = useRef(0);
  const pendingSubscription = useRef<PendingIntentKey | null>(null);
  const [unknownSubscriptionKey, setUnknownSubscriptionKey] = useState<string | null>(null);
  const plansEndpoint = process.env.NEXT_PUBLIC_MINING_PLANS_ENDPOINT || '/mining/plans';
  const positionsEndpoint = userId
    ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_MINING_POSITIONS_ENDPOINT || '/mining/my/{userId}', { userId })
    : null;
  const subscribeEndpoint = process.env.NEXT_PUBLIC_MINING_SUBSCRIBE_ENDPOINT || '/mining/subscribe';
  const subscriptionAmountValid = Boolean(selectedPlan && decimalLessThanOrEqual(selectedPlan.minDeposit, amount.trim())
    && decimalAmountWithinBalance(amount.trim(), selectedPlan.maxDeposit));

  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        ++loadRevision.current; // Invalidate old principal-scoped reads before clearing their state.
        setPositions([]);
        setSummary(null);
        setRewards([]);
        setSelectedPlan(null);
        setAmount('');
        setMessage('');
        setStage('IDLE');
        setPositionState(next ? 'LOADING' : 'UNAVAILABLE');
        setSummaryState(next ? 'LOADING' : 'UNAVAILABLE');
        setRewardState(next ? 'LOADING' : 'UNAVAILABLE');
        const stored = next ? readPendingEconomicIntent('mining-subscribe', next) : null;
        pendingSubscription.current = stored?.intent ?? null;
        setUnknownSubscriptionKey(stored?.intent.key ?? null);
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
    const revision = ++loadRevision.current;
    const isCurrent = () => loadRevision.current === revision && sessionPrincipalId() === userId;
    if (!options.preserveFlow) {
      setSelectedPlan(null);
      setStage('IDLE');
      setMessage('');
    }

    const catalogLoad = (async () => {
      if (!plansEndpoint) {
        setPlans([]);
        setCatalogState('UNAVAILABLE');
      } else {
        setCatalogState('LOADING');
        try {
          const result = await api.get(plansEndpoint);
          if (!isCurrent()) return;
          if (!Array.isArray(result.data)) throw new Error('Mining plan catalog returned an invalid shape');
          setPlans(result.data.map(normalizePlan));
          setCatalogState('LIVE');
        } catch {
          if (!isCurrent()) return;
          setPlans([]);
          setCatalogState('ERROR');
        }
      }
    })();
    const positionsLoad = (async () => {
      if (sessionPrincipalId() !== userId) return;
      if (!userId || !positionsEndpoint) {
        setPositions([]);
        setSummary(null);
        setRewards([]);
        setPositionState('UNAVAILABLE');
        setSummaryState('UNAVAILABLE');
        setRewardState('UNAVAILABLE');
        return;
      }
      setPositionState('LOADING');
      setSummaryState('LOADING');
      setRewardState('LOADING');
      const [positionsResult, summaryResult, rewardsResult] = await Promise.allSettled([
        api.get(positionsEndpoint),
        api.get('/mining/summary'),
        api.get(`/mining/rewards/${userId}`),
      ]);
      if (!isCurrent()) return;
      if (positionsResult.status === 'fulfilled' && Array.isArray(positionsResult.value.data)) {
        setPositions(positionsResult.value.data);
        setPositionState('LIVE');
      } else {
        setPositions([]);
        setPositionState('ERROR');
      }
      if (summaryResult.status === 'fulfilled' && summaryResult.value.data
        && typeof summaryResult.value.data === 'object' && !Array.isArray(summaryResult.value.data)) {
        setSummary(summaryResult.value.data);
        setSummaryState('LIVE');
      } else {
        setSummary(null);
        setSummaryState('ERROR');
      }
      if (rewardsResult.status === 'fulfilled' && Array.isArray(rewardsResult.value.data)) {
        setRewards(rewardsResult.value.data);
        setRewardState('LIVE');
      } else {
        setRewards([]);
        setRewardState('ERROR');
      }
    })();
    await Promise.all([catalogLoad, positionsLoad]);
  }, [plansEndpoint, positionsEndpoint, sessionChecked, userId]);

  useEffect(() => { void load(); }, [load]);

  const recheckUnknownSubscription = async (key: string) => {
    if (!userId || sessionPrincipalId() !== userId || pendingSubscription.current?.key !== key) return;
    try {
      const response = await api.get<{ activities: Array<{
        type?: string; status?: string; idempotencyKey?: string; referenceId?: string; ledgerCorrelationId?: string;
        ledgerPostingId?: string; relatedLedgerPostings?: Array<{ id?: string; kind?: string; referenceId?: string; correlationId?: string }>;
      }> }>('/wallet/activity', { params: { limit: 1, type: 'MINING_SUBSCRIPTION', status: 'COMPLETED', correlationId: key } });
      if (sessionPrincipalId() !== userId || pendingSubscription.current?.key !== key) return;
      const confirmed = Array.isArray(response.data?.activities) && response.data.activities.some((row) =>
        row?.type === 'MINING_SUBSCRIPTION' && row.status === 'COMPLETED' && row.idempotencyKey === key && row.ledgerCorrelationId === key
        && typeof row.referenceId === 'string' && row.referenceId.length > 0
        && Array.isArray(row.relatedLedgerPostings) && row.relatedLedgerPostings.some((posting) =>
          posting.id === row.ledgerPostingId && posting.kind === 'RESERVE'
          && posting.referenceId === row.referenceId && posting.correlationId === key));
      if (!confirmed) {
        setMessage('Subscription outcome remains unconfirmed. Do not subscribe again; review Wallet activity or contact Support.');
        return;
      }
      if (!clearPendingEconomicIntent('mining-subscribe', userId, key)) {
        setMessage('Subscription reserve is confirmed, but local recovery state could not be cleared. Keep this original request blocked until recovery storage is available.');
        return;
      }
      pendingSubscription.current = null;
      setUnknownSubscriptionKey(null);
      setStage('IDLE');
      setMessage('Subscription reserve confirmed in your account activity. See My subscriptions for its current activation and reward status.');
      await load({ preserveFlow: true });
    } catch {
      if (sessionPrincipalId() === userId && pendingSubscription.current?.key === key)
        setMessage('Subscription activity could not be checked. The original submission remains unresolved.');
    }
  };

  const submit = async () => {
    if (unknownSubscriptionKey) return;
    if (!userId || sessionPrincipalId() !== userId || !selectedPlan || selectedPlan.isActive !== true || !subscribeEndpoint) return;
    if (!actionCanSubmit({ authenticated: true, valid: subscriptionAmountValid, backendAvailable: catalogState === 'LIVE' })) {
      setStage('ERROR');
      setMessage(`Enter an amount within the product limits: ${authoritativeValue(selectedPlan.minDeposit)} – ${authoritativeValue(selectedPlan.maxDeposit)}.`);
      return;
    }
    setStage('SUBMITTING');
    setMessage('');
    try {
      pendingSubscription.current = getIntentKey(pendingSubscription.current, JSON.stringify([userId, selectedPlan.id, amount.trim()]), 'mining:subscribe');
      if (!persistPendingEconomicIntent('mining-subscribe', { principal: userId, intent: { key: pendingSubscription.current.key, fingerprint: 'redacted' }, context: { planId: String(selectedPlan.id) } })) {
        const stored = readPendingEconomicIntent('mining-subscribe', userId);
        pendingSubscription.current = stored?.intent ?? null;
        setUnknownSubscriptionKey(stored?.intent.key ?? 'unresolved');
        setStage('ERROR');
        setMessage('A prior subscription may be unresolved or recovery storage is unavailable. Do not submit another subscription until the original outcome is reconciled.');
        return;
      }
      const response = await api.post<RecordValue>(subscribeEndpoint, {
        planId: selectedPlan.id,
        amount: amount.trim(),
        idempotencyKey: pendingSubscription.current.key,
      });
      if (sessionPrincipalId() !== userId) return;
      const submittedKey = pendingSubscription.current?.key;
      if (!submittedKey) return;
      setUnknownSubscriptionKey(submittedKey);
      setStage('ERROR');
      setMessage('Subscription request returned. Confirming the original Ledger activity before allowing another request.');
      if (typeof response.data?.id !== 'string' || String(response.data.userId) !== userId) {
        setMessage('Subscription response was incomplete. Recheck the original request before trying again.');
      }
      await recheckUnknownSubscription(submittedKey);
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if (pendingSubscription.current) {
        const key = pendingSubscription.current.key;
        setUnknownSubscriptionKey(key);
        setStage('ERROR');
        setMessage(status
          ? `Subscription returned HTTP ${status}; the original financial outcome remains unresolved. Recheck account activity before trying another.`
          : 'Subscription outcome is unknown. Check account activity before trying another subscription.');
        void recheckUnknownSubscription(key);
      }
    }
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); if (unknownSubscriptionKey) return; if (stage === 'REVIEW') void submit(); else setStage('REVIEW'); };

  return <PageShell><PageHeader title="Mining" description="Review available plans and track your subscriptions." action={<SecondaryButton onClick={() => void load()}><RefreshCw size={16} className="mr-2 inline" />Refresh</SecondaryButton>} />{unknownSubscriptionKey && <div role="alert" className="mx-auto mb-4 max-w-7xl rounded-xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-100">An earlier subscription outcome remains unresolved. New subscriptions are blocked, including after a page reload. <button type="button" onClick={() => void recheckUnknownSubscription(unknownSubscriptionKey)} className="ml-2 min-h-11 rounded-lg border border-amber-300/40 px-3 font-semibold">Recheck subscription activity</button></div>}<section className="mx-auto mb-4 grid max-w-7xl grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:gap-3 lg:grid-cols-4"><Metric label="Locked principal" value={authoritativeValue(summary?.lockedPrincipal)} hint={summaryState === 'ERROR' ? 'Summary unavailable' : 'Active subscriptions'} /><Metric label="Subscriptions" value={authoritativeValue(summary?.totalSubscriptions)} hint={summaryState === 'ERROR' ? 'Summary unavailable' : 'All lifecycle records'} /><Metric label="Rewards" value={authoritativeValue(summary?.postedRewards ?? summary?.accruedRewards)} hint={summaryState === 'ERROR' ? 'Summary unavailable' : 'Posted reward accruals'} /><Metric label="Active products" value={catalogState === 'LIVE' ? authoritativeValue(plans.length) : '—'} hint="Available products" /></section><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]"><div className="space-y-5"><Panel><PanelHeading title="Available plans" description="Review each plan’s term, yield and limits." />{catalogState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading product catalog" />}{catalogState === 'ERROR' && <DataStatePanel state="ERROR" title="Mining catalog unavailable" />}{catalogState === 'LIVE' && plans.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No products returned" />}{catalogState === 'LIVE' && plans.length > 0 && <div className="grid gap-3 md:grid-cols-2">{plans.map((plan) => { const state = plan.isActive === true ? 'AVAILABLE' : 'UNAVAILABLE'; return <article key={String(plan.id)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{authoritativeValue(plan.name)}</h3><StatusBadge state={state} /></div><dl className="mt-4 space-y-2.5 text-base leading-6"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Asset</dt><dd className="text-right">{authoritativeValue(plan.currency)}</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Term</dt><dd className="text-right font-mono">{authoritativeValue(plan.lockupPeriod)} days</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Daily yield</dt><dd className="text-right font-mono">{formatDecimalRatePercent(plan.dailyYieldDecimal ?? plan.dailyYield, '% / day')}</dd></div><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3"><dt className="text-[#8C8299]">Limits</dt><dd className="max-w-full break-words text-right font-mono">{authoritativeValue(plan.minDeposit)} – {authoritativeValue(plan.maxDeposit)}</dd></div></dl><div className="mt-4 flex justify-start"><PrimaryButton size="compact" className="min-h-11 w-full px-4 text-base sm:w-auto" onClick={() => { setSelectedPlan(plan); setStage('IDLE'); setAmount(''); setMessage(''); }} disabled={!userId || state !== 'AVAILABLE'}>Choose plan</PrimaryButton></div></article>; })}</div>}</Panel><Panel><PanelHeading title="Reward history" description="Recent rewards from your subscriptions." />{rewardState === 'ERROR' ? <DataStatePanel state="ERROR" title="Reward history unavailable" /> : rewardState === 'LOADING' ? <DataStatePanel state="LOADING" title="Loading reward history" /> : rewardState === 'UNAVAILABLE' ? <DataStatePanel state="UNAVAILABLE" title="Verify your wallet to load rewards" /> : rewards.length === 0 ? <DataStatePanel state="UNAVAILABLE" title="No rewards yet" /> : <div className="space-y-2">{rewards.slice(0, 8).map((reward) => <div key={String(reward.id)} className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm"><span>{authoritativeValue(reward.currency)} · {authoritativeValue(reward.rewardedAt)}</span><span className="font-mono text-[#98FCE4]">+{authoritativeValue(reward.amount)}</span></div>)}</div>}</Panel><Panel><PanelHeading title="My subscriptions" action={<History size={18} className="text-[#8C8299]" />} />{positionState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading positions" />}{positionState === 'ERROR' && <DataStatePanel state="ERROR" title="Position history unavailable" />}{positionState === 'LIVE' && positions.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No subscriptions yet" />}{positionState === 'LIVE' && positions.length > 0 && <div className="space-y-3">{positions.map((position) => <MiningPosition key={String(position.id)} position={position} onChanged={() => void load()} />)}</div>}</Panel></div><aside>{selectedPlan ? <Panel><PanelHeading title={`Review ${authoritativeValue(selectedPlan.name)}`} description="Review your amount before confirming." /><form onSubmit={onSubmit} className="space-y-4"><Field label="Subscription amount"><input className={inputClass} value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Enter amount" aria-label="Subscription amount" /></Field>{message && <div className={`rounded-xl border p-4 text-sm ${stage === 'ERROR' ? 'border-[#FF5C7C]/30 bg-[#561626]/50 text-[#FFD9E0]' : 'border-[#48C0CC]/30 bg-[#12373E]/40 text-[#C8FCFF]'}`} role={stage === 'ERROR' ? 'alert' : 'status'}>{message}</div>}{unknownSubscriptionKey && <div role="alert" className="rounded-lg border border-amber-300/30 p-3 text-xs text-amber-100">Subscription outcome unresolved. <button type="button" onClick={() => void recheckUnknownSubscription(unknownSubscriptionKey)} className="ml-2 min-h-11 underline">Recheck subscription</button></div>}<PrimaryButton type="submit" disabled={Boolean(unknownSubscriptionKey) || stage === 'SUBMITTING' || stage === 'PENDING_CONFIRMATION' || !userId || !subscriptionAmountValid}>{stage === 'REVIEW' ? 'Confirm subscription' : stage === 'SUBMITTING' ? 'Submitting…' : stage === 'PENDING_CONFIRMATION' ? 'Request sent' : 'Review subscription'}</PrimaryButton></form></Panel> : <DataStatePanel state="AVAILABLE" title="Select a product to review" message="Choose a product to see its terms." />}</aside></main></PageShell>;
}

function MiningPosition({ position, onChanged }: { position: RecordValue; onChanged: () => void }) {
  const subscriptionId = String(position.id);
  const kind = `mining-action:${subscriptionId}`;
  const active = position.status === 'ACTIVE';
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [unknown, setUnknown] = useState<{ key: string; operation: 'redeem' | 'cancel' | null } | null>(null);
  const original = useRef<PendingIntentKey | null>(null);

  useEffect(() => {
    const restore = () => {
      const principal = sessionPrincipalId();
      const saved = principal ? readPendingEconomicIntent(kind, principal) : null;
      original.current = saved?.intent ?? null;
      const operation = saved?.context.subscriptionId === subscriptionId
        && (saved.context.operation === 'redeem' || saved.context.operation === 'cancel')
        ? saved.context.operation : null;
      setUnknown(saved ? { key: saved.intent.key, operation } : null);
    };
    restore();
    window.addEventListener('nexi:wallet-session', restore);
    return () => window.removeEventListener('nexi:wallet-session', restore);
  }, [kind, subscriptionId]);

  const recheck = async (key: string, operation: 'redeem' | 'cancel' | null) => {
    const principal = sessionPrincipalId();
    if (!principal || !operation || original.current?.key !== key) {
      setError('Verify the original wallet session and mining action before checking it.');
      return;
    }
    const correlationId = `mining-release:${subscriptionId}:${key}`;
    try {
      const result = await api.get<{ activities: Array<{
        type?: string; status?: string; idempotencyKey?: string; referenceId?: string; ledgerCorrelationId?: string;
        ledgerPostingId?: string; details?: unknown;
        relatedLedgerPostings?: Array<{ id?: string; kind?: string; referenceId?: string; correlationId?: string }>;
      }> }>('/wallet/activity', {
        params: { limit: 1, type: 'MINING_REDEMPTION', status: 'COMPLETED', correlationId, referenceId: subscriptionId },
      });
      if (sessionPrincipalId() !== principal || original.current?.key !== key) return;
      const expected = operation === 'redeem' ? 'COMPLETED' : 'CANCELLED';
      const confirmed = Array.isArray(result.data?.activities) && result.data.activities.some((item) => {
        let details: unknown = item.details;
        try { if (typeof details === 'string') details = JSON.parse(details); } catch { return false; }
        return item.type === 'MINING_REDEMPTION' && item.status === 'COMPLETED'
          && item.referenceId === subscriptionId && item.ledgerCorrelationId === correlationId
          && !!details && typeof details === 'object' && (details as { status?: unknown }).status === expected
          && Array.isArray(item.relatedLedgerPostings) && item.relatedLedgerPostings.some((posting) =>
            posting.id === item.ledgerPostingId && posting.kind === 'RELEASE'
            && posting.referenceId === subscriptionId && posting.correlationId === key);
      });
      if (!confirmed) {
        setError('Original action is not confirmed in durable account activity. Do not submit it again.');
        return;
      }
      if (!clearPendingEconomicIntent(kind, principal, key)) {
        setError('Mining release is confirmed, but local recovery state could not be cleared. Keep the original action blocked and retry readback.');
        return;
      }
      original.current = null;
      setUnknown(null);
      setError('');
      onChanged();
    } catch {
      if (sessionPrincipalId() === principal && original.current?.key === key)
        setError('Mining activity is unavailable. The original request remains unresolved.');
    }
  };

  const act = async (operation: 'redeem' | 'cancel') => {
    const principal = sessionPrincipalId();
    if (!principal || busy || unknown) return;
    const intent = getIntentKey(null, JSON.stringify([principal, subscriptionId, operation]), 'mining:action');
    if (!persistPendingEconomicIntent(kind, { principal, intent, context: { subscriptionId, operation } })) {
      const saved = readPendingEconomicIntent(kind, principal);
      original.current = saved?.intent ?? null;
      setUnknown(saved ? { key: saved.intent.key,
        operation: saved.context.operation === 'redeem' || saved.context.operation === 'cancel' ? saved.context.operation : null
      } : { key: 'unresolved', operation: null });
      setError('Previous action or recovery storage is unresolved. Do not send another request.');
      return;
    }
    original.current = intent;
    setUnknown({ key: intent.key, operation });
    setBusy(operation);
    setError('');
    try {
      const response = await api.post<RecordValue>(`/mining/${operation}`, { subscriptionId, idempotencyKey: intent.key });
      if (sessionPrincipalId() !== principal) return;
      if (String(response.data?.status) !== (operation === 'redeem' ? 'COMPLETED' : 'CANCELLED'))
        setError('The server returned a different terminal state. Check the original request.');
      await recheck(intent.key, operation);
    } catch (cause) {
      if (sessionPrincipalId() !== principal) return;
      const status = (cause as { response?: { status?: number } } | null)?.response?.status;
      // A rejected replay can follow an earlier committed reserve/release.
      // Only the owner-scoped durable activity can resolve this original key.
      setError(status
        ? `Mining action returned HTTP ${status}; its original outcome remains unresolved. Recheck account activity before another request.`
        : 'Mining outcome is unknown. Recheck the original action before submitting another.');
    } finally {
      setBusy(null);
    }
  };

  return <div className="min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="min-w-0 break-words font-semibold">{authoritativeValue(position.plan && typeof position.plan === 'object' ? (position.plan as RecordValue).name : position.planId)}</span>
      <StatusBadge state={normalizeProductState(position.status, EARN_STATES)} />
    </div>
    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
      <MetricLike label="Amount" value={authoritativeValue(position.amountDecimal ?? position.amount)} />
      <MetricLike label="Reward" value={authoritativeValue(position.totalRewardsDecimal ?? position.totalRewards)} />
      <MetricLike label="End" value={authoritativeValue(position.endDate)} />
    </div>
    {error && <p role="alert" className="mt-3 break-words text-sm text-[#FFB8C5]">{error}</p>}
    {unknown && <div role="alert" className="mt-3 rounded-lg border border-amber-300/30 p-3 text-sm text-amber-100">
      Earlier mining action unresolved. New actions are blocked, including after reload.
      <button type="button" onClick={() => void recheck(unknown.key, unknown.operation)}
        className="mt-2 block min-h-11 rounded-lg border border-amber-300/40 px-3 font-semibold">Recheck original mining action</button>
    </div>}
    {active && <div className="mt-3 flex flex-wrap gap-2">
      <SecondaryButton onClick={() => void act('redeem')} disabled={busy !== null || Boolean(unknown)}>{busy === 'redeem' ? 'Redeeming…' : 'Redeem'}</SecondaryButton>
      <SecondaryButton onClick={() => void act('cancel')} disabled={busy !== null || Boolean(unknown)}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel'}</SecondaryButton>
    </div>}
  </div>;
}

function MetricLike({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-[#8C8299]">{label}</p><p className="mt-1 break-words font-mono text-[#F8F6FF]">{value}</p></div>; }
