'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

export default function WithdrawModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: WithdrawModalProps) {
  const [network, setNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!network.trim() || !address.trim() || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      await api.post('/financial/withdrawals', {
        asset: selectedCurrency,
        network: network.trim(),
        address: address.trim(),
        amount,
        idempotencyKey: `withdrawal:${crypto.randomUUID()}`,
      });
      toast.success('Withdrawal submitted for review.');
      await onCompleted?.();
      onClose();
    } catch { toast.error('This withdrawal could not be accepted.'); }
    finally { setBusy(false); }
  };

  if (!isOpen) return null;
  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.button type="button" aria-label="Close withdrawal dialog" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"/><motion.section role="dialog" aria-modal="true" aria-labelledby="withdraw-title" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="withdraw-title" className="text-xl font-bold text-white">Withdraw {selectedCurrency}</h2><button type="button" onClick={onClose} aria-label="Close withdrawal dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22}/></button></div><form onSubmit={submit} className="space-y-4 p-6"><div className="flex gap-2 overflow-x-auto">{currencies.map((c)=><button key={c.symbol} type="button" onClick={()=>onSelectCurrency(c.symbol)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency===c.symbol?'border-[#FF7A8A] bg-[#3A1821] text-white':'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{c.symbol}</button>)}</div><label className="block text-xs text-[#C3BBD0]">Network<input className="nexi-input mt-1 w-full" value={network} onChange={(e)=>setNetwork(e.target.value)} placeholder="e.g. ERC20, TRC20" required/></label><label className="block text-xs text-[#C3BBD0]">Destination address<input className="nexi-input mt-1 w-full font-mono" value={address} onChange={(e)=>setAddress(e.target.value)} required/></label><label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} required/></label><button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-[#FF4D5F] px-4 font-semibold text-white disabled:opacity-50">{busy?'Submitting…':'Confirm withdrawal'}</button></form></motion.section></div></AnimatePresence>;
}
