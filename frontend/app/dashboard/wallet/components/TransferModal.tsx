'use client';

import { useEffect, useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

type WalletScope = 'MAIN' | 'SPOT' | 'MARGIN' | 'BINARY' | 'FINANCE';
const walletScopes: Array<{ value: WalletScope; label: string }> = [
  { value: 'MAIN', label: 'Funding' },
  { value: 'SPOT', label: 'Spot' },
  { value: 'MARGIN', label: 'Margin' },
  { value: 'BINARY', label: 'Options' },
  { value: 'FINANCE', label: 'Finance' },
];
const validAmount = (value: string) => /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)) && Number(value) > 0;

export default function TransferModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: TransferModalProps) {
  const [mode, setMode] = useState<'WALLETS' | 'USER'>('WALLETS');
  const [sourceScope, setSourceScope] = useState<WalletScope>('MAIN');
  const [destinationScope, setDestinationScope] = useState<WalletScope>('SPOT');
  const [internalAsset, setInternalAsset] = useState(selectedCurrency);
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const submissionLock = useRef(false);
  const pendingIntent = useRef<PendingIntentKey | null>(null);
  const close = () => { pendingIntent.current = null; onClose(); };

  useEffect(() => {
    if (!internalAsset && currencies[0]) setInternalAsset(currencies[0].symbol);
  }, [currencies, internalAsset]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current || !validAmount(amount)) return;
    const asset = mode === 'WALLETS' ? internalAsset : selectedCurrency;
    if (!asset || !currencies.some((currency) => currency.symbol === asset)) return;
    if (mode === 'WALLETS') {
      if (sourceScope === destinationScope) {
        toast.error('Choose two different Wallet accounts.');
        return;
      }
      if ((destinationScope === 'MARGIN' || destinationScope === 'BINARY') && asset.toUpperCase() !== 'USDT') {
        toast.error('Margin and Options accept USDT only.');
        return;
      }
    } else {
      const toUserCode = Number(recipientCode);
      if (!Number.isInteger(toUserCode) || toUserCode < 100000 || toUserCode > 999999) return;
    }

    const intent = getIntentKey(pendingIntent.current, JSON.stringify([mode, sourceScope, destinationScope, asset, mode === 'USER' ? Number(recipientCode) : null, amount]), mode === 'WALLETS' ? 'wallet-account-transfer' : 'transfer');
    pendingIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    try {
      if (mode === 'WALLETS') {
        await api.post('/financial/account-transfers', {
          sourceScope,
          destinationScope,
          asset,
          amount,
          idempotencyKey: intent.key,
        });
        toast.success('Wallet transfer completed.');
      } else {
        const toUserCode = Number(recipientCode);
        await api.post('/financial/transfers', {
          toUserCode,
          asset,
          amount,
          idempotencyKey: intent.key,
        });
        toast.success('Transfer to NEXI user completed.');
      }
      await onCompleted?.();
      setAmount('');
      setRecipientCode('');
      close();
    } catch (error) {
      const response = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
        : undefined;
      toast.error(typeof response === 'string' ? response : Array.isArray(response) ? response.join(', ') : 'The transfer could not be completed.');
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  };

  if (!isOpen) return null;
  const accountName = (scope: WalletScope) => walletScopes.find((item) => item.value === scope)?.label ?? scope;
  const chooseDestination = (value: WalletScope) => {
    setDestinationScope(value);
    if ((value === 'MARGIN' || value === 'BINARY') && internalAsset.toUpperCase() !== 'USDT' && currencies.some((currency) => currency.symbol.toUpperCase() === 'USDT')) setInternalAsset('USDT');
  };

  return <ModalSurface open={isOpen} onClose={close} title="Transfer"><section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl"><div className="flex items-center justify-between border-b border-violet-300/10 p-5"><div><h2 id="transfer-title" className="text-xl font-bold text-white">Transfer</h2><p className="mt-1 text-xs text-[#8C8299]">Choose where the funds should go.</p></div><button type="button" onClick={close} aria-label="Close transfer dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22}/></button></div><div className="grid grid-cols-2 gap-2 p-4 pb-0" role="tablist" aria-label="Transfer type"><button type="button" role="tab" aria-selected={mode === 'WALLETS'} onClick={() => { setMode('WALLETS'); setAmount(''); }} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${mode === 'WALLETS' ? 'border-[#A995FF] bg-[#2A1742] text-white' : 'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>Between My Wallets</button><button type="button" role="tab" aria-selected={mode === 'USER'} onClick={() => { setMode('USER'); setAmount(''); }} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${mode === 'USER' ? 'border-[#A995FF] bg-[#2A1742] text-white' : 'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>To Another NEXI User</button></div><form onSubmit={submit} className="space-y-4 p-5">
    {mode === 'WALLETS' ? <>
      <label className="block text-xs text-[#C3BBD0]">Source account<select className="nexi-input mt-1 w-full" value={sourceScope} onChange={(event) => setSourceScope(event.target.value as WalletScope)}>{walletScopes.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}</select></label>
      <label className="block text-xs text-[#C3BBD0]">Destination account<select className="nexi-input mt-1 w-full" value={destinationScope} onChange={(event) => chooseDestination(event.target.value as WalletScope)}>{walletScopes.map((scope) => <option key={scope.value} value={scope.value} disabled={scope.value === sourceScope}>{scope.label}</option>)}</select></label>
      <label className="block text-xs text-[#C3BBD0]">Asset<select className="nexi-input mt-1 w-full" value={internalAsset} onChange={(event) => setInternalAsset(event.target.value)} required>{currencies.map((currency) => <option key={currency.symbol} value={currency.symbol} disabled={(destinationScope === 'MARGIN' || destinationScope === 'BINARY') && currency.symbol.toUpperCase() !== 'USDT'}>{currency.symbol}</option>)}</select></label>
      <p className="text-[11px] leading-4 text-[#8C8299]">Same asset moves from {accountName(sourceScope)} to {accountName(destinationScope)}. No conversion is applied; only available funds can transfer.</p>
      <label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
    </> : <>
      <div className="flex gap-2 overflow-x-auto">{currencies.map((currency) => <button key={currency.symbol} type="button" onClick={() => onSelectCurrency(currency.symbol)} className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency === currency.symbol ? 'border-[#A995FF] bg-[#2A1742] text-white' : 'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{currency.symbol}</button>)}</div>
      <label className="block text-xs text-[#C3BBD0]">Recipient NEXI User ID<input className="nexi-input mt-1 w-full font-mono" inputMode="numeric" pattern="[0-9]{6}" value={recipientCode} onChange={(event) => setRecipientCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required /></label>
      <label className="block text-xs text-[#C3BBD0]">Amount<input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
    </>}
    <button type="submit" disabled={busy || !validAmount(amount) || (mode === 'WALLETS' ? !internalAsset || sourceScope === destinationScope || ((destinationScope === 'MARGIN' || destinationScope === 'BINARY') && internalAsset.toUpperCase() !== 'USDT') : recipientCode.length !== 6)} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : mode === 'WALLETS' ? 'Confirm wallet transfer' : 'Transfer to user'}</button>
  </form></section></ModalSurface>;
}
