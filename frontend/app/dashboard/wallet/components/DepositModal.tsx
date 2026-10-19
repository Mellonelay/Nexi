'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import ModalSurface from '../../../components/ModalSurface';
import { ArrowLeft, Check, Copy, Image as ImageIcon, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { getAccessToken } from '../../../lib/auth-session';
import { findAsset } from '../../../lib/asset-registry';
import AssetIcon from '../../../components/AssetIcon';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencies: Array<{ symbol: string }>;
  selectedCurrency: string;
  onSelectCurrency: (symbol: string) => void;
  onCompleted?: () => void | Promise<void>;
}

type Destination = {
  asset: string;
  assetName?: string;
  network: string;
  depositAddressId: string;
  address: string;
  label?: string;
  minDeposit?: string;
  confirmationCount?: number;
  decimals?: number;
};

type Step = 'asset' | 'details';

function idempotency(prefix: string) { return `${prefix}:${crypto.randomUUID()}`; }
function normalized(value: string) { return value.trim().toUpperCase(); }

export default function DepositModal({ isOpen, onClose, selectedCurrency, onSelectCurrency, onCompleted }: DepositModalProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [step, setStep] = useState<Step>('asset');
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const submissionLock = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStep('asset');
    setAmount('');
    setTxHash('');
    setProof(null);
    setCopied(false);
    setLoading(true);
    setLoadFailed(false);
    api.get<Destination[]>('/financial/deposit-destinations')
      .then((response) => {
        if (cancelled) return;
        setDestinations(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setDestinations([]);
        setLoadFailed(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, retryNonce]);

  const assetGroups = useMemo(() => {
    const groups = new Map<string, Destination[]>();
    for (const item of destinations) {
      const key = normalized(item.asset);
      if (!key || !item.address?.trim() || !item.depositAddressId?.trim() || !item.network?.trim()) continue;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return Array.from(groups.entries()).map(([asset, rows]) => ({ asset, rows }));
  }, [destinations]);

  const assetDestinations = useMemo(
    () => destinations.filter((item) => normalized(item.asset) === normalized(selectedCurrency)),
    [destinations, selectedCurrency],
  );

  useEffect(() => {
    if (step !== 'details') return;
    setNetwork((current) => assetDestinations.some((item) => item.network === current) ? current : (assetDestinations[0]?.network ?? ''));
  }, [assetDestinations, step]);

  const destination = assetDestinations.find((item) => item.network === network) ?? assetDestinations[0];
  const selectedMeta = findAsset(selectedCurrency);

  const chooseAsset = (asset: string) => {
    onSelectCurrency(asset);
    const rows = destinations.filter((item) => normalized(item.asset) === normalized(asset));
    setNetwork(rows[0]?.network ?? '');
    setAmount('');
    setTxHash('');
    setProof(null);
    setCopied(false);
    setStep('details');
  };

  const copyAddress = async () => {
    if (!destination?.address) return;
    try {
      await navigator.clipboard.writeText(destination.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Deposit address could not be copied.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current) return;
    if (busy || !destination || !proof || !amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    submissionLock.current = true;
    setBusy(true);
    try {
      const intent = await api.post<{ key: string }>('/financial/deposit-proof-intents', {
        contentType: proof.type,
        byteSize: String(proof.size),
      });
      const token = getAccessToken();
      const platformOrigin = (process.env.NEXT_PUBLIC_PLATFORM_URL || window.location.origin).replace(/\/$/, '');
      const upload = await fetch(`${platformOrigin}/storage/deposit-proof?key=${encodeURIComponent(intent.data.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': proof.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: proof,
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
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalSurface open={isOpen} onClose={onClose} title="Deposit"><section className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-violet-300/20 bg-[#0D0A16] shadow-2xl sm:rounded-3xl">
          <div className="flex items-center gap-3 border-b border-violet-300/10 px-4 py-4 sm:px-5">
            {step === 'details' && (
              <button type="button" onClick={() => setStep('asset')} aria-label="Back to deposit assets" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2B2037] bg-[#171022] text-[#C3BBD0]">
                <ArrowLeft size={19} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h2 id="deposit-title" className="truncate text-lg font-semibold text-white sm:text-xl">{step === 'asset' ? 'Deposit' : `Deposit ${selectedCurrency}`}</h2>
              <p className="mt-0.5 truncate text-xs text-[#8C8299]">{step === 'asset' ? 'Select an asset to deposit' : (destination?.network ?? 'Select a configured network')}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close deposit dialog" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#C3BBD0] hover:bg-white/5"><X size={21} /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
            {step === 'asset' ? (
              <div className="space-y-3">
                {loading && <p className="rounded-2xl border border-[#2B2037] bg-[#171022] p-4 text-sm text-[#8C8299]">Loading configured deposit assets…</p>}
                {!loading && loadFailed && (
                  <div className="rounded-2xl border border-[#2B2037] bg-[#171022] p-4 text-sm text-[#A99DB8]">
                    <p>Deposit assets are unavailable right now.</p>
                    <button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="mt-3 min-h-11 font-semibold text-[#A995FF]">Retry</button>
                  </div>
                )}
                {!loading && !loadFailed && assetGroups.length === 0 && <p className="rounded-2xl border border-[#2B2037] bg-[#171022] p-4 text-sm text-[#8C8299]">No deposit asset is currently enabled by NEXI.</p>}
                {!loading && !loadFailed && assetGroups.map(({ asset, rows }) => {
                  const meta = findAsset(asset);
                  const name = rows[0]?.assetName || meta?.name || asset;
                  const networks = Array.from(new Set(rows.map((row: Destination) => row.network)));
                  const iconItem = { assetId: meta?.id ?? asset, symbol: meta?.symbol ?? asset, displaySymbol: meta?.displaySymbol ?? asset, name };
                  return (
                    <button key={asset} type="button" onClick={() => chooseAsset(asset)} className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-[#2B2037] bg-[#171022] px-4 py-3 text-left transition hover:border-violet-300/35 hover:bg-[#1B1229] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">
                      <AssetIcon item={iconItem} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{name}</span>
                        <span className="mt-1 block truncate text-xs text-[#8C8299]">Crypto · {networks.join(' · ')}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs font-semibold text-[#C3BBD0]">{asset}</span>
                    </button>
                  );
                })}
              </div>
            ) : destination ? (
              <form onSubmit={submit} className="space-y-4">
                <section className="rounded-2xl border border-violet-300/15 bg-[#151020] p-4">
                  <div className="flex items-center gap-3">
                    <AssetIcon item={{ assetId: selectedMeta?.id ?? destination.asset, symbol: selectedMeta?.symbol ?? destination.asset, displaySymbol: selectedMeta?.displaySymbol ?? destination.asset, name: destination.assetName || selectedMeta?.name || destination.asset }} size="md" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{destination.assetName || selectedMeta?.name || destination.asset}</p><p className="mt-0.5 text-xs text-[#8C8299]">{destination.asset} deposit</p></div>
                  </div>
                  {assetDestinations.length > 1 ? (
                    <label className="mt-4 block text-xs font-medium text-[#C3BBD0]">Network
                      <select className="nexi-input mt-1 w-full" value={network} onChange={(event) => { setNetwork(event.target.value); setCopied(false); }}>
                        {assetDestinations.map((item) => <option key={item.depositAddressId} value={item.network}>{item.network}</option>)}
                      </select>
                    </label>
                  ) : <div className="mt-4 rounded-xl border border-[#2B2037] bg-[#0B0912] px-3 py-2 text-xs"><span className="text-[#8C8299]">Network</span><span className="float-right font-semibold text-white">{destination.network}</span></div>}
                </section>

                <section className="rounded-2xl border border-[#2B2037] bg-[#171022] p-4">
                  <div className="mx-auto w-fit rounded-2xl bg-white p-3"><QRCodeSVG value={destination.address} size={176} level="M" includeMargin={false} /></div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C8299]">Deposit address</p>
                  <p className="mt-1 break-all font-mono text-xs leading-5 text-white">{destination.address}</p>
                  <button type="button" onClick={() => void copyAddress()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-[#21152F] px-4 text-sm font-semibold text-[#D9D2E6]">
                    {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy address'}
                  </button>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#2B2037] bg-[#0B0912] p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-[#8C8299]">Minimum</p><p className="mt-1 font-mono text-xs font-semibold text-white">{destination.minDeposit ?? '—'} {destination.asset}</p></div>
                    <div className="rounded-xl border border-[#2B2037] bg-[#0B0912] p-3"><p className="text-[10px] uppercase tracking-[0.1em] text-[#8C8299]">Confirmations</p><p className="mt-1 font-mono text-xs font-semibold text-white">{destination.confirmationCount ?? '—'}</p></div>
                  </div>
                </section>

                {destination.label?.trim() && (
                  <section className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                    <p className="text-xs font-semibold text-amber-100">Deposit notice</p>
                    <p className="mt-1 text-xs leading-5 text-[#C3BBD0]">{destination.label}</p>
                  </section>
                )}

                <section className="space-y-4 rounded-2xl border border-[#2B2037] bg-[#12101A] p-4">
                  <label className="block text-xs font-medium text-[#C3BBD0]">Recharge amount
                    <input className="nexi-input mt-1 w-full" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={`Amount in ${destination.asset}`} required />
                  </label>
                  <label className="block text-xs font-medium text-[#C3BBD0]">Transaction hash <span className="font-normal text-[#8C8299]">(optional)</span>
                    <input className="nexi-input mt-1 w-full font-mono" value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="TXID / transaction hash" />
                  </label>
                  <label className="block text-xs font-medium text-[#C3BBD0]">Deposit screenshot
                    <span className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-300/25 bg-[#0B0912] px-3 py-4 text-center">
                      <ImageIcon size={20} className="text-[#A995FF]" />
                      <span className="mt-2 text-xs text-[#C3BBD0]">{proof ? proof.name : 'Upload PNG, JPEG, WebP or GIF'}</span>
                      <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setProof(event.target.files?.[0] ?? null)} required />
                    </span>
                  </label>
                  <button type="submit" disabled={busy || !proof || !amount || Number(amount) <= 0} className="min-h-12 w-full rounded-xl bg-[#8B5CF6] px-4 font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.22)] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Submitting…' : 'Submit deposit claim'}</button>
                </section>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#2B2037] bg-[#171022] p-4 text-sm text-[#C3BBD0]">
                <p>No active deposit destination is configured for this asset.</p>
                <button type="button" onClick={() => setStep('asset')} className="mt-3 min-h-11 font-semibold text-[#A995FF]">Choose another asset</button>
              </div>
            )}
          </div>
        </section></ModalSurface>
  );
}
