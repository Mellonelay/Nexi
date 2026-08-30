'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

type Destination = { asset: string; assetName?: string; network: string; depositAddressId: string; address: string; label?: string; minDeposit?: string; confirmationCount?: number };

function idempotency(prefix: string) { return `${prefix}:${crypto.randomUUID()}`; }

export default function DepositModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: DepositModalProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.get<Destination[]>('/financial/deposit-destinations')
      .then((response) => setDestinations(Array.isArray(response.data) ? response.data : []))
      .catch(() => setDestinations([]));
  }, [isOpen]);

  const assetDestinations = useMemo(() => destinations.filter((item) => item.asset.toUpperCase() === selectedCurrency.toUpperCase()), [destinations, selectedCurrency]);
  useEffect(() => { setNetwork(assetDestinations[0]?.network ?? ''); }, [assetDestinations]);
  const destination = assetDestinations.find((item) => item.network === network) ?? assetDestinations[0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destination || !proof || !amount || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const intent = await api.post<{ key: string }>('/financial/deposit-proof-intents', { contentType: proof.type, byteSize: String(proof.size) });
      const token = localStorage.getItem('token');
      const platformOrigin = (process.env.NEXT_PUBLIC_PLATFORM_URL || window.location.origin).replace(/\/$/, '');
      const upload = await fetch(`${platformOrigin}/storage/deposit-proof?key=${encodeURIComponent(intent.data.key)}`, {
        method: 'PUT', headers: { 'Content-Type': proof.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: proof,
      });
      if (!upload.ok) throw new Error(`Proof upload failed (${upload.status})`);
      await api.post('/financial/deposit-claims', {
        asset: destination.asset,
        network: destination.network,
        depositAddressId: destination.depositAddressId,
        claimedAmount: amount,
        proofObjectKey: intent.data.key,
        ...(txHash.trim() ? { txHash: txHash.trim() } : {}),
        idempotencyKey: idempotency('deposit-claim'),
      });
      toast.success('Deposit claim submitted for review.');
      await onCompleted?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deposit claim could not be submitted.');
    } finally { setBusy(false); }
  };

  if (!isOpen) return null;
  return <AnimatePresence><div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.button type="button" aria-label="Close deposit dialog" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" /><motion.section role="dialog" aria-modal="true" aria-labelledby="deposit-title" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="deposit-title" className="text-xl font-bold text-white">Deposit {selectedCurrency}</h2><button type="button" onClick={onClose} aria-label="Close deposit dialog" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#C3BBD0]"><X size={22}/></button></div><form onSubmit={submit} className="space-y-4 p-6"><div className="flex gap-2 overflow-x-auto">{currencies.map((c)=><button key={c.symbol} type="button" onClick={()=>onSelectCurrency(c.symbol)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency===c.symbol?'border-[#A995FF] bg-[#2A1742] text-white':'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{c.symbol}</button>)}</div>{destination ? <><label className="block text-xs text-[#C3BBD0]">Network<select className="nexi-input mt-1 w-full" value={network} onChange={(e)=>setNetwork(e.target.value)}>{assetDestinations.map((d)=><option key={d.depositAddressId} value={d.network}>{d.network}</option>)}</select></label><div className="rounded-xl border border-[#2B2037] bg-[#171022] p-3"><p className="text-xs text-[#8C8299]">Deposit address</p><p className="mt-1 break-all font-mono text-sm text-white">{destination.address}</p>{destination.confirmationCount!=null&&<p className="mt-2 text-xs text-[#8C8299]">Required confirmations: {destination.confirmationCount}</p>}</div><label className="block text-xs text-[#C3BBD0]">Claimed amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} required /></label><label className="block text-xs text-[#C3BBD0]">Transaction hash (optional)<input className="nexi-input mt-1 w-full font-mono" value={txHash} onChange={(e)=>setTxHash(e.target.value)} /></label><label className="block text-xs text-[#C3BBD0]">Deposit proof<input className="nexi-input mt-1 w-full" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e)=>setProof(e.target.files?.[0]??null)} required /></label><button type="submit" disabled={busy||!proof||!amount} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy?'Submitting…':'Submit deposit claim'}</button></> : <p className="text-sm text-[#C3BBD0]">No active deposit destination is configured for this asset.</p>}</form></motion.section></div></AnimatePresence>;
}
