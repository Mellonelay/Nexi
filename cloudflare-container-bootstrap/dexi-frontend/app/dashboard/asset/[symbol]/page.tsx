'use client';

import Link from 'next/link';
import { ArrowUpRight, BarChart3, ChevronRight, Info, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RealtimeTradingChart from '../../../components/RealtimeTradingChart';
import { useActiveInstrument } from '../../../state/ActivePairProvider';
import { useMarketData } from '../../../hooks/useMarketData';
import { instrumentFromMarketPair, normalizePair } from '../../../state/active-instrument';
import { findAsset } from '../../../lib/asset-registry';
import AssetIcon from '../../../components/AssetIcon';
import SafeBackButton from '../../../components/SafeBackButton';

const placeholder = '—';

export default function AssetDetailPage() {
  const params = useParams<{ symbol: string }>();
  const routeSymbol = decodeURIComponent(params.symbol ?? 'BTCUSDT');
  const { setActiveInstrument } = useActiveInstrument();
  const { marketPairs, metal, shares, forex, loading: marketLoading, error: marketError } = useMarketData();
  const [timeframe, setTimeframe] = useState('1h');
  const matchedItem = [...marketPairs, ...metal, ...shares, ...forex].find((item) => normalizePair(item.symbol) === normalizePair(routeSymbol));
  const timeframeOptions = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;

  useEffect(() => {
    if (matchedItem) setActiveInstrument(instrumentFromMarketPair(matchedItem));
  }, [matchedItem, setActiveInstrument]);

  if (!matchedItem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050508] px-6 text-center text-sm text-[#C3BBD0]">
        <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
        <p>{marketLoading ? 'Resolving approved market asset…' : marketError ? 'Market data is unavailable. The approved asset cannot be resolved right now.' : 'This market asset is not approved.'}</p>
      </div>
    );
  }

  const instrument = instrumentFromMarketPair(matchedItem);
  const definition = findAsset(instrument.pair) ?? findAsset(instrument.symbol);
  const isCrypto = instrument.category === 'Crypto';
  const aboutCopy = isCrypto
    ? `${instrument.name} market context and project information.`
    : `${instrument.category} reference information for this approved instrument.`;
  const aboutFacts = isCrypto
    ? [['Protocol / network', definition?.protocol ?? placeholder], ['Supply model', placeholder], ['Metadata source', definition?.metadataProvider ?? placeholder]]
    : instrument.category === 'Metal'
      ? [['Reference instrument', placeholder], ['Market session', placeholder], ['Contract details', placeholder]]
      : instrument.category === 'Forex'
        ? [['Base / quote', instrument.pair || placeholder], ['Market session', placeholder], ['Lot details', placeholder]]
        : [['Issuer', placeholder], ['Exchange', placeholder], ['Corporate actions', placeholder]];

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#050508] px-4 pb-28 pt-4 text-[#F8F6FF] md:px-8 md:pb-10 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" className="border-violet-300/20 bg-[#100A18] hover:border-violet-300/45" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C8299]">Asset Detail</p>
            <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">{instrument.pair}</h1>
          </div>
          <button type="button" disabled aria-label="Favorites unavailable" title="Saved favorites are not available yet" className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-lg border border-violet-300/20 bg-[#100A18] text-[#C3BBD0] opacity-50">
            <Star className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <section className="mb-5 rounded-xl border border-violet-300/15 bg-[#100A18] p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-violet-300/20 bg-[#21152F]"><AssetIcon item={{ assetId: definition?.id ?? instrument.symbol, symbol: instrument.symbol, displaySymbol: definition?.displaySymbol ?? instrument.symbol, name: instrument.name }} size="md" /></div>
              <div>
                <p className="text-lg font-semibold">{instrument.name}</p>
                <p className="text-sm text-[#8C8299]">{instrument.category}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-2xl tabular-nums">{instrument.price ?? placeholder}</p>
              <p className="font-mono text-sm text-[#8C8299]">24h {instrument.change24h ?? placeholder}</p>
            </div>
          </div>
        </section>

        <section className="mb-5 min-w-0 overflow-hidden rounded-xl border border-violet-300/15 bg-[#0B0711]">
          <div className="flex items-center justify-between border-b border-violet-300/10 px-4 py-3">
            <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#A995FF]" aria-hidden="true" /><h2 className="font-semibold">Market chart</h2></div>
            <span className="text-xs text-[#8C8299]">{timeframe === '1d' ? '1D' : timeframe}</span>
          </div>
          <div className="min-w-0 min-h-[260px]">
            <RealtimeTradingChart symbol={normalizePair(instrument.pair)} type="spot" interval={timeframe} />
          </div>
          <div className="nexi-scroll-rail flex min-w-0 gap-1 overflow-x-auto border-t border-violet-300/10 p-2">
            {timeframeOptions.map((option) => <button key={option} type="button" onClick={() => setTimeframe(option)} aria-pressed={timeframe === option} className={`min-h-11 min-w-12 shrink-0 rounded-md px-2 text-xs font-semibold ${timeframe === option ? 'bg-[#2A1742] text-[#F8F6FF]' : 'text-[#8C8299] hover:bg-white/5 hover:text-white'}`}>{option === '1d' ? '1D' : option}</button>)}
          </div>
        </section>

        <section className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-violet-300/15 bg-[#100A18] p-4">
            <h2 className="mb-4 font-semibold">Market data</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div><dt className="text-[#8C8299]">Last price</dt><dd className="mt-1 font-mono">{instrument.price ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">24h change</dt><dd className="mt-1 font-mono">{instrument.change24h ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Volume (24h)</dt><dd className="mt-1 font-mono">{instrument.volume24h ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Precision</dt><dd className="mt-1 font-mono">{instrument.precision ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Source</dt><dd className="mt-1 font-mono">{matchedItem?.provider ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Updated</dt><dd className="mt-1 font-mono">{matchedItem?.observedAt ? new Date(matchedItem.observedAt).toLocaleTimeString() : placeholder}</dd></div>
            </dl>
          </div>
          <div className="min-w-0 rounded-xl border border-violet-300/15 bg-[#100A18] p-4">
            <div className="mb-3 flex items-center gap-2"><Info className="h-4 w-4 text-[#A995FF]" aria-hidden="true" /><h2 className="font-semibold">About {instrument.name}</h2></div>
            <p className="text-sm leading-6 text-[#C3BBD0]">{aboutCopy}</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-violet-300/10 pt-4 text-xs sm:grid-cols-3">
              {aboutFacts.map(([label, value]) => <div key={label}><dt className="text-[#8C8299]">{label}</dt><dd className="mt-1 break-words font-mono text-[#C3BBD0]">{value}</dd></div>)}
            </dl>

          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/dashboard/spot?symbol=${encodeURIComponent(instrument.pair)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#8B5CF6] px-4 text-sm font-semibold text-white transition hover:bg-[#A375FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Open Spot / Margin <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href={`/dashboard/binary?symbol=${encodeURIComponent(instrument.pair)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-violet-300/25 bg-[#21152F] px-4 text-sm font-semibold text-[#F8F6FF] transition hover:border-violet-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Open Options <ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}
