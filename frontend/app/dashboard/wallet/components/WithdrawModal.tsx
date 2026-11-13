'use client';

import { useEffect, useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getIntentKey, type PendingIntentKey } from '../../../lib/intent-key';
import { sessionPrincipalId } from '../../../lib/wallet-auth';
import { clearPendingEconomicIntent, persistPendingEconomicIntent, readPendingEconomicIntent } from '../../../lib/pending-economic-intent';
import { decimalAmountWithinBalance, decimalLessThanOrEqual } from '../../../lib/trading-states';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

type SecurityState = { passwordSet: boolean; mfa: { enabled: boolean } };
type WithdrawalCapability = {
  asset: string; network: string; networkName: string;
  minWithdrawal: string; maxWithdrawal: string; withdrawalFee: string;
};

function addUnsignedDecimals(a: string, b: string): string | null {
  if (!/^\d+(?:\.\d+)?$/.test(a) || !/^\d+(?:\.\d+)?$/.test(b)) return null;
  const [ai, af = ''] = a.split('.');
  const [bi, bf = ''] = b.split('.');
  const scale = Math.max(af.length, bf.length);
  const multiplier = BigInt(10) ** BigInt(scale);
  const total = (BigInt(ai) + BigInt(bi)) * multiplier
    + BigInt(af.padEnd(scale, '0') || '0') + BigInt(bf.padEnd(scale, '0') || '0');
  const digits = total.toString().padStart(scale + 1, '0');
  if (scale === 0) return digits;
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return digits.slice(0, -scale) + (fraction ? `.${fraction}` : '');
}

export default function WithdrawModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onCompleted }: WithdrawModalProps) {
  const [network, setNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [capabilities, setCapabilities] = useState<WithdrawalCapability[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [capabilitiesError, setCapabilitiesError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [unknownIntentKey, setUnknownIntentKey] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const pendingIntent = useRef<PendingIntentKey | null>(null);

  useEffect(() => {
    const restore = () => {
      const principal = sessionPrincipalId();
      const stored = principal ? readPendingEconomicIntent('withdrawal', principal) : null;
      pendingIntent.current = stored?.intent ?? null;
      setUnknownIntentKey(stored?.intent.key ?? null);
    };
    restore();
    window.addEventListener('nexi:wallet-session', restore);
    return () => window.removeEventListener('nexi:wallet-session', restore);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setSecurity(null);
    setReviewOpen(false);
    setCapabilities([]);
    setCapabilitiesLoading(true);
    setCapabilitiesError(false);
    void api.get<WithdrawalCapability[]>('/financial/withdrawal-capabilities')
      .then((response) => { if (active) setCapabilities(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setCapabilitiesError(true); })
      .finally(() => { if (active) setCapabilitiesLoading(false); });
    void api.get<SecurityState>('/auth/security/status')
      .then((response) => { if (active) setSecurity(response.data); })
      .catch(() => { if (active) setSecurity(null); });
    return () => { active = false; };
  }, [isOpen]);

  const availableCapabilities = capabilities.filter((entry) => entry.asset.toUpperCase() === selectedCurrency.toUpperCase());
  const selectedCapability = availableCapabilities.find((entry) => entry.network === network);
  const amountInRange = Boolean(selectedCapability && decimalLessThanOrEqual(selectedCapability.minWithdrawal, amount.trim())
    && decimalAmountWithinBalance(amount.trim(), selectedCapability.maxWithdrawal));
  const expectedDebit = selectedCapability && amountInRange
    ? addUnsignedDecimals(amount.trim(), selectedCapability.withdrawalFee) : null;
  const selectableAssets = [...new Set(capabilities.map((entry) => entry.asset))];
  useEffect(() => {
    setNetwork((current) => availableCapabilities.some((entry) => entry.network === current)
      ? current : (availableCapabilities[0]?.network ?? ''));
  }, [selectedCurrency, capabilities]);

  const close = () => {
    setReviewOpen(false);
    // Preserve an unresolved economic intent across closing/reopening this modal.
    if (!unknownIntentKey) pendingIntent.current = null;
    setSecurityPassword('');
    setMfaToken('');
    onClose();
  };

  const recheckUnknownWithdrawal = async (key: string) => {
    const principal = sessionPrincipalId();
    if (!principal || pendingIntent.current?.key !== key) return;
    try {
      const response = await api.get<Array<{ requestKey?: string }>>('/financial/withdrawals', { params: { requestKey: key } });
      if (sessionPrincipalId() !== principal || pendingIntent.current?.key !== key) return;
      if (!Array.isArray(response.data) || !response.data.some((item) => item?.requestKey === key)) {
        toast.warning('Withdrawal outcome remains unconfirmed. Check withdrawal history or contact Support; do not submit another request.');
        return;
      }
      if (!clearPendingEconomicIntent('withdrawal', principal, key)) {
        setUnknownIntentKey(key);
        toast.warning('Withdrawal found, but recovery storage could not be cleared. Do not submit another request.');
        return;
      }
      pendingIntent.current = null;
      setUnknownIntentKey(null);
      setReviewOpen(false);
      toast.success('The withdrawal request was found in your account history.');
      try { await onCompleted?.(); }
      catch { toast.warning('Withdrawal was found, but Wallet refresh failed.'); }
    } catch {
      if (sessionPrincipalId() === principal) toast.error('Withdrawal history could not be checked. The original request remains unresolved.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current || unknownIntentKey) return;
    if (!selectedCapability || !address.trim() || !amountInRange || !expectedDebit || !securityPassword || !security) return;
    if (security.mfa.enabled && !mfaToken) return;
    if (!reviewOpen) { setReviewOpen(true); return; }
    const principal = sessionPrincipalId();
    if (!principal) { toast.error('Verify the original wallet session before withdrawing.'); return; }
    const intent = getIntentKey(pendingIntent.current, JSON.stringify([principal, selectedCurrency, network.trim(), address.trim(), amount]), 'withdrawal');
    // No password, MFA token or destination address is persisted in recovery storage.
    if (!persistPendingEconomicIntent('withdrawal', { principal, intent: { key: intent.key, fingerprint: 'redacted' }, context: {} })) {
      setUnknownIntentKey(readPendingEconomicIntent('withdrawal', principal)?.intent.key ?? 'unresolved');
      toast.error('An earlier withdrawal may be unresolved or recovery storage is unavailable. New withdrawal requests are blocked.');
      return;
    }
    pendingIntent.current = intent;
    submissionLock.current = true;
    setBusy(true);
    try {
      const accepted = await api.post<{ withdrawal?: { requestKey?: string } }>('/financial/withdrawals', {
        asset: selectedCurrency,
        network: network.trim(),
        address: address.trim(),
        amount,
        idempotencyKey: intent.key,
        securityPassword,
        ...(security.mfa.enabled ? { mfaToken } : {}),
      });
      if (sessionPrincipalId() !== principal) return;
      if (accepted.data?.withdrawal?.requestKey !== intent.key) {
        setUnknownIntentKey(intent.key);
        toast.warning('Withdrawal response did not confirm the original request. Recheck account history before another request.');
        void recheckUnknownWithdrawal(intent.key);
        return;
      }
      if (!clearPendingEconomicIntent('withdrawal', principal, intent.key)) {
        setUnknownIntentKey(intent.key);
        toast.warning('Withdrawal accepted, but recovery storage could not be cleared. Do not submit another.');
        return;
      }
      pendingIntent.current = null;
      setUnknownIntentKey(null);
      toast.success('Withdrawal submitted for review.');
      close();
      try {
        await onCompleted?.();
      } catch {
        toast.warning('Withdrawal request submitted, but Wallet refresh failed. Reload your withdrawal history before creating another request.');
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } } | null)?.response?.status;
      // A 5xx, timeout or conflict does not establish that the reserve was rolled back.
      if (sessionPrincipalId() !== principal) return;
      if ([400, 401, 403, 404, 422].includes(status ?? -1)) {
        if (!clearPendingEconomicIntent('withdrawal', principal, intent.key)) {
          setUnknownIntentKey(intent.key);
          toast.warning('Withdrawal rejected, but recovery storage could not be cleared. Do not submit another withdrawal.');
          return;
        }
        pendingIntent.current = null;
        setReviewOpen(false);
        toast.error('Withdrawal request was rejected. Review the entered details before retrying.');
      } else {
        setUnknownIntentKey(intent.key);
        toast.warning('Withdrawal submission outcome is unknown. Recheck account history before another request.');
        void recheckUnknownWithdrawal(intent.key);
      }
    }
    finally { submissionLock.current = false; setBusy(false); }
  };

  if (!isOpen) return null;
  return <ModalSurface open={isOpen} onClose={close} title="Withdraw">
    <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-violet-300/20 bg-[#121022] shadow-2xl">
      <div className="flex items-center justify-between border-b border-violet-300/10 p-4 sm:p-6">
        <h2 id="withdraw-title" className="text-xl font-bold text-white">Withdraw {selectedCurrency}</h2>
        <button type="button" onClick={close} aria-label="Close withdrawal dialog" className="inline-flex h-11 w-11 items-center justify-center text-[#C3BBD0]"><X size={22} /></button>
      </div>
      <form onSubmit={submit} className="max-h-[75dvh] space-y-4 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
        {capabilitiesLoading && <p role="status" className="text-sm text-[#C3BBD0]">Loading withdrawal availability…</p>}
        {capabilitiesError && <p role="alert" className="text-sm text-amber-200">Withdrawal fees and limits are unavailable. Submission is disabled until configuration loads.</p>}
        {!capabilitiesLoading && !capabilitiesError && selectableAssets.length === 0 && <p role="status" className="text-sm text-amber-200">No withdrawal networks are currently enabled.</p>}
        <div className="flex gap-2 overflow-x-auto">
          {selectableAssets.map((symbol) => <button key={symbol} type="button" onClick={() => { setReviewOpen(false); onSelectCurrency(symbol); }}
            className={`min-h-11 shrink-0 rounded-lg border px-4 text-sm font-semibold ${selectedCurrency === symbol ? 'border-[#FF7A8A] bg-[#3A1821] text-white' : 'border-violet-300/15 bg-[#171022] text-[#C3BBD0]'}`}>{symbol}</button>)}
        </div>
        {availableCapabilities.length > 0 && <label className="block text-xs text-[#C3BBD0]">Enabled network
          <select className="nexi-input mt-1 w-full" value={network} onChange={(event) => { setReviewOpen(false); setNetwork(event.target.value); }}>
            {availableCapabilities.map((entry) => <option key={entry.network} value={entry.network}>{entry.networkName} ({entry.network})</option>)}
          </select>
        </label>}
        {selectedCapability && <div className="rounded-xl border border-violet-300/15 bg-[#171022] p-3 text-xs text-[#C3BBD0]">
          <p>Minimum: <span className="font-mono text-white">{selectedCapability.minWithdrawal} {selectedCurrency}</span></p>
          <p className="mt-1">Maximum: <span className="font-mono text-white">{selectedCapability.maxWithdrawal} {selectedCurrency}</span></p>
          <p className="mt-1">Network fee: <span className="font-mono text-white">{selectedCapability.withdrawalFee} {selectedCurrency}</span></p>
          <p className="mt-2 text-[#A99DB8]">Your account is debited the requested amount plus the configured fee. Requests enter review; no blockchain broadcast is implied.</p>
        </div>}
        <label className="block text-xs text-[#C3BBD0]">Destination address
          <input className="nexi-input mt-1 w-full font-mono" value={address} onChange={(event) => { setReviewOpen(false); setAddress(event.target.value); }} required />
        </label>
        <label className="block text-xs text-[#C3BBD0]">Amount ({selectedCurrency})
          <input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => { setReviewOpen(false); setAmount(event.target.value); }}
            placeholder={selectedCapability ? `${selectedCapability.minWithdrawal}–${selectedCapability.maxWithdrawal}` : 'Unavailable'} required />
        </label>
        {selectedCapability && amount.trim() && !amountInRange &&
          <p role="alert" className="text-xs text-amber-200">Amount is outside the configured withdrawal limits.</p>}
        <label className="block text-xs text-[#C3BBD0]">Security password
          <input className="nexi-input mt-1 w-full" type="password" autoComplete="current-password" value={securityPassword} onChange={(event) => { setReviewOpen(false); setSecurityPassword(event.target.value); }} required />
        </label>
        {security?.mfa.enabled && <label className="block text-xs text-[#C3BBD0]">TOTP or recovery code
          <input className="nexi-input mt-1 w-full" inputMode="numeric" maxLength={64} value={mfaToken} onChange={(event) => { setReviewOpen(false); setMfaToken(event.target.value); }} required />
        </label>}
        {reviewOpen && selectedCapability && <section role="group" aria-label="Review withdrawal" className="space-y-1 rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs text-[#C3BBD0]">
          <p className="font-semibold text-white">Review withdrawal request</p>
          <p>Asset / network: {selectedCurrency} · {selectedCapability.networkName}</p>
          <p className="break-all">Destination: <span className="font-mono text-white">{address.trim()}</span></p>
          <p>Requested amount: <span className="font-mono text-white">{amount.trim()} {selectedCurrency}</span></p>
          <p>Fee: <span className="font-mono text-white">{selectedCapability.withdrawalFee} {selectedCurrency}</span></p>
          <p>Expected amount plus fee: <span className="break-all font-mono text-white">{expectedDebit ?? 'Unavailable'} {selectedCurrency}</span></p>
          <p className="text-amber-100">Confirming reserves the amount plus fee for review. This does not broadcast a blockchain transaction.</p>
          <button type="button" className="mt-2 min-h-11 rounded-lg border border-violet-300/20 px-3" onClick={() => setReviewOpen(false)}>Edit request</button>
        </section>}
        {unknownIntentKey && <div role="alert" className="rounded-lg border border-amber-300/25 p-3 text-sm text-amber-100">
          Withdrawal outcome is unresolved. New submission is disabled until account history confirms the original request.
          <button type="button" onClick={() => void recheckUnknownWithdrawal(unknownIntentKey)} className="mt-2 block min-h-11 rounded-lg border border-amber-300/30 px-3 font-semibold">Recheck withdrawal</button>
        </div>}
        <button type="submit" disabled={Boolean(unknownIntentKey) || busy || !security || !selectedCapability || capabilitiesLoading || capabilitiesError ||
          !amountInRange || !expectedDebit}
          className="min-h-11 w-full rounded-xl bg-[#FF4D5F] px-4 font-semibold text-white disabled:opacity-50">
          {busy ? 'Submitting…' : reviewOpen ? 'Confirm withdrawal request' : 'Review withdrawal'}
        </button>
      </form>
    </section>
  </ModalSurface>;
}
