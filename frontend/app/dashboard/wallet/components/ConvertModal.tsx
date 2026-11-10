'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { sessionPrincipalId } from '../../../lib/wallet-auth';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../../lib/pending-economic-intent';
import { decimalAmountWithinBalance } from '../../../lib/trading-states';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligiblePairs: Array<{ from: string; to: string }>;
  fundingBalances: Array<{ asset: string; available: string }>;
  walletReadState: 'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR';
  eligibilityStatus: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  onRetryEligibility: () => void;
  selectedCurrency: string;
  onCompleted?: () => void | Promise<void>;
}

type Quote = { id: string; fromAsset: string; toAsset: string; inputAmount: string; outputAmount: string; rate: string; expiresAt: string };

function conversionFailureMessage(error: unknown, phase: 'quote' | 'accept') {
  const response = (error as { response?: { data?: { message?: unknown } } } | null)?.response;
  const raw = response?.data?.message;
  const message = Array.isArray(raw) ? raw.join(' ') : typeof raw === 'string' ? raw : '';
  if (/insufficient (?:funds|balance)/i.test(message)) return 'The Funding account has insufficient available source asset. Transfer holdings from Spot to Funding, then request a fresh quote. No conversion has been confirmed.';
  if (/quote expired|conversion quote expired/i.test(message)) return 'This quote expired. Request a fresh quote to continue.';
  if (/unsupported|conversion market unavailable|conversion market quote unavailable/i.test(message)) return 'This pair is no longer eligible. Refresh the pair list and try again.';
  if (!response) return phase === 'accept'
    ? 'Conversion outcome is unknown. Check Wallet balances and activity before starting another conversion.'
    : 'Network connection failed. Check your connection before requesting a new quote.';
  return phase === 'quote' ? 'A quote could not be created for this pair. Review the amount and try again.' : 'The conversion could not be confirmed. Refresh wallet activity before retrying.';
}

export default function ConvertModal({ isOpen, onClose, eligiblePairs, fundingBalances, walletReadState, eligibilityStatus, onRetryEligibility, selectedCurrency, onCompleted }: ConvertModalProps) {
  const [fromAsset, setFromAsset] = useState('');
  const [toAsset, setToAsset] = useState('');
  const eligibleFrom = useMemo(() => [...new Set(eligiblePairs.map((pair) => pair.from))], [eligiblePairs]);
  const eligibleTargets = useMemo(() => [...new Set(eligiblePairs.filter((pair) => pair.from === fromAsset).map((pair) => pair.to))], [eligiblePairs, fromAsset]);
  const eligibleKey = eligiblePairs.map((pair) => `${pair.from}>${pair.to}`).sort().join('|');
  const [amount, setAmount] = useState('');
  const fundingAvailable = fundingBalances.find((balance) => balance.asset === fromAsset)?.available ?? '0';
  const fundingReady = walletReadState === 'LIVE' && decimalAmountWithinBalance(fundingAvailable, fundingAvailable);
  const fundingSufficient = fundingReady && decimalAmountWithinBalance(amount.trim(), fundingAvailable);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const submissionLock = useRef(false);
  const pendingQuoteIntent = useRef<PendingIntentKey | null>(null);
  const pendingAcceptIntent = useRef<PendingIntentKey | null>(null);
  const [unknownAcceptKey, setUnknownAcceptKey] = useState<string | null>(null);
  const pendingAcceptedQuoteId = useRef<string | null>(null);
  const pendingPrincipal = useRef<string | null>(null);

  useEffect(() => {
    const restore = () => {
      const principal = sessionPrincipalId();
      const stored = principal ? readPendingEconomicIntent('conversion', principal) : null;
      pendingAcceptIntent.current = stored?.intent ?? null;
      pendingAcceptedQuoteId.current = stored?.context.quoteId ?? null;
      pendingPrincipal.current = stored?.principal ?? null;
      setUnknownAcceptKey(stored?.intent.key ?? null);
    };
    restore();
    window.addEventListener('nexi:wallet-session', restore);
    return () => window.removeEventListener('nexi:wallet-session', restore);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const pairs = eligibleKey.split('|').filter(Boolean).map((value) => value.split('>'));
    const availableFrom = [...new Set(pairs.map(([from]) => from).filter(Boolean))];
    const preferred = selectedCurrency.trim().toUpperCase();
    const source = availableFrom.includes(preferred) ? preferred : (availableFrom[0] ?? '');
    setFromAsset(source);
    setToAsset(pairs.find(([from]) => from === source)?.[1] ?? '');
    if (!pendingAcceptedQuoteId.current) setQuote(null);
    setFeedback(null);
  }, [isOpen, selectedCurrency, eligibleKey]);

  useEffect(() => {
    if (!quote) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [quote]);

  const quoteExpiry = quote ? Date.parse(quote.expiresAt) : Number.NaN;
  const quoteExpired = Boolean(quote) && (!Number.isFinite(quoteExpiry) || quoteExpiry <= now);
  const close = () => {
    if (!unknownAcceptKey) {
      pendingQuoteIntent.current = null;
      pendingAcceptIntent.current = null;
    }
    onClose();
  };

  const recheckUnknownConversion = async (key: string) => {
    const principal = sessionPrincipalId();
    const quoteId = pendingAcceptedQuoteId.current;
    if (!principal || principal !== pendingPrincipal.current || !quoteId || pendingAcceptIntent.current?.key !== key) {
      setFeedback('Verify the original wallet session before checking this conversion.');
      return;
    }
    try {
      const correlationId = `gate2:conversion:${quoteId}`;
      const response = await api.get<{ activities: Array<{
        type?: string; status?: string; idempotencyKey?: string; referenceId?: string; ledgerCorrelationId?: string;
        details?: string; relatedLedgerPostings?: Array<{ id?: string; kind?: string; referenceId?: string; correlationId?: string }>;
      }> }>('/wallet/activity', { params: { limit: 1, type: 'CONVERSION', status: 'COMPLETED', referenceId: quoteId, correlationId } });
      if (sessionPrincipalId() !== principal || pendingAcceptIntent.current?.key !== key) return;
      const confirmed = Array.isArray(response.data?.activities) && response.data.activities.some((item) => {
        if (item?.type !== 'CONVERSION' || item.status !== 'COMPLETED'
          || item.idempotencyKey !== key || item.referenceId !== quoteId
          || item.ledgerCorrelationId !== correlationId) return false;
        let details: { debitPostingId?: string; creditPostingId?: string };
        try { details = JSON.parse(item.details ?? 'null') ?? {}; } catch { return false; }
        if (!details.debitPostingId || !details.creditPostingId || details.debitPostingId === details.creditPostingId) return false;
        const postings = item.relatedLedgerPostings ?? [];
        return postings.some((posting) =>
          posting.id === details.debitPostingId && posting.kind === 'DEBIT'
          && posting.referenceId === quoteId && posting.correlationId === correlationId)
          && postings.some((posting) =>
            posting.id === details.creditPostingId && posting.kind === 'CREDIT'
            && posting.referenceId === quoteId && posting.correlationId === correlationId);
      });
      if (!confirmed) {
        setFeedback('Conversion outcome is unresolved. Do not accept another quote; review Wallet activity or contact Support.');
        return;
      }
      if (!clearPendingEconomicIntent('conversion', principal, key)) {
        setUnknownAcceptKey(key);
        setFeedback('Conversion confirmed, but recovery storage could not be cleared. Do not accept another quote.');
        return;
      }
      pendingAcceptIntent.current = null;
      pendingAcceptedQuoteId.current = null;
      pendingPrincipal.current = null;
      pendingQuoteIntent.current = null;
      setUnknownAcceptKey(null);
      setQuote(null);
      setFeedback('Conversion confirmed in account activity.');
      try { await onCompleted?.(); } catch { toast.warning('Conversion confirmed, but Wallet refresh failed.'); }
    } catch {
      if (sessionPrincipalId() === principal && pendingAcceptIntent.current?.key === key)
        setFeedback('Conversion activity could not be checked. The original acceptance remains unresolved.');
    }
  };

  const requestQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current || unknownAcceptKey) return;
    if (!eligiblePairs.some((pair) => pair.from === fromAsset && pair.to === toAsset)) {
      setFeedback('This conversion pair is not currently supported. Refresh the pair list.');
      return;
    }
    if (fromAsset === toAsset || !decimalAmountWithinBalance(amount.trim(), amount.trim())) {
      setFeedback('Enter a valid amount greater than zero.');
      return;
    }
    if (!fundingSufficient) {
      setFeedback(walletReadState !== 'LIVE'
        ? 'Funding balances are unavailable. Refresh Wallet before requesting a quote.'
        : `Available Funding balance is ${fundingAvailable} ${fromAsset}. Transfer funds from Spot to Funding before requesting this conversion.`);
      return;
    }
    const intent = getIntentKey(pendingQuoteIntent.current, JSON.stringify([fromAsset, toAsset, amount]), 'conversion-quote');
    pendingQuoteIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await api.post<{ quote: Quote }>('/financial/conversion/quote', { fromAsset, toAsset, amount, quoteKey: intent.key });
      setQuote(response.data.quote);
      setNow(Date.now());
    } catch (error) {
      const message = conversionFailureMessage(error, 'quote');
      setFeedback(message);
      toast.error(message);
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!quote || submissionLock.current || unknownAcceptKey) return;
    if (quoteExpired) {
      setFeedback('This quote expired. Request a fresh quote to continue.');
      return;
    }
    const principal = sessionPrincipalId();
    if (!principal) { setFeedback('Verify your wallet session before accepting the quote.'); return; }
    const intent = getIntentKey(pendingAcceptIntent.current, `${principal}:${quote.id}`, 'conversion-accept');
    if (!persistPendingEconomicIntent('conversion', { principal, intent, context: { quoteId: quote.id } })) {
      setUnknownAcceptKey(readPendingEconomicIntent('conversion', principal)?.intent.key ?? 'unresolved');
      setFeedback('A previous conversion may be unresolved or recovery storage is unavailable. New acceptance is blocked until the original outcome is reconciled.');
      return;
    }
    pendingAcceptIntent.current = intent;
    pendingAcceptedQuoteId.current = quote.id;
    pendingPrincipal.current = principal;
    submissionLock.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const accepted = await api.post<{ quote?: { id?: string; acceptanceKey?: string; state?: string } }>('/financial/conversion/accept', { quoteId: quote.id, acceptanceKey: intent.key });
      if (sessionPrincipalId() !== principal) return;
      if (accepted.data?.quote?.id !== quote.id || accepted.data?.quote?.acceptanceKey !== intent.key || accepted.data?.quote?.state !== 'ACCEPTED') {
        setUnknownAcceptKey(intent.key);
        setFeedback('Conversion response did not confirm the original acceptance. Recheck durable activity before another conversion.');
        void recheckUnknownConversion(intent.key);
        return;
      }
      if (!clearPendingEconomicIntent('conversion', principal, intent.key)) {
        setUnknownAcceptKey(intent.key);
        setFeedback('Conversion accepted, but recovery storage could not be cleared. Do not accept another quote.');
        return;
      }
      pendingAcceptIntent.current = null;
      pendingAcceptedQuoteId.current = null;
      pendingPrincipal.current = null;
      setUnknownAcceptKey(null);
      toast.success('Conversion completed.');
      setQuote(null);
      close();
      try {
        await onCompleted?.();
      } catch {
        toast.warning('Conversion completed, but Wallet could not refresh. Reload balances and activity before starting another conversion.');
      }
    } catch (error) {
      if (sessionPrincipalId() !== principal) return;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if ([400, 401, 403, 404, 422].includes(status ?? -1)) {
        if (!clearPendingEconomicIntent('conversion', principal, intent.key)) {
          setUnknownAcceptKey(intent.key);
          setFeedback('Conversion request rejected, but recovery storage could not be cleared. Do not accept another quote.');
          return;
        }
        pendingAcceptIntent.current = null;
        pendingAcceptedQuoteId.current = null;
        pendingPrincipal.current = null;
        const message = conversionFailureMessage(error, 'accept');
        setFeedback(message);
        toast.error(message);
      } else {
        setUnknownAcceptKey(intent.key);
        setFeedback('Conversion outcome is unknown. Recheck Wallet activity before accepting another quote.');
        void recheckUnknownConversion(intent.key);
      }
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  };

  if (!isOpen) return null;
  const loadingPairs = eligibilityStatus === 'IDLE' || eligibilityStatus === 'LOADING';
  return <ModalSurface open={isOpen} onClose={close} title="Convert">
    <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl">
      <div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="convert-title" className="text-xl font-bold text-white">Convert</h2><button type="button" onClick={close} aria-label="Close conversion dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22} /></button></div>
      {unknownAcceptKey && <div role="alert" className="mx-4 mt-4 rounded-lg border border-amber-300/25 p-3 text-sm text-amber-100">
        Conversion acceptance outcome is unresolved. Further acceptance is disabled.
        <button type="button" onClick={() => void recheckUnknownConversion(unknownAcceptKey)} className="mt-2 block min-h-11 rounded-lg border border-amber-300/30 px-3 font-semibold">Recheck conversion</button>
      </div>}
      {quote ? <div className="space-y-4 p-6">
        {feedback && <p role="alert" className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{feedback}</p>}
        <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><p className="text-sm text-[#C3BBD0]">{quote.inputAmount} {quote.fromAsset} → <strong className="text-white">{quote.outputAmount} {quote.toAsset}</strong></p><p className="mt-2 text-xs text-[#8C8299]">Rate {quote.rate} · expires {Number.isFinite(quoteExpiry) ? new Date(quoteExpiry).toLocaleTimeString() : 'unknown'}</p></div>
        {quoteExpired && <p role="status" className="text-sm text-amber-200">Quote expired. Request another quote to continue.</p>}
        <button type="button" disabled={busy || quoteExpired || Boolean(unknownAcceptKey)} onClick={() => void accept()} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Converting…' : quoteExpired ? 'Quote expired' : 'Accept quote'}</button>
        <button type="button" disabled={busy || Boolean(unknownAcceptKey)} onClick={() => { pendingQuoteIntent.current = null; pendingAcceptIntent.current = null; setQuote(null); setFeedback(null); }} className="min-h-11 w-full rounded-xl border border-[#2B2037] text-[#C3BBD0] disabled:opacity-50">Request another quote</button>
      </div> : <form onSubmit={requestQuote} className="space-y-4 p-6">
        {feedback && <p role="alert" className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{feedback}</p>}
        {loadingPairs && <p role="status" className="text-sm text-[#C3BBD0]">Loading eligible conversion pairs…</p>}
        {eligibilityStatus === 'ERROR' && <div role="alert" className="space-y-2 text-sm text-amber-100"><p>Eligible conversion pairs could not be loaded. No quote has been requested.</p><button type="button" onClick={onRetryEligibility} className="min-h-11 rounded-lg border border-amber-200/25 px-3 font-semibold">Retry pair list</button></div>}
        {eligibilityStatus === 'READY' && eligiblePairs.length === 0 && <p role="status" className="text-sm text-amber-200">No conversion pair is currently eligible under backend configuration and fresh market data.</p>}
        <label className="block text-xs text-[#C3BBD0]">From<select className="nexi-input mt-1 w-full" value={fromAsset} onChange={(event) => { const next = event.target.value; setFromAsset(next); setToAsset(eligiblePairs.find((pair) => pair.from === next)?.to ?? ''); }} disabled={loadingPairs || eligibilityStatus !== 'READY' || !eligibleFrom.length}>{eligibleFrom.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></label>
        <label className="block text-xs text-[#C3BBD0]">To<select className="nexi-input mt-1 w-full" value={toAsset} onChange={(event) => setToAsset(event.target.value)} disabled={loadingPairs || eligibilityStatus !== 'READY' || !eligibleTargets.length}>{eligibleTargets.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></label>
        <p className="text-xs text-[#C3BBD0]" role="status">Funding available: {walletReadState === 'LIVE' ? `${fundingAvailable} ${fromAsset || '—'}` : 'Unavailable'}. Conversion spends Funding (MAIN), not Spot. Move Spot holdings to Funding using Wallet Transfer first.</p>
        <label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
        <button type="submit" disabled={busy || Boolean(unknownAcceptKey) || eligibilityStatus !== 'READY' || !fundingSufficient || !fromAsset || !toAsset || fromAsset === toAsset || !eligiblePairs.some((pair) => pair.from === fromAsset && pair.to === toAsset)} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Quoting…' : 'Get quote'}</button>
      </form>}
    </section>
  </ModalSurface>;
}
