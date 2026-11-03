'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligiblePairs: Array<{ from: string; to: string }>;
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
  if (/insufficient (?:funds|balance)/i.test(message)) return 'Your available balance is too low for this conversion.';
  if (/quote expired|conversion quote expired/i.test(message)) return 'This quote expired. Request a fresh quote to continue.';
  if (/unsupported|conversion market unavailable|conversion market quote unavailable/i.test(message)) return 'This pair is no longer eligible. Refresh the pair list and try again.';
  if (!response) return 'Network connection failed. Check your connection and retry.';
  return phase === 'quote' ? 'A quote could not be created for this pair. Review the amount and try again.' : 'The conversion could not be confirmed. Refresh wallet activity before retrying.';
}

export default function ConvertModal({ isOpen, onClose, eligiblePairs, eligibilityStatus, onRetryEligibility, selectedCurrency, onCompleted }: ConvertModalProps) {
  const [fromAsset, setFromAsset] = useState('');
  const [toAsset, setToAsset] = useState('');
  const eligibleFrom = useMemo(() => [...new Set(eligiblePairs.map((pair) => pair.from))], [eligiblePairs]);
  const eligibleTargets = useMemo(() => [...new Set(eligiblePairs.filter((pair) => pair.from === fromAsset).map((pair) => pair.to))], [eligiblePairs, fromAsset]);
  const eligibleKey = eligiblePairs.map((pair) => `${pair.from}>${pair.to}`).sort().join('|');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const submissionLock = useRef(false);
  const pendingQuoteIntent = useRef<PendingIntentKey | null>(null);
  const pendingAcceptIntent = useRef<PendingIntentKey | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const pairs = eligibleKey.split('|').filter(Boolean).map((value) => value.split('>'));
    const availableFrom = [...new Set(pairs.map(([from]) => from).filter(Boolean))];
    const preferred = selectedCurrency.trim().toUpperCase();
    const source = availableFrom.includes(preferred) ? preferred : (availableFrom[0] ?? '');
    setFromAsset(source);
    setToAsset(pairs.find(([from]) => from === source)?.[1] ?? '');
    setQuote(null);
    setFeedback(null);
  }, [isOpen, selectedCurrency, eligibleKey]);

  useEffect(() => {
    if (!quote) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [quote]);

  const quoteExpiry = quote ? Date.parse(quote.expiresAt) : Number.NaN;
  const quoteExpired = Boolean(quote) && (!Number.isFinite(quoteExpiry) || quoteExpiry <= now);
  const close = () => { pendingQuoteIntent.current = null; pendingAcceptIntent.current = null; onClose(); };

  const requestQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current) return;
    if (!eligiblePairs.some((pair) => pair.from === fromAsset && pair.to === toAsset)) {
      setFeedback('This conversion pair is not currently supported. Refresh the pair list.');
      return;
    }
    if (fromAsset === toAsset || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setFeedback('Enter a valid amount greater than zero.');
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
    if (!quote || submissionLock.current) return;
    if (quoteExpired) {
      setFeedback('This quote expired. Request a fresh quote to continue.');
      return;
    }
    const intent = getIntentKey(pendingAcceptIntent.current, quote.id, 'conversion-accept');
    pendingAcceptIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      await api.post('/financial/conversion/accept', { quoteId: quote.id, acceptanceKey: intent.key });
      toast.success('Conversion completed.');
      await onCompleted?.();
      setQuote(null);
      close();
    } catch (error) {
      const message = conversionFailureMessage(error, 'accept');
      setFeedback(message);
      toast.error(message);
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
      {quote ? <div className="space-y-4 p-6">
        {feedback && <p role="alert" className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{feedback}</p>}
        <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><p className="text-sm text-[#C3BBD0]">{quote.inputAmount} {quote.fromAsset} → <strong className="text-white">{quote.outputAmount} {quote.toAsset}</strong></p><p className="mt-2 text-xs text-[#8C8299]">Rate {quote.rate} · expires {Number.isFinite(quoteExpiry) ? new Date(quoteExpiry).toLocaleTimeString() : 'unknown'}</p></div>
        {quoteExpired && <p role="status" className="text-sm text-amber-200">Quote expired. Request another quote to continue.</p>}
        <button type="button" disabled={busy || quoteExpired} onClick={() => void accept()} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Converting…' : quoteExpired ? 'Quote expired' : 'Accept quote'}</button>
        <button type="button" disabled={busy} onClick={() => { pendingQuoteIntent.current = null; pendingAcceptIntent.current = null; setQuote(null); setFeedback(null); }} className="min-h-11 w-full rounded-xl border border-[#2B2037] text-[#C3BBD0] disabled:opacity-50">Request another quote</button>
      </div> : <form onSubmit={requestQuote} className="space-y-4 p-6">
        {feedback && <p role="alert" className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{feedback}</p>}
        {loadingPairs && <p role="status" className="text-sm text-[#C3BBD0]">Loading eligible conversion pairs…</p>}
        {eligibilityStatus === 'ERROR' && <div role="alert" className="space-y-2 text-sm text-amber-100"><p>Eligible conversion pairs could not be loaded. No quote has been requested.</p><button type="button" onClick={onRetryEligibility} className="min-h-11 rounded-lg border border-amber-200/25 px-3 font-semibold">Retry pair list</button></div>}
        {eligibilityStatus === 'READY' && eligiblePairs.length === 0 && <p role="status" className="text-sm text-amber-200">No conversion pair is currently eligible under backend configuration and fresh market data.</p>}
        <label className="block text-xs text-[#C3BBD0]">From<select className="nexi-input mt-1 w-full" value={fromAsset} onChange={(event) => { const next = event.target.value; setFromAsset(next); setToAsset(eligiblePairs.find((pair) => pair.from === next)?.to ?? ''); }} disabled={loadingPairs || eligibilityStatus !== 'READY' || !eligibleFrom.length}>{eligibleFrom.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></label>
        <label className="block text-xs text-[#C3BBD0]">To<select className="nexi-input mt-1 w-full" value={toAsset} onChange={(event) => setToAsset(event.target.value)} disabled={loadingPairs || eligibilityStatus !== 'READY' || !eligibleTargets.length}>{eligibleTargets.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}</select></label>
        <label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
        <button type="submit" disabled={busy || eligibilityStatus !== 'READY' || !fromAsset || !toAsset || fromAsset === toAsset || !eligiblePairs.some((pair) => pair.from === fromAsset && pair.to === toAsset)} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Quoting…' : 'Get quote'}</button>
      </form>}
    </section>
  </ModalSurface>;
}
