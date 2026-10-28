'use client';

import { useEffect, useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

type SecurityState = { passwordSet: boolean; mfa: { enabled: boolean } };

export default function WithdrawModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: WithdrawModalProps) {
  const [network, setNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [busy, setBusy] = useState(false);
  const submissionLock = useRef(false);
  const pendingIntent = useRef<PendingIntentKey | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setSecurity(null);
    void api.get<SecurityState>('/auth/security/status')
      .then((response) => { if (active) setSecurity(response.data); })
      .catch(() => { if (active) setSecurity(null); });
    return () => { active = false; };
  }, [isOpen]);

  const close = () => {
    pendingIntent.current = null;
    setSecurityPassword('');
    setMfaToken('');
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current) return;
    if (!network.trim() || !address.trim() || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !securityPassword || !security) return;
    if (security.mfa.enabled && !mfaToken) return;
    const intent = getIntentKey(pendingIntent.current, JSON.stringify([selectedCurrency, network.trim(), address.trim(), amount]), 'withdrawal');
    pendingIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    try {
      await api.post('/financial/withdrawals', {
        asset: selectedCurrency,
        network: network.trim(),
        address: address.trim(),
        amount,
        idempotencyKey: intent.key,
        securityPassword,
        ...(security.mfa.enabled ? { mfaToken } : {}),
      });
      toast.success('Withdrawal submitted for review.');
      await onCompleted?.();
      close();
    } catch { toast.error('This withdrawal could not be accepted.'); }
    finally { submissionLock.current = false; setBusy(false); }
  };

  if (!isOpen) return null;
  return <ModalSurface open={isOpen} onClose={close} title="Withdraw"><section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-6"><h2 id="withdraw-title" className="text-xl font-bold text-white">Withdraw {selectedCurrency}</h2><button type="button" onClick={close} aria-label="Close withdrawal dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22} /></button></div><form onSubmit={submit} className="space-y-4 p-6"><div className="flex gap-2 overflow-x-auto">{currencies.map((c) => <button key={c.symbol} type="button" onClick={() => onSelectCurrency(c.symbol)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency === c.symbol ? 'border-[#FF7A8A] bg-[#3A1821] text-white' : 'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{c.symbol}</button>)}</div><label className="block text-xs text-[#C3BBD0]">Network<input className="nexi-input mt-1 w-full" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. ERC20, TRC20" required /></label><label className="block text-xs text-[#C3BBD0]">Destination address<input className="nexi-input mt-1 w-full font-mono" value={address} onChange={(e) => setAddress(e.target.value)} required /></label><label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label><label className="block text-xs text-[#C3BBD0]">Security password<input className="nexi-input mt-1 w-full" type="password" autoComplete="current-password" value={securityPassword} onChange={(e) => setSecurityPassword(e.target.value)} required /></label>{security?.mfa.enabled && <label className="block text-xs text-[#C3BBD0]">TOTP or recovery code<input className="nexi-input mt-1 w-full" inputMode="numeric" maxLength={64} value={mfaToken} onChange={(e) => setMfaToken(e.target.value)} required /></label>}<button type="submit" disabled={busy || !security} className="min-h-11 w-full rounded-xl bg-[#FF4D5F] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Confirm withdrawal'}</button></form></section></ModalSurface>;
}
