'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Bitcoin,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Gem,
  Search,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MarketPair, useMarketData } from '../hooks/useMarketData';
import { nexiTransition } from '../lib/nexi-motion';
import { instrumentFromMarketPair, normalizePair, pairToRouteSymbol } from '../state/active-instrument';
import { useActiveInstrument } from '../state/ActivePairProvider';
import { useLocale } from '../state/LocaleProvider';
import { AssetMark, MarketSparkline, OpportunityArtwork } from './components/QuotesHubVisuals';

const tabs = [
  { label: 'Favorites', icon: Star },
  { label: 'Crypto', icon: Bitcoin },
  { label: 'Metals', icon: Gem },
  { label: 'Forex', icon: CircleDollarSign },
  { label: 'Stocks', icon: BarChart3 },
] as const;

type Tab = (typeof tabs)[number]['label'];

function formatValue(item: MarketPair, value: 'price' | 'change' | 'volume') {
  if (item.dataState !== 'LIVE' || item.source === 'fallback') return '—';
  if (value === 'price') return item.price === null ? '—' : item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  if (value === 'change') return item.change === null ? '—' : `${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%`;
  return item.vol == null ? '—' : item.vol.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
export default function Dashboard() {
  const router = useRouter();
  const { activeInstrument, setActiveInstrument } = useActiveInstrument();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('Crypto');
  const [query, setQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { marketPairs, metal, shares, forex, loading, error: marketError } = useMarketData();

  const activeData = useMemo(() => {
    const source = activeTab === 'Favorites'
      ? []
      : activeTab === 'Metals'
        ? metal
        : activeTab === 'Forex'
          ? forex
          : activeTab === 'Stocks'
            ? shares
            : marketPairs;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return source;
    return source.filter((item) => `${item.displaySymbol} ${item.name} ${item.symbol}`.toLowerCase().includes(normalizedQuery));
  }, [activeTab, forex, marketPairs, metal, query, shares]);

  const activePair = activeData.find((item) => normalizePair(item.symbol) === normalizePair(activeInstrument.pair)) ?? (activeTab === 'Favorites' ? undefined : activeData[0] ?? marketPairs[0]);

  const openAsset = (item: MarketPair) => {
    const instrument = instrumentFromMarketPair(item);
    setActiveInstrument(instrument);
    router.push(`/dashboard/asset/${encodeURIComponent(pairToRouteSymbol(instrument.pair))}`);
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="nexi-page-shell relative min-h-[100dvh] overflow-hidden pb-0 text-[var(--nexi-text)] md:pb-8">
      <div aria-hidden="true" className="nexi-atmosphere pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-[1510px] flex-col px-3 pb-2 pt-1.5 md:px-7 md:pb-8 md:pt-5">
        <header className="nexi-dashboard-toolbar -mx-3 mt-2 flex min-h-[54px] items-center justify-end gap-2 px-3 md:-mx-7 md:min-h-[60px] md:px-7">
          <label className="hidden h-11 min-w-[320px] max-w-[430px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-[var(--nexi-text-muted)] backdrop-blur-xl md:flex">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t('filter')}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search markets, assets, or pairs"
              className="w-full bg-transparent text-white outline-none placeholder:text-[var(--nexi-text-muted)]"
            />
          </label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Search markets" aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen((value) => !value)} className="nexi-header-icon nexi-interactive h-11 w-11 md:hidden"><Search className="h-[18px] w-[18px]" aria-hidden="true" /></button>
          </div>
        </header>
        {mobileSearchOpen && (
          <label className="nexi-shell-glass mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-violet-300/20 px-3 text-sm md:hidden">
            <Search className="h-4 w-4 shrink-0 text-[var(--nexi-cyan)]" aria-hidden="true" />
            <span className="sr-only">{t('filter')}</span>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search markets, assets, or pairs" className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--nexi-text-muted)]" />
          </label>
        )}
        <section className="nexi-dashboard-hero mt-3 grid grid-cols-[minmax(0,1fr)_164px] items-start gap-2 md:mt-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-end md:gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 pt-1">
            <h1 className="nexi-dashboard-title whitespace-nowrap text-[clamp(1.875rem,8vw,3rem)] font-semibold leading-[1.02] tracking-[var(--nexi-type-display-tracking)] gradient-text">Quotes Hub</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 md:mt-3">
              <p className="text-xs leading-[18px] text-[var(--nexi-text-secondary)] md:text-base">Real-time markets. Precision insights.</p>
            </div>
          </div>

          {activePair && (
            <section className="nexi-active-pair relative overflow-hidden rounded-[12px] p-2.5 md:rounded-[22px] md:p-5">
              <div className="relative flex min-w-0 items-center gap-1.5 md:gap-3">
                <button type="button" onClick={() => openAsset(activePair)} className="nexi-interactive flex min-w-0 flex-1 items-center gap-2 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] md:gap-3">
                  <AssetMark item={activePair} large />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-0.5 text-[14px] font-semibold leading-none md:gap-1.5 md:text-[1.35rem]">
                      <span>{instrumentFromMarketPair(activePair).pair}</span>
                    </span>
                    <span className="mt-1 inline-flex rounded border border-violet-300/20 bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-violet-300 md:mt-2 md:rounded-md md:px-2 md:py-1 md:text-[10px]">{activePair.category === 'Crypto' ? 'SPOT' : 'MARKET'}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--nexi-text-secondary)] md:h-5 md:w-5" aria-hidden="true" />
                </button>
                <button type="button" disabled aria-label="Favorites unavailable" title="Saved favorites are not available yet" className="nexi-icon-button h-11 w-11 shrink-0 cursor-not-allowed rounded-[12px] opacity-50 md:rounded-[14px]"><Star className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" /></button>
              </div>
            </section>
          )}
        </section>

        <section className="nexi-tabs-shell mt-3 overflow-hidden rounded-[10px] md:mt-5 md:rounded-[22px]">
          <div className="grid grid-cols-5 gap-0 p-1 md:gap-1 md:p-1.5" role="tablist" aria-label="Market categories">
            {tabs.map(({ label, icon: Icon }, index) => {
              const active = activeTab === label;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(label)}
                  className={`relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[8px] px-1 text-[10px] font-medium transition md:min-h-14 md:flex-row md:gap-2 md:rounded-[16px] md:text-sm ${index < tabs.length - 1 ? 'border-r border-white/[0.05] md:border-r-0' : ''} ${active ? 'text-white' : 'text-[var(--nexi-text-secondary)] hover:bg-white/[0.04] hover:text-white'}`}
                >
                  {active && <motion.span layoutId="quotes-tab" className="nexi-tab-edge absolute inset-0 rounded-[8px] border border-[color:var(--nexi-cal-violet-bright)]/55 bg-[linear-gradient(180deg,rgba(44,20,108,.88),rgba(24,8,72,.8))] shadow-[0_0_20px_rgba(115,83,221,.28)] md:rounded-[16px]" transition={{ type: 'tween', ...nexiTransition.tab }} />}
                  <Icon className={`relative h-[17px] w-[17px] md:h-5 md:w-5 ${active ? 'text-violet-300' : ''}`} strokeWidth={1.7} aria-hidden="true" />
                  <span className="relative truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="mt-2 md:mt-5">
          <div className="hidden items-center justify-between gap-3 px-1 md:flex">
            <div>
              <h2 className="text-xl font-semibold text-white">{activeTab}</h2>
              <p className="mt-1 text-xs text-[var(--nexi-text-muted)]">{loading ? t('loadingMarketCatalog') : `${activeData.length} instruments available`}</p>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1.45fr)_50px_minmax(0,.74fr)_minmax(0,.68fr)_minmax(0,.58fr)] gap-1 px-2 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--nexi-text-muted)] md:mt-4 md:grid-cols-[minmax(0,1.35fr)_140px_minmax(0,.82fr)_minmax(0,.72fr)_minmax(0,.72fr)] md:gap-3 md:px-4 md:text-[10px]">
            <span>{t('asset')}</span>
            <span aria-hidden="true" />
            <span className="min-w-0 truncate text-right">{t('lastPrice')}</span>
            <span className="min-w-0 truncate text-right">{t('change24h')}</span>
            <span className="min-w-0 truncate text-right">{t('volume24h')}</span>
          </div>

          <div className="mt-1.5 space-y-1.5 md:mt-3 md:space-y-2.5">
            {loading ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]">{t('loadingMarketCatalog')}…</div>
            ) : marketError ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]">Market data is unavailable right now.</div>
            ) : activeTab === 'Favorites' ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]">Saved favorites are not available yet.</div>
            ) : activeData.length === 0 ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]">{t('noInstrumentsAvailable')}</div>
            ) : activeData.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => openAsset(item)}
                className="nexi-market-row nexi-interactive group grid min-h-[56px] w-full grid-cols-[minmax(0,1.45fr)_50px_minmax(0,.74fr)_minmax(0,.68fr)_minmax(0,.58fr)] items-center gap-1 rounded-[8px] px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] md:min-h-[78px] md:grid-cols-[minmax(0,1.35fr)_140px_minmax(0,.82fr)_minmax(0,.72fr)_minmax(0,.72fr)] md:gap-3 md:rounded-[18px] md:px-4"
              >
                <span className="flex min-w-0 items-center gap-2 md:gap-3">
                  <span className="shrink-0"><AssetMark item={item} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-white group-hover:text-[var(--nexi-cyan)] md:text-[15px]">{instrumentFromMarketPair(item).pair}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--nexi-text-muted)] md:mt-1 md:text-xs">{item.name}</span>
                  </span>
                </span>
                <span className="min-w-0 overflow-hidden"><span className="block origin-center scale-[0.78] md:scale-100"><MarketSparkline item={item} compact /></span></span>
                <span className="min-w-0 truncate text-right font-mono text-[10px] tabular-nums text-white md:text-sm">{formatValue(item, 'price')}</span>
                <span className={`min-w-0 truncate text-right font-mono text-[10px] tabular-nums md:text-sm ${item.dataState !== 'LIVE' ? 'text-[var(--nexi-text-muted)]' : item.change !== null && item.change >= 0 ? 'text-[var(--nexi-positive)]' : 'text-[var(--nexi-negative)]'}`}>{formatValue(item, 'change')}</span>
                <span className="min-w-0 truncate text-right font-mono text-[10px] tabular-nums text-[var(--nexi-text-secondary)] md:text-sm">{formatValue(item, 'volume')}</span>
              </button>
            ))}
          </div>

        </section>
        <section className="nexi-promo relative mt-auto min-h-[108px] overflow-hidden rounded-[18px] px-3 py-3 md:mt-6 md:min-h-[220px] md:rounded-[24px] md:px-7 md:py-8">
          <OpportunityArtwork />
          <div className="relative ml-[34%] max-w-[470px] md:ml-[26%]">
            <h2 className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.025em] text-white md:text-3xl">Markets move fast.</h2>
            <p className="mt-0.5 text-[11px] font-medium text-[var(--nexi-text-secondary)] md:mt-1 md:text-2xl">Act with precision.</p>
            <button type="button" onClick={() => router.push('/dashboard/learn')} className="nexi-promo-button nexi-interactive mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-medium md:mt-5 md:min-h-11 md:rounded-xl md:px-4 md:text-sm">Explore Opportunities <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" aria-hidden="true" /></button>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-1.5 md:right-5 md:top-5 md:gap-2" aria-label="Promotional panel pagination"><span className="h-1.5 w-1.5 rounded-full bg-[var(--nexi-cal-violet-bright)] shadow-[0_0_10px_var(--nexi-cal-violet-bright)] md:h-2 md:w-2" /><span className="h-1.5 w-1.5 rounded-full bg-violet-300/25 md:h-2 md:w-2" /><span className="h-1.5 w-1.5 rounded-full bg-violet-300/25 md:h-2 md:w-2" /><span className="h-1.5 w-1.5 rounded-full bg-violet-300/25 md:h-2 md:w-2" /></div>
        </section>
      </div>
    </div>
  );
}
