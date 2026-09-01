'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

export default function TransferModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: TransferModalProps) {
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const toUserCode = Number(recipientCode);
    if (!Number.isInteger(toUserCode) || toUserCode < 100000 || toUserCode > 999999 || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      await api.post('/financial/transfers', {
        toUserCode,
        asset: selectedCurrency,
        amount,
        idempotencyKey: `transfer:${crypto.randomUUID()}`,
      });
      toast.success('Internal transfer completed.');
      await onCompleted?.();
      onClose();
    } catch { toast.error('This transfer could not be accepted.'); }
    finally { setBusy(false); }
  };

  if (!isOpen) return null;
  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.button type="button" aria-label="Close transfer dialog" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"/><motion.section role="dialog" aria-modal="true" aria-labelledby="transfer-title" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="transfer-title" className="text-xl font-bold text-white">Internal transfer</h2><button type="button" onClick={onClose} aria-label="Close transfer dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22}/></button></div><form onSubmit={submit} className="space-y-4 p-6"><div className="flex gap-2 overflow-x-auto">{currencies.map((c)=><button key={c.symbol} type="button" onClick={()=>onSelectCurrency(c.symbol)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency===c.symbol?'border-[#A995FF] bg-[#2A1742] text-white':'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{c.symbol}</button>)}</div><label className="block text-xs text-[#C3BBD0]">Recipient NEXI User ID<input className="nexi-input mt-1 w-full font-mono" inputMode="numeric" pattern="[0-9]{6}" value={recipientCode} onChange={(e)=>setRecipientCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="123456" required/></label><label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} required/></label><button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Sending…':'Transfer'}</button></form></motion.section></div></AnimatePresence>;
}
