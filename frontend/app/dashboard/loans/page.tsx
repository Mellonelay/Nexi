'use client';

import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LocalDateTime, { useLocalDateTime } from '../../components/LocalDateTime';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileText,
  History,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import api from '../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../lib/intent-key';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../lib/pending-economic-intent';
import { finiteMarketNumber } from '../../lib/market-data';
import { decimalAmountWithinBalance, decimalLessThanOrEqual } from '../../lib/trading-states';
import {
  authoritativeValue,
  LoanState,
  normalizeLoanState,
} from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import {
  DataStatePanel,
  Field,
  inputClass,
  Metric,
  PageHeader,
  PageShell,
  Panel,
  PanelHeading,
  PrimaryButton,  SecondaryButton,
  StatusBadge,
} from '../../components/PagePrimitives';

type LoadState = 'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR';

type LoanRecord = {
  id?: unknown;
  userId?: unknown;
  amount?: unknown;
  amountDecimal?: unknown;
  currency?: unknown;
  durationDays?: unknown;
  term?: unknown;
  interestRate?: unknown;
  totalRepayment?: unknown;
  totalRepaymentDecimal?: unknown;
  totalRepaidDecimal?: unknown;
  status?: unknown;
  createdAt?: unknown;
  approvedAt?: unknown;
  dueDate?: unknown;
  repaymentStatus?: unknown;
  nextRepaymentAt?: unknown;
  collateral?: unknown;
  repayments?: Array<{ amountDecimal?: unknown; amount?: unknown; paidAt?: unknown }>;
};

type LoanPlan = {
  id?: unknown;
  name?: unknown;
  currency?: unknown;
  durationDays?: unknown;
  interestRate?: unknown;
  minAmount?: unknown;
  maxAmount?: unknown;
};

const positiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const positiveInteger = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const loanKey = (loan: LoanRecord) => String(loan.id ?? [loan.createdAt, loan.amount, loan.currency, loan.dueDate].map((value) => authoritativeValue(value)).join(':'));

const loanStatusCopy = (state: LoanState | 'UNAVAILABLE') => {
  switch (state) {
    case 'PENDING': return 'Application is awaiting review.';
    case 'APPROVED': return 'Approved; activation details are not yet available.';
    case 'ACTIVE': return 'Loan is active. Repayment details are shown when available.';
    case 'PAID': return 'Loan is marked as paid.';
    case 'OVERDUE': return 'Repayment is overdue.';
    case 'REJECTED': return 'Application was not approved.';
    default: return 'Loan status is unavailable.';
  }
};

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [plans, setPlans] = useState<LoanPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [plansState, setPlansState] = useState<LoadState>('LOADING');
  const [state, setState] = useState<LoadState>('LOADING');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [collateral, setCollateral] = useState('');
  const [collateralImg, setCollateralImg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [repaymentLoanId, setRepaymentLoanId] = useState<string | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const pendingApplication = useRef<PendingIntentKey | null>(null);
  const [unknownApplicationKey, setUnknownApplicationKey] = useState<string | null>(null);
  const pendingRepayment = useRef<PendingIntentKey | null>(null);
  const [unknownRepaymentKey, setUnknownRepaymentKey] = useState<string | null>(null);
  const backendConfigured = true;
  useEffect(() => {
    const sync = () => {
      const next = sessionPrincipalId();
      if (previousUserId.current !== next) {
        setLoans([]);
        setSelectedPlanId('');
        setAmount('');
        setDuration('');
        setCollateral('');
        setCollateralImg('');
        setRepaymentLoanId(null);
        setRepaymentAmount('');
        setMessage(null);
        const previous = next ? readPendingEconomicIntent('loan-application', next) : null;
        pendingApplication.current = previous?.intent ?? null;
        setUnknownApplicationKey(previous?.intent.key ?? null);
        const repayment = next ? readPendingEconomicIntent('loan-repayment', next) : null;
        pendingRepayment.current = repayment?.intent ?? null;
        setUnknownRepaymentKey(repayment?.intent.key ?? null);
        setState(next ? 'LOADING' : 'UNAVAILABLE');
        previousUserId.current = next;
      }
      setUserId(next);
      setSessionChecked(true);
    };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const load = useCallback(async () => {
    if (!sessionChecked || sessionPrincipalId() !== userId) return;
    setPlansState('LOADING');
    try {
      const planResult = await api.get('/loans/plans');
      setPlans(Array.isArray(planResult.data) ? planResult.data : []);
      setPlansState('LIVE');
    } catch {
      setPlans([]);
      setPlansState('ERROR');
    }
    if (sessionPrincipalId() !== userId) return;
    if (!userId || !backendConfigured) {
      setLoans([]);
      setState('UNAVAILABLE');
      return;
    }
    setState('LOADING');
    try {
      const result = await api.get(`/loans/my/${userId}`);
      if (sessionPrincipalId() !== userId) return;
      setLoans(Array.isArray(result.data) ? result.data : []);
      setState('LIVE');
    } catch {
      if (sessionPrincipalId() !== userId) return;
      setLoans([]);
      setState('ERROR');
    }
  }, [backendConfigured, sessionChecked, userId]);

  useEffect(() => {
    void load();
  }, [load]);
  const activeLoans = useMemo(
    () => loans.filter((loan) => ['ACTIVE', 'OVERDUE'].includes(normalizeLoanState(loan.status))),
    [loans],
  );
  const nextDueAt = useMemo(() => {
    const dates = activeLoans
      .map((loan) => typeof loan.dueDate === 'string' ? Date.parse(loan.dueDate) : Number.NaN)
      .filter(Number.isFinite)
      .sort((left, right) => left - right);
    return dates[0] ?? null;
  }, [activeLoans]);
  const nextDue = useLocalDateTime(nextDueAt, { dateStyle: 'medium' });

  const principal = positiveNumber(amount);
  const durationDays = positiveInteger(duration);
  const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);
  const selectedRate = selectedPlan ? finiteMarketNumber(selectedPlan.interestRate) : null;
  const principalWithinPlan = Boolean(selectedPlan && decimalLessThanOrEqual(selectedPlan.minAmount, amount.trim())
    && decimalAmountWithinBalance(amount.trim(), selectedPlan.maxAmount));
  const durationMatchesPlan = selectedPlan !== undefined && durationDays !== null
    && durationDays === Number(selectedPlan.durationDays);
  const interestPreview = principal !== null && selectedRate !== null ? principal * selectedRate : null;
  const totalPreview = principal !== null && interestPreview !== null ? principal + interestPreview : null;
  const recheckLoanApplication = async (key: string) => {
    const principal = sessionPrincipalId();
    if (!principal || principal !== userId || pendingApplication.current?.key !== key) {
      setMessage('Verify the original loan applicant wallet session.');
      return;
    }
    try {
      const response = await api.get<LoanRecord | null>('/loans/applications/by-intent', {
        params: { idempotencyKey: key },
      });
      if (sessionPrincipalId() !== principal || pendingApplication.current?.key !== key) return;
      if (!response.data || typeof response.data.id !== 'string') {
        setMessage('The original loan application is not yet confirmed. Do not resubmit it.');
        return;
      }
      if (!clearPendingEconomicIntent('loan-application', principal, key)) {
        setMessage('Loan application confirmed, but recovery storage could not be cleared. Do not submit another application.');
        return;
      }
      pendingApplication.current = null;
      setUnknownApplicationKey(null);
      setMessage('Original loan application confirmed in your account records.');
      await load();
    } catch {
      if (sessionPrincipalId() === principal && pendingApplication.current?.key === key)
        setMessage('Loan application readback unavailable. Original request remains unresolved.');
    }
  };

  const reviewApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (unknownApplicationKey || submitting) {
      setMessage('An original loan application is unresolved. Recheck it before submitting another.');
      return;
    }
    if (!userId || sessionPrincipalId() !== userId) {
      setMessage('Verify your wallet before submitting a loan application.');
      return;
    }
    if (plans.length === 0) {
      setMessage('No active loan products are available for application.');
      return;
    }
    const selectedPlan = plans.find((plan) => String(plan.id) === selectedPlanId);
    if (!selectedPlan) {
      setMessage('Select a loan product before applying.');
      return;
    }
    if (!principalWithinPlan || !durationMatchesPlan) {
      setMessage('Enter an amount within the selected plan limits and use its configured duration.');
      return;
    }
    if (!collateral.trim() || !collateralImg.trim()) {
      setMessage('Provide collateral details and an approved document reference.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      pendingApplication.current = getIntentKey(pendingApplication.current, JSON.stringify([userId, selectedPlanId, amount.trim(), durationDays, collateral.trim(), collateralImg.trim()]), 'loan:apply');
      const idempotencyKey = pendingApplication.current.key;
      if (!persistPendingEconomicIntent('loan-application', {
        principal: userId, intent: { key: idempotencyKey, fingerprint: 'redacted' }, context: { planId: selectedPlanId },
      })) {
        const saved = readPendingEconomicIntent('loan-application', userId);
        pendingApplication.current = saved?.intent ?? null;
        setUnknownApplicationKey(saved?.intent.key ?? 'unresolved');
        setMessage('Previous loan application or recovery storage is unresolved. Do not submit another.');
        return;
      }
      setUnknownApplicationKey(idempotencyKey);
      const response = await api.post<LoanRecord>('/loans/apply', {
        planId: selectedPlanId,
        amount: amount.trim(),
        duration: durationDays,
        collateral: collateral.trim(),
        collateralImg: collateralImg.trim(),
        idempotencyKey,
      });
      if (sessionPrincipalId() !== userId) return;
      if (typeof response.data?.id !== 'string' || !response.data.id || String(response.data.userId) !== userId) {
        setMessage('Loan application acknowledgement was incomplete. Recheck the original request.');
        return;
      }
      await recheckLoanApplication(idempotencyKey);
      if (pendingApplication.current?.key === idempotencyKey) return;
      setAmount('');
      setDuration('');
      setCollateral('');
      setCollateralImg('');
      setMessage('Application submitted for review.');
      await load();
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number; data?: { message?: unknown } } })?.response?.status;
      if ([400, 401, 403, 404, 422].includes(status ?? -1) && pendingApplication.current) {
        if (!clearPendingEconomicIntent('loan-application', userId, pendingApplication.current.key)) {
          setUnknownApplicationKey(pendingApplication.current.key);
          setMessage('Application rejected, but recovery storage could not be cleared. Do not submit another until reconciled.');
          return;
        }
        pendingApplication.current = null;
        setUnknownApplicationKey(null);
        setMessage('Loan application was rejected. Review eligibility before retrying.');
      } else {
        setMessage('Loan application outcome unknown. Recheck the original request before retrying.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  const recheckLoanRepayment = async (key: string) => {
    const principal = sessionPrincipalId();
    const saved = principal ? readPendingEconomicIntent('loan-repayment', principal) : null;
    const loanId = saved?.context.loanId;
    if (!principal || principal !== userId || pendingRepayment.current?.key !== key || !loanId) {
      setMessage('Verify the original wallet session and repayment request.');
      return;
    }
    try {
      const response = await api.get<{ activities: Array<{
        type?: string; status?: string; idempotencyKey?: string; referenceId?: string; ledgerCorrelationId?: string;
        ledgerPostingId?: string;
        relatedLedgerPostings?: Array<{ id?: string; kind?: string; referenceId?: string; correlationId?: string }>;
      }> }>('/wallet/activity', {
        params: { type: 'LOAN_REPAYMENT', status: 'COMPLETED', referenceId: loanId, correlationId: key, limit: 1 },
      });
      if (sessionPrincipalId() !== principal || pendingRepayment.current?.key !== key) return;
      if (!Array.isArray(response.data?.activities) || !response.data.activities.some((row) =>
        row.type === 'LOAN_REPAYMENT' && row.status === 'COMPLETED'
        && row.idempotencyKey === `loan-repayment:${loanId}:${key}`
        && row.referenceId === loanId && row.ledgerCorrelationId === key
        && Array.isArray(row.relatedLedgerPostings) && row.relatedLedgerPostings.some((posting) =>
          posting.id === row.ledgerPostingId && posting.kind === 'DEBIT'
          && posting.referenceId === loanId && posting.correlationId === key))) {
        setMessage('Original repayment is not confirmed in the Ledger activity. Do not submit it again.');
        return;
      }
      if (!clearPendingEconomicIntent('loan-repayment', principal, key)) {
        setUnknownRepaymentKey(key);
        setMessage('Repayment confirmed, but recovery storage could not be cleared. Do not submit another repayment.');
        return;
      }
      pendingRepayment.current = null;
      setUnknownRepaymentKey(null);
      setRepaymentAmount('');
      setRepaymentLoanId(null);
      setMessage('Original loan repayment confirmed in account activity.');
      await load();
    } catch {
      if (sessionPrincipalId() === principal && pendingRepayment.current?.key === key)
        setMessage('Repayment activity unavailable. The original request remains unresolved.');
    }
  };

  const repayLoan = async () => {
    if (!userId || sessionPrincipalId() !== userId || !repaymentLoanId || !decimalAmountWithinBalance(repaymentAmount.trim(), repaymentAmount.trim()) || unknownRepaymentKey || repaying) return;
    setRepaying(true);
    setMessage(null);
    try {
      pendingRepayment.current = getIntentKey(null, JSON.stringify([userId, repaymentLoanId, repaymentAmount.trim()]), 'loan:repay');
      const intentKey = pendingRepayment.current.key;
      if (!persistPendingEconomicIntent('loan-repayment', {
        principal: userId, intent: pendingRepayment.current, context: { loanId: repaymentLoanId },
      })) {
        const saved = readPendingEconomicIntent('loan-repayment', userId);
        pendingRepayment.current = saved?.intent ?? null;
        setUnknownRepaymentKey(saved?.intent.key ?? 'unresolved');
        setMessage('A previous repayment or recovery storage is unresolved. Do not retry.');
        return;
      }
      setUnknownRepaymentKey(intentKey);
      const response = await api.post<LoanRecord>('/loans/repay', {
        loanId: repaymentLoanId,
        amount: repaymentAmount.trim(),
        idempotencyKey: intentKey,
      });
      if (sessionPrincipalId() !== userId) return;
      if (String(response.data?.id ?? '') !== repaymentLoanId || String(response.data?.userId ?? '') !== userId) {
        setMessage('Repayment acknowledgement was incomplete. Recheck original Ledger activity.');
        return;
      }
      await recheckLoanRepayment(intentKey);
    } catch (error) {
      if (sessionPrincipalId() !== userId) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if ([400, 401, 403, 404, 422].includes(status ?? -1) && pendingRepayment.current) {
        if (!clearPendingEconomicIntent('loan-repayment', userId, pendingRepayment.current.key)) {
          setUnknownRepaymentKey(pendingRepayment.current.key);
          setMessage('Repayment request rejected, but recovery storage could not be cleared. Keep the original action locked.');
          return;
        }
        pendingRepayment.current = null;
        setUnknownRepaymentKey(null);
        setMessage('Repayment request was rejected. Review amount and loan status.');
      } else setMessage('Repayment outcome is unknown. Recheck the original Ledger activity before retrying.');
    } finally {
      setRepaying(false);
    }
  };
  return (
    <PageShell>
      <PageHeader
        eyebrow="Credit products"
        title="Loan"
        description="Review eligibility, available products, applications, repayments, and history."
        action={<SecondaryButton onClick={() => void load()}><RefreshCw size={16} className="mr-2 inline" />Refresh</SecondaryButton>}
      />

      {unknownRepaymentKey && <div role="alert" className="mx-auto mb-4 max-w-7xl rounded-xl border border-amber-300/30 p-4 text-sm text-amber-100">An earlier loan repayment outcome is unresolved. New repayments are blocked until Ledger activity confirms the original key. <button type="button" onClick={() => void recheckLoanRepayment(unknownRepaymentKey)} className="ml-2 min-h-11 rounded-lg border border-amber-300/30 px-3 font-semibold">Recheck original repayment</button></div>}
      {unknownApplicationKey && <div role="alert" className="mx-auto mb-4 max-w-7xl rounded-xl border border-amber-300/30 p-4 text-sm text-amber-100">An earlier loan application outcome is unresolved. New applications are blocked until its original request is confirmed. <button type="button" onClick={() => void recheckLoanApplication(unknownApplicationKey)} className="ml-2 min-h-11 rounded-lg border border-amber-300/30 px-3 font-semibold">Recheck original loan application</button></div>}
      <main className="mx-auto max-w-7xl space-y-4">
        <section className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-4" aria-label="Loan summary">
          <Metric label="Eligibility" value="Not assessed" hint="Applications require Backend review and approval" />
          <Metric label="Products" value={plansState === 'LIVE' ? authoritativeValue(plans.length) : '—'} hint="Available products" />
          <Metric label="Active loans" value={state === 'LIVE' ? authoritativeValue(activeLoans.length) : '—'} hint="Includes overdue records" />
          <Metric label="Next repayment" value={nextDue} hint="Available due date" />
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
          <div className="space-y-4">
            <LoanProductsPanel plans={plans} plansState={plansState} />
            <LoanLifecyclePanel />
            <LoanHistoryPanel state={state} loans={loans} backendConfigured={backendConfigured} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <LoanApplicationPanel
              plans={plans}
              selectedPlanId={selectedPlanId}
              onSelectedPlanIdChange={setSelectedPlanId}
              amount={amount}
              onAmountChange={setAmount}
              duration={duration}
              onDurationChange={setDuration}
              collateral={collateral}
              onCollateralChange={setCollateral}
              collateralImg={collateralImg}
              onCollateralImgChange={setCollateralImg}
              principal={principal}
              durationDays={durationDays}
              interestPreview={interestPreview}
              totalPreview={totalPreview}
              message={message}
              submitting={submitting}
              blocked={Boolean(unknownApplicationKey)}
              userId={userId}
              onSubmit={reviewApplication}
            />

            <LoanRepaymentCenter
              activeLoans={activeLoans}
              repaymentLoanId={repaymentLoanId}
              onRepaymentLoanIdChange={setRepaymentLoanId}
              repaymentAmount={repaymentAmount}
              onRepaymentAmountChange={setRepaymentAmount}
              onRepay={repayLoan}
              repaying={repaying}
              blocked={Boolean(unknownRepaymentKey)}
            />
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

function LoanProductsPanel({ plans, plansState }: { plans: LoanPlan[]; plansState: LoadState }) {
  return (
    <Panel>
      <PanelHeading
        title="Eligibility and products"
        description="Loan terms appear when available products are returned."
        action={<ShieldCheck size={18} className="text-[#48C0CC]" />}
      />
      {plansState === 'LOADING' && <DataStatePanel state="LOADING" title="Loading loan products" />}
      {plansState === 'ERROR' && <DataStatePanel state="ERROR" title="Loan product catalog unavailable" message="Loan products could not be loaded." />}
      {plansState === 'LIVE' && plans.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No active loan products" message="No active loan products are available." />}
      {plansState === 'LIVE' && plans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <article key={String(plan.id)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{authoritativeValue(plan.name)}</h3><StatusBadge state="AVAILABLE" /></div>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm min-[430px]:grid-cols-2">
                <ReviewRow label="Asset" value={authoritativeValue(plan.currency)} stacked />
                <ReviewRow label="Term" value={`${authoritativeValue(plan.durationDays)} days`} stacked />
                <ReviewRow label="Term rate" value={finiteMarketNumber(plan.interestRate) === null ? '—' : `${(Number(plan.interestRate) * 100).toFixed(2)}% per plan term`} stacked />
                <ReviewRow label="Limits" value={`${authoritativeValue(plan.minAmount)} – ${authoritativeValue(plan.maxAmount)}`} stacked />
              </dl>
            </article>
          ))}
        </div>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ProductFact label="Principal and currency" value="—" />
        <ProductFact label="Rate, fee, repayment" value="—" />
        <ProductFact label="Term and collateral" value="—" />
      </div>
    </Panel>
  );
}

function LoanLifecyclePanel() {
  return (
    <Panel>
      <PanelHeading
        title="Application lifecycle"
        description="Review, approval, activation, repayment, and history are shown when available."
        action={<CheckCircle2 size={18} className="text-[#A995FF]" />}
      />
      <ol className="grid gap-2 sm:grid-cols-3">
        {['REVIEW', 'PENDING', 'APPROVED', 'ACTIVE', 'OVERDUE', 'PAID'].map((stage, index) => (
          <li key={stage} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3">
            <p className="font-mono text-[10px] text-[#8C8299]">0{index + 1}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#F2ECFA]">{stage.replaceAll('_', ' ')}</p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function LoanHistoryPanel({ state, loans, backendConfigured }: { state: LoadState; loans: LoanRecord[]; backendConfigured: boolean }) {
  return (
    <Panel>
      <PanelHeading title="Application and repayment history" action={<History size={18} className="text-[#8C8299]" />} />
      {state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading loan history" />}
      {state === 'UNAVAILABLE' && (
        <DataStatePanel
          state="UNAVAILABLE"
          title={!backendConfigured ? 'Loan history unavailable' : 'Sign in to load loan history'}
          message={!backendConfigured ? 'Loan history is not available right now.' : undefined}
        />
      )}
      {state === 'ERROR' && <DataStatePanel state="ERROR" title="Loan history unavailable" />}
      {state === 'LIVE' && loans.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No loan records returned" message="There are no pending, active, repayment, or historical records to show." />}
      {state === 'LIVE' && loans.length > 0 && <div className="space-y-3">{loans.map((loan) => <LoanRecordCard key={loanKey(loan)} loan={loan} />)}</div>}
    </Panel>
  );
}

function LoanApplicationPanel({
  plans,
  selectedPlanId,
  onSelectedPlanIdChange,
  amount,
  onAmountChange,
  duration,
  onDurationChange,
  collateral,
  onCollateralChange,
  collateralImg,
  onCollateralImgChange,
  principal,
  durationDays,
  interestPreview,
  totalPreview,
  message,
  submitting,
  blocked,
  userId,
  onSubmit,
}: {
  plans: LoanPlan[];
  selectedPlanId: string;
  onSelectedPlanIdChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  duration: string;
  onDurationChange: (value: string) => void;
  collateral: string;
  onCollateralChange: (value: string) => void;
  collateralImg: string;
  onCollateralImgChange: (value: string) => void;
  principal: number | null;
  durationDays: number | null;
  interestPreview: number | null;
  totalPreview: number | null;
  message: string | null;
  submitting: boolean;
  blocked: boolean;
  userId: string | null;
  onSubmit: (event: FormEvent) => Promise<void>;
}) {
  const selectedPlan = plans.find((item) => String(item.id) === selectedPlanId);
  const withinLimits = Boolean(selectedPlan && decimalLessThanOrEqual(selectedPlan.minAmount, amount.trim())
    && decimalAmountWithinBalance(amount.trim(), selectedPlan.maxAmount));
  const matchesDuration = selectedPlan !== undefined && durationDays !== null && durationDays === Number(selectedPlan.durationDays);
  const canApply = Boolean(userId && selectedPlan && withinLimits && matchesDuration && collateral.trim() && collateralImg.trim());
  const selectPlan = (planId: string) => {
    onSelectedPlanIdChange(planId);
    const plan = plans.find((item) => String(item.id) === planId);
    if (plan) onDurationChange(String(plan.durationDays ?? ''));
  };
  return (
    <Panel>
      <PanelHeading
        title="Application review"
        description="Enter an application with an approved collateral document reference."
        action={<FileText size={18} className="text-[#48C0CC]" />}
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Loan product" hint="Terms are based on the selected loan product.">
          <select aria-label="Loan product" className={inputClass} value={selectedPlanId} onChange={(event) => selectPlan(event.target.value)}>
            <option value="">Select a product</option>
            {plans.map((plan) => <option key={String(plan.id)} value={String(plan.id)}>{authoritativeValue(plan.name)} · {authoritativeValue(plan.currency)} · {authoritativeValue(plan.durationDays)} days</option>)}
          </select>
        </Field>
        <Field label="Requested principal" hint="Limits appear when a product is available.">
          <div className="relative">
            <input aria-label="Requested principal" className={`${inputClass} pr-16 text-right font-mono`} value={amount} onChange={(event) => onAmountChange(event.target.value)} inputMode="decimal" placeholder="0.00" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C8299]">{authoritativeValue(selectedPlan?.currency)}</span>
          </div>
        </Field>
        <Field label="Duration (days)" hint="Choose a duration when product terms are available.">
          <input aria-label="Duration in days" className={`${inputClass} text-right font-mono`} value={duration} onChange={(event) => onDurationChange(event.target.value)} inputMode="numeric" placeholder="—" />
        </Field>
        <Field label="Collateral document">
          <input aria-label="Collateral document reference" className={inputClass} value={collateralImg} onChange={(event) => onCollateralImgChange(event.target.value)} aria-describedby="collateral-help" placeholder="Approved URL or storage key" />
          <span id="collateral-help" className="mt-2 block text-xs leading-5 text-[#8C8299]">Use a reference from the approved document-storage flow; this form does not upload files.</span>
        </Field>
        <Field label="Collateral details">
          <textarea aria-label="Collateral details" className={`${inputClass} min-h-24 resize-y`} value={collateral} onChange={(event) => onCollateralChange(event.target.value)} placeholder="Describe the collateral supporting this application." />
        </Field>
        <div className="rounded-xl border border-[#49335E] bg-[#0B0711] p-3 text-sm text-[#C3BBD0]">
          <div className="flex items-center gap-2 font-semibold"><WalletCards size={16} className="text-[#48C0CC]" />Repayment preview</div>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-xs min-[430px]:grid-cols-2">
            <ProductFact label="Principal" value={principal === null || !selectedPlan ? '—' : `${principal} ${authoritativeValue(selectedPlan.currency)}`} compact />
            <ProductFact label="Duration" value={durationDays === null ? '—' : `${durationDays} days`} compact />
            <ProductFact label="Estimated interest" value={interestPreview === null || !selectedPlan ? '—' : `${interestPreview.toFixed(4)} ${authoritativeValue(selectedPlan.currency)}`} compact />
            <ProductFact label="Estimated total repayment" value={totalPreview === null || !selectedPlan ? '—' : `${totalPreview.toFixed(4)} ${authoritativeValue(selectedPlan.currency)}`} compact />
          </dl>
        </div>
        <p className="text-xs text-[#8C8299]">Illustrative plan-term estimate only; the recorded loan agreement and Ledger amounts are authoritative.</p>
        {message && (
          <div className="rounded-xl border border-[#F2C94C]/30 bg-[#3D3110]/40 p-4 text-sm leading-6 text-[#FDE68A]" role="status">
            <AlertTriangle size={16} className="mr-2 inline" />{message}
          </div>
        )}
        {selectedPlan && !withinLimits && <p role="status" className="text-xs text-amber-200">
          Enter a principal from {authoritativeValue(selectedPlan.minAmount)} to {authoritativeValue(selectedPlan.maxAmount)} {authoritativeValue(selectedPlan.currency)}.
        </p>}
        {selectedPlan && !matchesDuration && <p role="status" className="text-xs text-amber-200">Use the selected plan's {authoritativeValue(selectedPlan.durationDays)}-day term.</p>}
        <p className="text-xs text-[#8C8299]">Applications require both collateral details and a previously approved document reference. Product availability does not establish individual approval.</p>
        <PrimaryButton type="submit" disabled={submitting || blocked || !canApply}>
          {blocked ? 'Recheck original application' : submitting ? 'Submitting…' : plans.length === 0 ? 'No active products' : 'Submit application'}
        </PrimaryButton>
      </form>
    </Panel>
  );
}

function LoanRepaymentCenter({
  activeLoans,
  repaymentLoanId,
  onRepaymentLoanIdChange,
  repaymentAmount,
  onRepaymentAmountChange,
  onRepay,
  repaying,
  blocked,
}: {
  activeLoans: LoanRecord[];
  repaymentLoanId: string | null;
  onRepaymentLoanIdChange: (value: string | null) => void;
  repaymentAmount: string;
  onRepaymentAmountChange: (value: string) => void;
  onRepay: () => Promise<void>;
  repaying: boolean;
  blocked: boolean;
}) {
  return (
    <Panel>
      <PanelHeading title="Repayment center" description="Due dates, payment amounts, and completion details appear for active loans." action={<CalendarClock size={18} className="text-[#A995FF]" />} />
      {activeLoans.length === 0 ? (
        <DataStatePanel state="UNAVAILABLE" title="No active repayment available" message="No active or overdue loan is available for repayment." />
      ) : (
        <div className="space-y-3">
          {activeLoans.map((loan) => (
            <div key={loanKey(loan)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold">Loan {authoritativeValue(loan.id)}</p><StatusBadge state={normalizeLoanState(loan.status)} /></div>
              <dl className="mt-3 space-y-2 text-sm"><ReviewRow label="Total repayment" value={authoritativeValue(loan.totalRepaymentDecimal ?? loan.totalRepayment)} /><ReviewRow label="Due date" value={<LocalDateTime value={typeof loan.dueDate === 'string' ? loan.dueDate : null} dateStyle="medium" />} /></dl>
              <div className="mt-3 flex flex-col gap-2 min-[430px]:flex-row">
                <input aria-label="Repayment amount" className={`${inputClass} min-w-0`} value={repaymentLoanId === String(loan.id) ? repaymentAmount : ''} onChange={(event) => { onRepaymentLoanIdChange(String(loan.id)); onRepaymentAmountChange(event.target.value); }} inputMode="decimal" placeholder="Payment amount" />
                <SecondaryButton onClick={() => void onRepay()} disabled={repaying || blocked || repaymentLoanId !== String(loan.id) || !decimalAmountWithinBalance(repaymentAmount.trim(), repaymentAmount.trim())}>{blocked ? 'Recheck prior repayment' : repaying && repaymentLoanId === String(loan.id) ? 'Paying…' : 'Repay'}</SecondaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ProductFact({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return <div className={`min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] ${compact ? 'p-3' : 'p-4'}`}><dt className="text-[10px] uppercase tracking-[0.1em] text-[#8C8299]">{label}</dt><dd className="mt-2 break-words font-mono text-sm text-[#F8F6FF]">{value}</dd></div>;
}
function LoanRecordCard({ loan }: { loan: LoanRecord }) {
  const status = normalizeLoanState(loan.status);
  return (
    <article className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">Loan {authoritativeValue(loan.id)}</h3><p className="mt-1 text-xs leading-5 text-[#8C8299]">{loanStatusCopy(status)}</p></div>
        <StatusBadge state={status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <ReviewRow label="Principal" value={`${authoritativeValue(loan.amountDecimal ?? loan.amount)} ${authoritativeValue(loan.currency)}`} stacked />
        <ReviewRow label="Term" value={`${authoritativeValue(loan.durationDays ?? loan.term)} days`} stacked />
        <ReviewRow label="Total repayment" value={authoritativeValue(loan.totalRepaymentDecimal ?? loan.totalRepayment)} stacked />
        <ReviewRow label="Repaid" value={authoritativeValue(loan.totalRepaidDecimal ?? '0')} stacked />
        <ReviewRow label="Due date" value={<LocalDateTime value={typeof (loan.dueDate ?? loan.nextRepaymentAt) === 'string' ? String(loan.dueDate ?? loan.nextRepaymentAt) : null} dateStyle="medium" />} stacked />
      </dl>
    </article>
  );
}

function ReviewRow({ label, value, stacked = false }: { label: string; value: ReactNode; stacked?: boolean }) {
  if (stacked) {
    return <div className="min-w-0"><dt className="text-xs text-[#8C8299]">{label}</dt><dd className="mt-1 break-words font-mono text-sm text-[#F8F6FF]">{value}</dd></div>;
  }
  return <div className="flex min-w-0 items-start justify-between gap-4"><dt className="text-[#8C8299]">{label}</dt><dd className="min-w-0 break-words text-right font-mono text-[#F8F6FF]">{value}</dd></div>;
}
