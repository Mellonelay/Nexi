'use client';

import { useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onCompleted?: () => void | Promise<void>;
}

type Quote = { id: string; fromAsset: string; toAsset: string; inputAmount: string; outputAmount: string; rate: string; expiresAt: string };

export default function ConvertModal({ isOpen, onClose, currencies, selectedCurrency, onCompleted }: ConvertModalProps) {
  const symbols = currencies.map((item) => item.symbol);
  const [fromAsset, setFromAsset] = useState(selectedCurrency || symbols[0] || 'USDT');
  const [toAsset, setToAsset] = useState(() => symbols.find((item) => item !== selectedCurrency) || 'USDT');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const submissionLock = useRef(false);
  const pendingQuoteIntent = useRef<PendingIntentKey | null>(null);
  const pendingAcceptIntent = useRef<PendingIntentKey | null>(null);
  const close = () => { pendingQuoteIntent.current = null; pendingAcceptIntent.current = null; onClose(); };

  const requestQuote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current) return;
    if (fromAsset === toAsset || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    const intent = getIntentKey(pendingQuoteIntent.current, JSON.stringify([fromAsset, toAsset, amount]), 'conversion-quote');
    pendingQuoteIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    try {
      const response = await api.post<{ quote: Quote }>('/financial/conversion/quote', { fromAsset, toAsset, amount, quoteKey: intent.key });
      setQuote(response.data.quote);
    } catch { toast.error('A conversion rate is not available for this pair.'); }
    finally { submissionLock.current = false; setBusy(false); }
  };

  const accept = async () => {
    if (!quote || submissionLock.current) return;
    const intent = getIntentKey(pendingAcceptIntent.current, quote.id, 'conversion-accept');
    pendingAcceptIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    try {
      await api.post('/financial/conversion/accept', { quoteId: quote.id, acceptanceKey: intent.key });
      toast.success('Conversion completed.');
      await onCompleted?.();
      setQuote(null);
      close();
    } catch { toast.error('This conversion could not be accepted.'); }
    finally { submissionLock.current = false; setBusy(false); }
  };

  if (!isOpen) return null;
  return <ModalSurface open={isOpen} onClose={close} title="Convert"><section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="convert-title" className="text-xl font-bold text-white">Convert</h2><button type="button" onClick={close} aria-label="Close conversion dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22}/></button></div>{quote ? <div className="space-y-4 p-6"><div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><p className="text-sm text-[#C3BBD0]">{quote.inputAmount} {quote.fromAsset} → <strong className="text-white">{quote.outputAmount} {quote.toAsset}</strong></p><p className="mt-2 text-xs text-[#8C8299]">Rate {quote.rate} · expires {new Date(quote.expiresAt).toLocaleTimeString()}</p></div><button type="button" disabled={busy} onClick={()=>void accept()} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Converting…':'Accept quote'}</button><button type="button" onClick={() => { pendingQuoteIntent.current = null; pendingAcceptIntent.current = null; setQuote(null); }} className="min-h-11 w-full rounded-xl border border-[#2B2037] text-[#C3BBD0]">Request another quote</button></div> : <form onSubmit={requestQuote} className="space-y-4 p-6"><label className="block text-xs text-[#C3BBD0]">From<select className="nexi-input mt-1 w-full" value={fromAsset} onChange={(e)=>setFromAsset(e.target.value)}>{symbols.map((s)=><option key={s}>{s}</option>)}</select></label><label className="block text-xs text-[#C3BBD0]">To<select className="nexi-input mt-1 w-full" value={toAsset} onChange={(e)=>setToAsset(e.target.value)}>{symbols.map((s)=><option key={s}>{s}</option>)}</select></label><label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} required/></label><button type="submit" disabled={busy||fromAsset===toAsset} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Quoting…':'Get quote'}</button></form>}</section></ModalSurface>;
}
