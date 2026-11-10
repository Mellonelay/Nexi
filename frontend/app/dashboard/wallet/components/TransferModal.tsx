'use client';

import { useEffect, useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { sessionPrincipalId } from '../../../lib/wallet-auth';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../../lib/pending-economic-intent';
import { positiveDecimalAmount } from '../../../lib/trading-states';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
  initialDestinationScope?: 'BINARY';
}

type WalletScope = 'MAIN' | 'SPOT' | 'MARGIN' | 'BINARY' | 'FINANCE';
const walletScopes: Array<{ value: WalletScope; label: string }> = [
  { value: 'MAIN', label: 'Funding' },
  { value: 'SPOT', label: 'Spot' },
  { value: 'MARGIN', label: 'Margin' },
  { value: 'BINARY', label: 'Options' },
  { value: 'FINANCE', label: 'Finance' },
];
const validAmount = positiveDecimalAmount;

export default function TransferModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted, initialDestinationScope }: TransferModalProps) {
  const [mode, setMode] = useState<'WALLETS' | 'USER'>('WALLETS');
  const [sourceScope, setSourceScope] = useState<WalletScope>('MAIN');
  const [destinationScope, setDestinationScope] = useState<WalletScope>('SPOT');
  const [internalAsset, setInternalAsset] = useState(selectedCurrency);
  const [recipientCode, setRecipientCode] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const submissionLock = useRef(false);
  const pendingIntent = useRef<PendingIntentKey | null>(null);
  const [unknownIntentKey, setUnknownIntentKey] = useState<string | null>(null);
  const pendingMode = useRef<'WALLETS' | 'USER' | null>(null);
  const pendingPrincipal = useRef<string | null>(null);
  const close = () => { if (!unknownIntentKey) pendingIntent.current = null; onClose(); };

  useEffect(() => {
    const restore = () => {
      const principal = sessionPrincipalId();
      const stored = principal ? readPendingEconomicIntent('transfer', principal) : null;
      pendingIntent.current = stored?.intent ?? null;
      pendingMode.current = stored?.context.mode === 'USER' ? 'USER' : stored ? 'WALLETS' : null;
      pendingPrincipal.current = stored?.principal ?? null;
      setUnknownIntentKey(stored?.intent.key ?? null);
    };
    restore();
    window.addEventListener('nexi:wallet-session', restore);
    return () => window.removeEventListener('nexi:wallet-session', restore);
  }, []);

  const recheckUnknownTransfer = async (key: string) => {
    const principal = sessionPrincipalId();
    if (!principal || principal !== pendingPrincipal.current || pendingIntent.current?.key !== key) {
      toast.warning('Verify the original wallet session before checking this transfer.');
      return;
    }
    try {
      let confirmed = false;
      if (pendingMode.current === 'WALLETS') {
        const response = await api.get<{ activities: Array<{
          type?: string; status?: string; idempotencyKey?: string; referenceId?: string; ledgerCorrelationId?: string;
          details?: string; relatedLedgerPostings?: Array<{ id?: string; kind?: string; referenceId?: string; correlationId?: string; scope?: string }>;
        }> }>('/wallet/activity', { params: { limit: 1, type: 'WALLET_ACCOUNT_TRANSFER', status: 'COMPLETED', correlationId: key, referenceId: key } });
        confirmed = Array.isArray(response.data?.activities) && response.data.activities.some((item) => {
          if (item?.type !== 'WALLET_ACCOUNT_TRANSFER' || item.status !== 'COMPLETED'
            || item.idempotencyKey !== key || item.ledgerCorrelationId !== key || item.referenceId !== key) return false;
          let details: { debitPostingId?: string; creditPostingId?: string; sourceScope?: string; destinationScope?: string };
          try { details = JSON.parse(item.details ?? 'null') ?? {}; } catch { return false; }
          if (!details.debitPostingId || !details.creditPostingId || details.debitPostingId === details.creditPostingId) return false;
          const postings = item.relatedLedgerPostings ?? [];
          return postings.some((posting) =>
            posting.id === details.debitPostingId && posting.kind === 'TRANSFER'
            && posting.referenceId === key && posting.correlationId === key && posting.scope === details.sourceScope)
            && postings.some((posting) =>
              posting.id === details.creditPostingId && posting.kind === 'TRANSFER'
              && posting.referenceId === key && posting.correlationId === key && posting.scope === details.destinationScope);
        });
      } else if (pendingMode.current === 'USER') {
        const response = await api.get<Array<{ idempotencyKey?: string; fromUserId?: string }>>('/financial/transfers', { params: { idempotencyKey: key } });
        confirmed = Array.isArray(response.data) && response.data.some((item) =>
          item?.idempotencyKey === key && item.fromUserId === principal);
      }
      if (sessionPrincipalId() !== principal || pendingIntent.current?.key !== key) return;
      if (!confirmed) {
        toast.warning('Transfer outcome remains unknown. Do not send it again; review Wallet activity or contact Support.');
        return;
      }
      if (!clearPendingEconomicIntent('transfer', principal, key)) {
        setUnknownIntentKey(key);
        toast.warning('Transfer confirmed, but recovery storage could not be cleared. Do not submit another request.');
        return;
      }
      pendingIntent.current = null;
      pendingMode.current = null;
      pendingPrincipal.current = null;
      setUnknownIntentKey(null);
      setAmount('');
      setRecipientCode('');
      toast.success('The transfer was confirmed in account records.');
      try { await onCompleted?.(); } catch { toast.warning('Transfer confirmed, but Wallet refresh failed.'); }
      onClose();
    } catch {
      if (sessionPrincipalId() === principal && pendingIntent.current?.key === key)
        toast.error('Transfer records could not be checked. The original request remains unresolved.');
    }
  };

  useEffect(() => {
    if (!internalAsset && currencies[0]) setInternalAsset(currencies[0].symbol);
  }, [currencies, internalAsset]);

  useEffect(() => {
    if (!isOpen || !initialDestinationScope) return;
    setMode('WALLETS');
    setSourceScope('MAIN');
    setDestinationScope(initialDestinationScope);
    setInternalAsset('USDT');
  }, [isOpen, initialDestinationScope]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const principal = sessionPrincipalId();
    if (submissionLock.current || unknownIntentKey || !principal || !validAmount(amount)) return;
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

    const intent = getIntentKey(pendingIntent.current, JSON.stringify([principal, mode, sourceScope, destinationScope, asset, mode === 'USER' ? Number(recipientCode) : null, amount]), mode === 'WALLETS' ? 'wallet-account-transfer' : 'transfer');
    if (!persistPendingEconomicIntent('transfer', { principal, intent: { key: intent.key, fingerprint: 'redacted' }, context: { mode } })) {
      setUnknownIntentKey(readPendingEconomicIntent('transfer', principal)?.intent.key ?? 'unresolved');
      toast.error('A previous transfer may be unresolved or secure recovery storage is unavailable. Do not submit another transfer in this session.');
      return;
    }
    pendingIntent.current = intent;
    pendingMode.current = mode;
    pendingPrincipal.current = principal;
    submissionLock.current = true;
    setBusy(true);
    try {
      let confirmation: string;
      if (mode === 'WALLETS') {
        const response = await api.post<{ transfer?: { idempotencyKey?: string; asset?: string; amount?: string; sourceScope?: string; destinationScope?: string }; postings?: { debitPostingId?: string; creditPostingId?: string } }>('/financial/account-transfers', {
          sourceScope,
          destinationScope,
          asset,
          amount,
          idempotencyKey: intent.key,
        });
        if (response.data?.transfer?.idempotencyKey !== intent.key || response.data?.transfer?.asset !== asset ||
            response.data?.transfer?.sourceScope !== sourceScope || response.data?.transfer?.destinationScope !== destinationScope ||
            !response.data?.postings?.debitPostingId || !response.data?.postings?.creditPostingId)
          throw new Error('Original account transfer acknowledgement was not confirmed');
        confirmation = `${amount} ${asset} transferred from ${accountName(sourceScope)} to ${accountName(destinationScope)}.`;
      } else {
        const toUserCode = Number(recipientCode);
        const response = await api.post<{ transfer?: { idempotencyKey?: string; fromUserId?: string } }>('/financial/transfers', {
          toUserCode,
          asset,
          amount,
          idempotencyKey: intent.key,
        });
        if (response.data?.transfer?.idempotencyKey !== intent.key || response.data?.transfer?.fromUserId !== principal)
          throw new Error('Original user transfer acknowledgement was not confirmed');
        confirmation = `${amount} ${asset} transferred to NEXI user ${recipientCode}.`;
      }
      if (sessionPrincipalId() !== principal) return;
      if (!clearPendingEconomicIntent('transfer', principal, intent.key)) {
        setUnknownIntentKey(intent.key);
        toast.warning('Transfer accepted, but recovery storage could not be cleared. Do not send another.');
        return;
      }
      pendingIntent.current = null;
      pendingMode.current = null;
      pendingPrincipal.current = null;
      setUnknownIntentKey(null);
      // A readback failure must not misreport an already committed transfer.
      try { await onCompleted?.(); }
      catch { toast.warning('Transfer completed, but balances could not be refreshed.'); }
      toast.success(confirmation);
      setAmount('');
      setRecipientCode('');
      close();
    } catch (error) {
      if (sessionPrincipalId() !== principal) return;
      const response = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
        : undefined;
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      if ([400, 401, 403, 404, 422].includes(status ?? -1)) {
        if (!clearPendingEconomicIntent('transfer', principal, intent.key)) {
          setUnknownIntentKey(intent.key);
          toast.warning('Transfer rejected, but recovery storage could not be cleared. Keep the original transfer locked.');
          return;
        }
        pendingIntent.current = null;
        pendingMode.current = null;
        pendingPrincipal.current = null;
        toast.error(typeof response === 'string' ? response : Array.isArray(response)
          ? response.join(', ') : 'Transfer request was rejected. Review the details.');
      } else {
        setUnknownIntentKey(intent.key);
        toast.warning('Transfer outcome is unknown. Recheck account records before any other transfer.');
        void recheckUnknownTransfer(intent.key);
      }
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
    {unknownIntentKey && <div role="alert" className="rounded-lg border border-amber-300/25 p-3 text-sm text-amber-100">
      Transfer outcome is unresolved. Do not submit another transfer.
      <button type="button" onClick={() => void recheckUnknownTransfer(unknownIntentKey)} className="mt-2 block min-h-11 rounded-lg border border-amber-300/30 px-3 font-semibold">Recheck transfer</button>
    </div>}
    <button type="submit" disabled={busy || Boolean(unknownIntentKey) || !validAmount(amount) || (mode === 'WALLETS' ? !internalAsset || sourceScope === destinationScope || ((destinationScope === 'MARGIN' || destinationScope === 'BINARY') && internalAsset.toUpperCase() !== 'USDT') : recipientCode.length !== 6)} className="min-h-11 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Sending…' : mode === 'WALLETS' ? 'Confirm wallet transfer' : 'Transfer to user'}</button>
  </form></section></ModalSurface>;
}
