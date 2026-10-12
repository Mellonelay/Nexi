'use client';

import Link from 'next/link';
import { ArrowUpRight, BarChart3, ChevronRight, Info, Star } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RealtimeTradingChart from '../../../components/RealtimeTradingChart';
import api from '../../../lib/api';
import { useActiveInstrument } from '../../../state/ActivePairProvider';
import { useMarketData } from '../../../hooks/useMarketData';
import { useFavoriteAssets } from '../../../hooks/useFavoriteAssets';
import { instrumentFromMarketPair, normalizePair } from '../../../state/active-instrument';
import { findAsset } from '../../../lib/asset-registry';
import AssetIcon from '../../../components/AssetIcon';
import SafeBackButton from '../../../components/SafeBackButton';
import { marketDisplayStatus } from '../../../lib/market-data';
import LocalDateTime from '../../../components/LocalDateTime';

const placeholder = '—';
const formatNumber = (value: number | null, precision = 2) => value === null ? placeholder : value.toLocaleString('en-US', { maximumFractionDigits: precision });
const formatChange = (value: number | null) => value === null ? placeholder : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;
type MarketItem = ReturnType<typeof useMarketData>['marketPairs'][number];
type AssetDetails = {
  symbol: string;
  category: string;
  status: 'FRESH' | 'PARTIAL' | 'STALE';
  refreshedAt: string;
  expiresAt: string;
  sourceProvider?: string;
  provenance: Array<{ provider: string; url: string; checkedAt?: string; verifiedAt?: string }>;
  [key: string]: unknown;
};
type DetailState = 'LOADING' | 'READY' | 'UNAVAILABLE';
const detailText = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;
const detailList = (value: unknown): string | null => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join(', ') || null : null;
const detailValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('en-US', { maximumFractionDigits: 8 });
  return null;
};
const safeExternalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
};

function assetDetailModel(item: MarketItem, details: AssetDetails | null, detailState: DetailState) {
  const instrument = instrumentFromMarketPair(item);
  const definition = findAsset(instrument.pair) ?? findAsset(instrument.symbol);
  const aboutCopy = detailText(details?.description)
    ?? detailText(details?.companyOverview)
    ?? detailText(details?.securityDescription)
    ?? detailText(details?.pairDescription)
    ?? detailText(details?.instrumentDescription)
    ?? (detailState === 'LOADING' ? 'Loading approved asset profile…' : detailState === 'UNAVAILABLE' ? 'Descriptive profile details are currently unavailable.' : `${instrument.name} market reference information.`);
  const marketStats = details?.marketStats && typeof details.marketStats === 'object'
    ? details.marketStats as Record<string, unknown>
    : {};
  const metadataSource = detailText(details?.sourceProvider)
    ?? (details?.provenance?.map((entry) => entry.provider).filter(Boolean).join(', ') || placeholder);
  const aboutFacts: Array<[string, string]> = [
    ['Metadata status', details?.status ?? (detailState === 'UNAVAILABLE' ? 'UNAVAILABLE' : placeholder)],
    ['Metadata source', metadataSource],
    ['Last refreshed', detailText(details?.refreshedAt) ?? placeholder],
    ['Metadata expires', detailText(details?.expiresAt) ?? placeholder],
  ];
  if (instrument.category === 'Crypto') {
    aboutFacts.push(
      ['Project', detailText(details?.projectName) ?? instrument.name],
      ['Asset symbol', detailText(details?.assetSymbol) ?? instrument.symbol],
      ['Categories', detailList(details?.categories) ?? placeholder],
      ['Launch date', detailText(details?.launchDate) ?? placeholder],
      ['Market cap (USD)', detailValue(marketStats.marketCapUsd) ?? placeholder],
      ['Market cap rank', detailValue(marketStats.marketCapRank) ?? placeholder],
      ['Circulating supply', detailValue(marketStats.circulatingSupply) ?? placeholder],
      ['Max supply', detailValue(marketStats.maxSupply) ?? placeholder],
    );
  } else if (instrument.category === 'Shares') {
    aboutFacts.push(
      ['Issuer', detailText(details?.companyName) ?? instrument.name],
      ['Sector / industry', [detailText(details?.sector), detailText(details?.industry)].filter(Boolean).join(' / ') || placeholder],
      ['Exchange', detailText(details?.exchange) ?? placeholder],
      ['Exchange code', detailText(details?.exchangeCode) ?? placeholder],
      ['Quote currency', detailText(details?.quoteCurrency) ?? placeholder],
      ['Security type', detailText(details?.securityType) ?? placeholder],
      ['Instrument category', detailText(details?.instrumentCategory) ?? placeholder],
      ['Headquarters', detailText(details?.headquarters) ?? placeholder],
      ['Security description', detailText(details?.securityDescription) ?? placeholder],
    );
  } else if (instrument.category === 'Metal') {
    const specification = details?.specification && typeof details.specification === 'object'
      ? details.specification as Record<string, unknown>
      : {};
    aboutFacts.push(
      ['Instrument', detailText(details?.instrumentDescription) ?? instrument.name],
      ['Metal code', detailText(details?.metalCode) ?? placeholder],
      ['Quote currency', detailText(details?.quoteCurrency) ?? placeholder],
      ['Market session', detailText(details?.marketSessionState) ?? placeholder],
      ['Contract unit', detailValue(specification.unit) ?? placeholder],
      ['Contract size', detailValue(specification.contractSize) ?? placeholder],
      ['Price precision', detailValue(specification.pricePrecision) ?? placeholder],
    );
  } else if (instrument.category === 'Forex') {
    aboutFacts.push(
      ['Currency pair', detailText(details?.pair) ?? instrument.symbol],
      ['Base currency', detailText(details?.baseCurrencyName) ?? detailText(details?.baseCurrency) ?? placeholder],
      ['Quote currency', detailText(details?.quoteCurrencyName) ?? detailText(details?.quoteCurrency) ?? placeholder],
      ['Market session', detailText(details?.marketSessionState) ?? placeholder],
      ['Provider description source', detailText(details?.providerDescriptionSource) ?? placeholder],
      ['Provider timestamp', detailText(details?.providerTimestamp) ?? placeholder],
      ['Price precision', detailValue(details?.pricePrecision) ?? placeholder],
      ['Contract size', detailValue(details?.contractSize) ?? placeholder],
    );
  }
  const aboutLinks = ([
    ['Official website', safeExternalUrl(details?.officialWebsite)],
    ['Block explorer', safeExternalUrl(details?.explorer)],
  ] as Array<[string, string | null]>).filter((entry): entry is [string, string] => entry[1] !== null);
  const provenance = (details?.provenance ?? []).filter((entry) => safeExternalUrl(entry.url) !== null);
  const displayStatus = marketDisplayStatus(item.dataState, item.sessionState);
  const statusClass = displayStatus === 'Closed'
    ? 'border-white/15 text-[#8C8299]'
    : displayStatus === 'Live'
      ? 'border-emerald-300/20 text-emerald-200'
      : 'border-rose-300/20 text-rose-200';
  return { instrument, definition, aboutCopy, aboutFacts, aboutLinks, provenance, displayStatus, statusClass };
}

export default function AssetDetailPage() {
  const params = useParams<{ symbol: string }>();
  const routeSymbol = decodeURIComponent(params.symbol ?? 'BTCUSDT');
  const { setActiveInstrument } = useActiveInstrument();
  const { marketPairs, metal, shares, forex, loading: marketLoading, error: marketError } = useMarketData();
  const [timeframe, setTimeframe] = useState('1h');
  const matchedItem = [...marketPairs, ...metal, ...shares, ...forex].find((item) => normalizePair(item.symbol) === normalizePair(routeSymbol));

  useEffect(() => {
    if (matchedItem) setActiveInstrument(instrumentFromMarketPair(matchedItem));
  }, [matchedItem, setActiveInstrument]);

  if (!matchedItem) {
    return (
      <div className="nexi-page-shell relative flex min-h-full w-full flex-col items-center justify-center gap-4 overflow-x-clip px-6 py-6 text-center text-sm text-[#C3BBD0]">
        <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" />
        <p>{marketLoading ? 'Loading market asset…' : marketError ? 'Market data is unavailable. This asset cannot be loaded right now.' : 'This market asset is unavailable.'}</p>
      </div>
    );
  }

  return <AssetDetailView item={matchedItem} provider={matchedItem?.provider} timeframe={timeframe} onTimeframeChange={setTimeframe} />;
}

function AssetDetailView({
  item,
  provider,
  timeframe,
  onTimeframeChange,
}: {
  item: MarketItem;
  provider?: string | null;
  timeframe: string;
  onTimeframeChange: (value: string) => void;
}) {
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [detailState, setDetailState] = useState<DetailState>('LOADING');
  const favorites = useFavoriteAssets();

  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setDetailState('LOADING');
    api.get(`/market/assets/${encodeURIComponent(item.symbol)}`).then((response) => {
      if (cancelled) return;
      const profile = response.data?.details as AssetDetails | undefined;
      if (!profile || normalizePair(profile.symbol) !== normalizePair(item.symbol)) {
        setDetailState('UNAVAILABLE');
        return;
      }
      setDetails(profile);
      setDetailState('READY');
    }).catch(() => {
      if (!cancelled) setDetailState('UNAVAILABLE');
    });
    return () => { cancelled = true; };
  }, [item.symbol]);

  const { instrument, definition, aboutCopy, aboutFacts, aboutLinks, provenance, displayStatus, statusClass } = assetDetailModel(item, details, detailState);

  return (
    <div className="nexi-page-shell relative min-h-full w-full min-w-0 overflow-x-clip px-4 pb-6 pt-4 text-[#F8F6FF] md:px-8 md:pb-8 md:pt-8">
      <div className="relative mx-auto max-w-6xl">
        <header className="nexi-station-header mb-6 grid grid-cols-[44px_minmax(0,1fr)_44px] items-start gap-3 rounded-2xl border p-3 sm:gap-4 sm:p-4">
          <SafeBackButton fallback="/dashboard" label="Back to Quotes Hub" className="!min-h-[44px] !min-w-[44px] border-violet-300/20 bg-[#100A18] hover:border-violet-300/45" />
          <div className="min-w-0 flex-1">
            <p className="break-words text-xs font-semibold uppercase tracking-[0.16em] text-[#8C8299]">Asset Detail</p>
            <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{instrument.pair}</h1>
          </div>
          <button
            type="button"
            disabled={favorites.status !== 'READY' || favorites.saving}
            aria-label={favorites.isFavorite(instrument.pair) ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorites.isFavorite(instrument.pair)}
            title={favorites.status === 'READY' ? 'Toggle saved favorite' : favorites.status === 'LOADING' ? 'Loading saved favorites' : favorites.status === 'SIGN_IN_REQUIRED' ? 'Connect your wallet to load favorites' : 'Favorites are unavailable'}
            onClick={() => void favorites.toggleFavorite(instrument.pair)}
            className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-violet-300/20 bg-[#100A18] text-[#C3BBD0] transition-colors hover:border-violet-300/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] ${favorites.isFavorite(instrument.pair) ? 'text-violet-200' : ''}`}
          >
            <Star className="h-5 w-5" aria-hidden="true" fill={favorites.isFavorite(instrument.pair) ? 'currentColor' : 'none'} />
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
              <p className="font-mono text-2xl tabular-nums">{formatNumber(instrument.price, instrument.precision ?? 8)}</p>
              <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${statusClass}`}>{displayStatus}</span>
              <p className="font-mono text-sm text-[#8C8299]">24h {formatChange(instrument.change24h)}</p>
            </div>
          </div>
        </section>

        <section className="mb-5 min-w-0 overflow-hidden rounded-xl border border-violet-300/15 bg-[#0B0711]">
          <div className="flex items-center justify-between border-b border-violet-300/10 px-4 py-3">
            <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#A995FF]" aria-hidden="true" /><h2 className="font-semibold">Market chart</h2></div>
            <span className="text-xs text-[#8C8299]">{timeframe === '1d' ? '1D' : timeframe}</span>
          </div>
          <div className="min-w-0 min-h-[260px]">
            <RealtimeTradingChart
              symbol={normalizePair(instrument.pair)}
              type="spot"
              interval={timeframe}
              marketStatus={item.sessionState === 'CLOSED' ? 'CLOSED' : undefined}
              showIndicatorControls={false}
            />
          </div>
          <div className="nexi-scroll-rail flex min-w-0 gap-1 overflow-x-auto border-t border-violet-300/10 p-2">
            {TIMEFRAME_OPTIONS.map((option) => <button key={option} type="button" onClick={() => onTimeframeChange(option)} aria-pressed={timeframe === option} className={`min-h-11 min-w-12 shrink-0 rounded-md px-2 text-xs font-semibold ${timeframe === option ? 'bg-[#2A1742] text-[#F8F6FF]' : 'text-[#8C8299] hover:bg-white/5 hover:text-white'}`}>{option === '1d' ? '1D' : option}</button>)}
          </div>
        </section>

        <section className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-violet-300/15 bg-[#100A18] p-4">
            <h2 className="mb-4 font-semibold">Market data</h2>
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-x-4 gap-y-4 text-sm">
              <div><dt className="text-[#8C8299]">Last price</dt><dd className="mt-1 font-mono">{formatNumber(instrument.price, instrument.precision ?? 8)}</dd></div>
              <div><dt className="text-[#8C8299]">24h change</dt><dd className="mt-1 font-mono">{formatChange(instrument.change24h)}</dd></div>
              <div><dt className="text-[#8C8299]">Volume (24h)</dt><dd className="mt-1 font-mono">{formatNumber(instrument.volume24h)}</dd></div>
              <div><dt className="text-[#8C8299]">Precision</dt><dd className="mt-1 font-mono">{instrument.precision ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Source</dt><dd className="mt-1 font-mono">{provider ?? placeholder}</dd></div>
              <div><dt className="text-[#8C8299]">Updated</dt><dd className="mt-1 font-mono"><LocalDateTime value={item.observedAt} timeStyle="short" /></dd></div>
            </dl>
          </div>
          <div className="min-w-0 rounded-xl border border-violet-300/15 bg-[#100A18] p-4">
            <div className="mb-3 flex items-center gap-2"><Info className="h-4 w-4 text-[#A995FF]" aria-hidden="true" /><h2 className="font-semibold">About {instrument.name}</h2></div>
            <p className="text-sm leading-6 text-[#C3BBD0]">{aboutCopy}</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-violet-300/10 pt-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {aboutFacts.map(([label, value]) => <div key={label}><dt className="text-[#8C8299]">{label}</dt><dd className="mt-1 break-words font-mono text-[#C3BBD0]">{value}</dd></div>)}
            </dl>
            {aboutLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 border-t border-violet-300/10 pt-4">
                {aboutLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="text-xs font-semibold text-violet-200 underline decoration-violet-300/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">{label}</a>)}
              </div>
            )}
            {provenance.length > 0 && (
              <div className="mt-4 border-t border-violet-300/10 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8C8299]">Metadata provenance</h3>
                <ul className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  {provenance.map((entry) => {
                    const href = safeExternalUrl(entry.url);
                    if (!href) return null;
                    const checkedAt = detailText(entry.checkedAt) ?? detailText(entry.verifiedAt);
                    return <li key={href} className="min-w-0"><a href={href} target="_blank" rel="noreferrer" className="break-all text-violet-200 underline decoration-violet-300/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">{entry.provider}</a>{checkedAt && <span className="ml-2 break-words text-[#8C8299]">{entry.checkedAt ? 'Checked' : 'Verified'} {checkedAt}</span>}</li>;
                  })}
                </ul>
              </div>
            )}

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
