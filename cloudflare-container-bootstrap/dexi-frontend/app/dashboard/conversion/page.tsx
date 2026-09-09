'use client';

import { ArrowDownUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { resolveEndpointTemplate } from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';

type ConversionState = 'loading' | 'ready' | 'unavailable' | 'review' | 'submitting' | 'accepted' | 'failed';

export default function ConversionPage() {
  const conversionEnabled = process.env.NEXT_PUBLIC_CONVERSION_ENABLED === 'true';
  const [fromCoin, setFromCoin] = useState('USDT');
  const [toCoin, setToCoin] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<ConversionState>('loading');
  const [message, setMessage] = useState('Loading an authoritative conversion rate.');
  const rateEndpoint = resolveEndpointTemplate(
    process.env.NEXT_PUBLIC_CONVERSION_RATE_ENDPOINT,
    { from: fromCoin, to: toCoin },
  );
  const submitEndpoint = process.env.NEXT_PUBLIC_CONVERSION_SUBMIT_ENDPOINT;

  useEffect(() => {
    const sync = () => setUserId(sessionPrincipalId());
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  useEffect(() => {
    let active = true;
    if (!conversionEnabled || !rateEndpoint || !submitEndpoint) {
      setState('unavailable');
      setRate(null);
      setMessage('Conversion is disabled until explicit public rate and submission endpoints are configured.');
      return () => {
        active = false;
      };
    }
    setState('loading');
    setRate(null);
    setMessage('Loading an authoritative conversion rate.');

    api.get(rateEndpoint)
      .then((response) => {
        if (!active) return;
        const nextRate = Number(response.data?.rate);
        if (!Number.isFinite(nextRate) || nextRate <= 0) {
          setState('unavailable');
          setMessage('The backend did not return a usable conversion rate.');
          return;
        }
        setRate(nextRate);
        setState('ready');
        setMessage('Rate supplied by the NEXI backend.');
      })
      .catch(() => {
        if (!active) return;
        setState('unavailable');
        setMessage('Conversion pricing is currently unavailable.');
      });

    return () => {
      active = false;
    };
  }, [conversionEnabled, rateEndpoint, submitEndpoint]);

  const numericAmount = Number.parseFloat(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const estimatedReceive = useMemo(
    () => validAmount && rate ? (numericAmount * rate).toFixed(6) : '—',
    [numericAmount, rate, validAmount],
  );
  const canReview = state === 'ready' && validAmount && rate !== null && userId !== null && Boolean(submitEndpoint);

  const swapAssets = () => {
    setFromCoin(toCoin);
    setToCoin(fromCoin);
    setAmount('');
  };

  const submitConversion = async () => {
    if (state !== 'review' || !userId || !validAmount || !rate || !submitEndpoint) return;
    setState('submitting');
    setMessage('Submitting the reviewed conversion request.');
    try {
      await api.post(submitEndpoint, {
        userId,
        from: fromCoin,
        to: toCoin,
        amount: numericAmount,
      });
      setState('accepted');
      setMessage('The backend accepted the conversion request.');
      setAmount('');
    } catch {
      setState('failed');
      setMessage('The backend did not accept the conversion request.');
    }
  };

  return (
    <main className="min-h-0 bg-[#08060D] px-4 pb-32 pt-20 text-[#F8F6FF] sm:px-6 lg:pb-10 lg:pt-10">
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-violet-300/15 bg-[#121022] p-5 shadow-[0_20px_80px_rgba(46,16,72,0.35)] sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A995FF]">Wallet utility</p>
        <h1 className="mt-2 text-3xl font-semibold">Convert</h1>
        <p className="mt-2 text-sm leading-6 text-[#9F96AD]">
          Review an authoritative backend quote before submitting. NEXI never substitutes a placeholder rate.
        </p>

        <div className="mt-7 space-y-3">
          <label className="block rounded-xl border border-violet-300/15 bg-[#171022] p-4">
            <span className="text-xs text-[#9F96AD]">From</span>
            <span className="mt-2 flex gap-3">
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  if (state === 'review' || state === 'failed' || state === 'accepted') setState(rate ? 'ready' : 'unavailable');
                }}
                className="min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none placeholder:text-[#655C70]"
                placeholder="0.00"
                aria-label={`Amount of ${fromCoin}`}
              />
              <select
                value={fromCoin}
                onChange={(event) => setFromCoin(event.target.value)}
                className="min-h-11 rounded-lg border border-violet-300/15 bg-[#21152F] px-3 font-semibold"
                aria-label="Source asset"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </span>
          </label>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapAssets}
              aria-label="Swap source and destination assets"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/20 bg-[#21152F] text-[#CBB8FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
            >
              <ArrowDownUp className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <label className="block rounded-xl border border-violet-300/15 bg-[#171022] p-4">
            <span className="text-xs text-[#9F96AD]">Estimated receive</span>
            <span className="mt-2 flex gap-3">
              <output className="min-w-0 flex-1 text-2xl font-semibold text-[#C3BBD0]">{estimatedReceive}</output>
              <select
                value={toCoin}
                onChange={(event) => setToCoin(event.target.value)}
                className="min-h-11 rounded-lg border border-violet-300/15 bg-[#21152F] px-3 font-semibold"
                aria-label="Destination asset"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </span>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#9F96AD]">Rate</span>
          <span className="text-right font-medium">{rate ? `1 ${fromCoin} ≈ ${rate} ${toCoin}` : '—'}</span>
        </div>

        <p role="status" className="mt-4 rounded-lg border border-violet-300/10 bg-[#0D0A14] p-3 text-sm text-[#C3BBD0]">
          {!userId && state === 'ready' ? 'Sign in to review this conversion.' : message}
        </p>

        {state === 'review' ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setState('ready')}
              className="min-h-11 rounded-xl border border-violet-300/20 bg-[#171022] px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={submitConversion}
              className="min-h-11 rounded-xl bg-[#7C4DFF] px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4C5FF]"
            >
              Confirm
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canReview}
            onClick={() => {
              setState('review');
              setMessage('Review the exact assets, amount, and backend rate before confirming.');
            }}
            className="mt-5 min-h-11 w-full rounded-xl bg-[#7C4DFF] px-4 font-semibold disabled:cursor-not-allowed disabled:bg-[#21152F] disabled:text-[#766D82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4C5FF]"
          >
            {state === 'submitting' ? 'Submitting…' : 'Review conversion'}
          </button>
        )}
      </section>
    </main>
  );
}
