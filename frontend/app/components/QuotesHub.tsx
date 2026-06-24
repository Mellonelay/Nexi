'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleDot,
  Search,
  SlidersHorizontal,
  Star,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMarketData, type MarketPair } from '../hooks/useMarketData';
import {
  INSTRUMENTS,
  normalizeInstrumentSymbol,
  type ActiveInstrument,
  type MarketCategory,
} from '../lib/instruments';
import { useActivePair } from '../providers/ActivePairProvider';

const FAVORITES_KEY = 'dexi:quotes:favorites:v1';

type QuoteTab = 'favorites' | MarketCategory;
type SortMode = 'default' | 'change' | 'price';
type PriceDirection = 'up' | 'down' | 'flat';

interface QuoteViewModel {
  instrument: ActiveInstrument;
  pair?: MarketPair;
  livePrice: number | null;
  change24h: number | null;
  direction: PriceDirection;
  marketStatus: 'Live' | 'Awaiting data';
}

const tabs: readonly { id: QuoteTab; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'metal', label: 'Metal' },
  { id: 'forex', label: 'Forex' },
  { id: 'shares', label: 'Shares' },
];

const formatPrice = (value: number | null): string => {
  if (value === null) return '—';
  const maximumFractionDigits = value >= 1000 ? 2 : value >= 1 ? 4 : 8;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });
};

const formatChange = (value: number | null): string => {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const normalizedAliases = (pair: MarketPair): string[] => [
  normalizeInstrumentSymbol(pair.symbol),
  normalizeInstrumentSymbol(pair.displaySymbol),
  normalizeInstrumentSymbol(`${pair.displaySymbol}USDT`),
];

export default function QuotesHub() {
  const router = useRouter();
  const { activePair, setActivePair } = useActivePair();
  const { marketPairs, metal, shares, forex, loading } = useMarketData();

  const [activeTab, setActiveTab] = useState<QuoteTab>('crypto');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [compact, setCompact] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [directions, setDirections] = useState<Record<string, PriceDirection>>({});
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  const allSourcePairs = useMemo(
    () => [...marketPairs, ...metal, ...forex, ...shares],
    [marketPairs, metal, forex, shares],
  );

  const pairIndex = useMemo(() => {
    const index = new Map<string, MarketPair>();
    allSourcePairs.forEach((pair) => {
      normalizedAliases(pair).forEach((alias) => index.set(alias, pair));
    });
    return index;
  }, [allSourcePairs]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          setFavorites(new Set(parsed));
        }
      }
    } catch (error) {
      console.warn('Unable to restore quote favorites', error);
    } finally {
      setFavoritesHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesHydrated) return;
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites, favoritesHydrated]);

  useEffect(() => {
    if (!loading) setLastUpdated(new Date());
  }, [allSourcePairs, loading]);

  useEffect(() => {
    const timers: number[] = [];
    const changed: Record<string, PriceDirection> = {};

    INSTRUMENTS.forEach((instrument) => {
      const aliases = [
        instrument.canonicalSymbol,
        instrument.spotSymbol,
        instrument.binarySymbol,
        instrument.baseAsset,
        `${instrument.baseAsset}${instrument.quoteAsset}`,
      ].map(normalizeInstrumentSymbol);
      const pair = aliases.map((alias) => pairIndex.get(alias)).find(Boolean);
      const nextPrice = pair && Number.isFinite(pair.price) && pair.price > 0 ? pair.price : null;
      if (nextPrice === null) return;

      const previousPrice = previousPricesRef.current.get(instrument.assetId);
      if (previousPrice !== undefined && previousPrice !== nextPrice) {
        changed[instrument.assetId] = nextPrice > previousPrice ? 'up' : 'down';
        timers.push(
          window.setTimeout(() => {
            setDirections((current) => ({ ...current, [instrument.assetId]: 'flat' }));
          }, 450),
        );
      }
      previousPricesRef.current.set(instrument.assetId, nextPrice);
    });

    if (Object.keys(changed).length > 0) {
      setDirections((current) => ({ ...current, ...changed }));
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pairIndex]);

  const quotes = useMemo<QuoteViewModel[]>(() => {
    return INSTRUMENTS.map((instrument) => {
      const aliases = [
        instrument.canonicalSymbol,
        instrument.spotSymbol,
        instrument.binarySymbol,
        instrument.baseAsset,
        `${instrument.baseAsset}${instrument.quoteAsset}`,
      ].map(normalizeInstrumentSymbol);
      const pair = aliases.map((alias) => pairIndex.get(alias)).find(Boolean);
      const hasPrice = Boolean(pair && Number.isFinite(pair.price) && pair.price > 0);

      return {
        instrument,
        pair,
        livePrice: hasPrice && pair ? pair.price : null,
        change24h: hasPrice && pair && Number.isFinite(pair.change) ? pair.change : null,
        direction: directions[instrument.assetId] ?? 'flat',
        marketStatus: hasPrice ? 'Live' : 'Awaiting data',
      };
    });
  }, [directions, pairIndex]);

  const visibleQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const result = quotes.filter(({ instrument }) => {
      const matchesTab =
        activeTab === 'favorites'
          ? favorites.has(instrument.assetId)
          : instrument.category === activeTab;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        instrument.displayName.toLowerCase().includes(normalizedSearch) ||
        instrument.canonicalSymbol.toLowerCase().includes(normalizedSearch) ||
        instrument.baseAsset.toLowerCase().includes(normalizedSearch);
      return matchesTab && matchesSearch;
    });

    if (sortMode === 'change') {
      return [...result].sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity));
    }
    if (sortMode === 'price') {
      return [...result].sort((a, b) => (b.livePrice ?? -Infinity) - (a.livePrice ?? -Infinity));
    }
    return result;
  }, [activeTab, favorites, quotes, search, sortMode]);

  const liveCount = quotes.filter((quote) => quote.livePrice !== null).length;
  const connectionLabel = loading ? 'Connecting' : liveCount > 0 ? 'Connected' : 'Awaiting feed';

  const toggleFavorite = (assetId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const selectInstrument = (instrument: ActiveInstrument) => {
    setActivePair(instrument);
  };

  const openTradingMode = (instrument: ActiveInstrument, mode: 'spot' | 'binary') => {
    setActivePair(instrument);
    const symbol = mode === 'spot' ? instrument.spotSymbol : instrument.binarySymbol;
    router.push(`/dashboard/${mode}?symbol=${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#060918] text-slate-100">
      <div className="flex min-h-[100dvh] min-w-0">
        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0f172a]/90 px-4 backdrop-blur-[10px] md:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#00d4ff]">DEXI market intelligence</p>
              <h1 className="text-lg font-bold text-white">Quotes</h1>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-[#00d4ff]/25 bg-[#00d4ff]/10 px-4 text-sm font-semibold text-[#00d4ff] transition hover:border-[#00d4ff]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]"
            >
              Connect
            </button>
          </header>

          <main className="mx-auto w-full max-w-[1600px] space-y-4 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Quotes</h2>
                <p className="mt-1 text-sm text-slate-400">Live multi-asset markets and trading pair selection</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#00d4ff]/15 bg-[#0f172a]/70 p-2 backdrop-blur-[10px]">
                <div className="flex min-w-0 items-center gap-3 px-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00d4ff]/20 bg-[#00d4ff]/10 text-sm font-bold text-[#00d4ff]">
                    {activePair.fallbackMark}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Active pair</p>
                    <p className="truncate text-sm font-semibold text-white">{activePair.canonicalSymbol}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openTradingMode(activePair, 'spot')}
                  className="min-h-10 rounded-lg bg-[#00d4ff] px-3 text-xs font-bold text-[#060918] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Open Spot
                </button>
                <button
                  type="button"
                  onClick={() => openTradingMode(activePair, 'binary')}
                  className="min-h-10 rounded-lg border border-[#6366f1]/50 bg-[#6366f1]/15 px-3 text-xs font-bold text-indigo-200 transition hover:bg-[#6366f1]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
                >
                  Open Option
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0f172a]/65 px-2 backdrop-blur-[10px]">
              <div className="flex min-w-max" role="tablist" aria-label="Quote categories">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative min-h-12 px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00d4ff] ${
                      activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'favorites' && favorites.size > 0 ? (
                      <span className="ml-2 rounded-full bg-[#ec4899]/15 px-1.5 py-0.5 text-[10px] text-pink-300">{favorites.size}</span>
                    ) : null}
                    {activeTab === tab.id ? (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.55)]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border border-white/10 bg-[#0f172a]/65 p-3 backdrop-blur-[10px] lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto] lg:items-center">
              <label className="relative block">
                <span className="sr-only">Search asset or symbol</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search asset or symbol"
                  className="min-h-11 w-full rounded-lg border border-white/10 bg-[#060918] py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#00d4ff]/60 focus:ring-2 focus:ring-[#00d4ff]/20"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#060918] px-3">
                  <CircleDot className="h-3.5 w-3.5 text-[#10b981]" />
                  {liveCount}/{quotes.length} live
                </span>
                <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-[#060918] px-3">
                  {liveCount > 0 ? <Wifi className="h-3.5 w-3.5 text-[#10b981]" /> : <WifiOff className="h-3.5 w-3.5 text-slate-500" />}
                  {connectionLabel}
                </span>
                <span className="inline-flex min-h-9 items-center rounded-lg border border-white/10 bg-[#060918] px-3 tabular-nums">
                  Updated {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                </span>
              </div>

              <label className="relative">
                <span className="sr-only">Sort quotes</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="min-h-11 appearance-none rounded-lg border border-white/10 bg-[#060918] py-2 pl-3 pr-9 text-xs font-semibold text-slate-300 outline-none focus:border-[#00d4ff]/60 focus:ring-2 focus:ring-[#00d4ff]/20"
                >
                  <option value="default">Default order</option>
                  <option value="change">24h change</option>
                  <option value="price">Live price</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </label>

              <button
                type="button"
                aria-pressed={compact}
                onClick={() => setCompact((value) => !value)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#060918] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#00d4ff]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {compact ? 'Compact' : 'Comfortable'}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0f172a]/65 backdrop-blur-[10px]">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Loading market feed…</div>
              ) : visibleQuotes.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                  <Star className="mb-3 h-8 w-8 text-slate-600" />
                  <h3 className="text-base font-semibold text-white">
                    {activeTab === 'favorites' ? 'No favorite markets yet' : 'No matching markets'}
                  </h3>
                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    {activeTab === 'favorites'
                      ? 'Select the star beside any asset to add it here.'
                      : 'Adjust the search term or select another market category.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[1050px] border-collapse text-left">
                      <thead className="border-b border-white/10 bg-[#060918]/80 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                          <th className="w-14 px-3 py-3 text-center">Favorite</th>
                          <th className="px-3 py-3">Asset</th>
                          <th className="px-3 py-3">Symbol</th>
                          <th className="px-3 py-3 text-right">Live price</th>
                          <th className="px-3 py-3 text-right">24h change</th>
                          <th className="px-3 py-3 text-right">24h high</th>
                          <th className="px-3 py-3 text-right">24h low</th>
                          <th className="px-3 py-3">Market status</th>
                          <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleQuotes.map((quote) => {
                          const selected = activePair.assetId === quote.instrument.assetId;
                          const favorite = favorites.has(quote.instrument.assetId);
                          const positive = (quote.change24h ?? 0) > 0;
                          const negative = (quote.change24h ?? 0) < 0;
                          const rowPadding = compact ? 'py-2.5' : 'py-4';

                          return (
                            <tr
                              key={quote.instrument.assetId}
                              tabIndex={0}
                              aria-selected={selected}
                              onClick={() => selectInstrument(quote.instrument)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  selectInstrument(quote.instrument);
                                }
                              }}
                              className={`cursor-pointer border-b border-white/[0.06] transition last:border-0 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00d4ff] ${
                                selected ? 'bg-[#00d4ff]/[0.07] shadow-[inset_3px_0_0_#00d4ff]' : ''
                              } ${
                                quote.direction === 'up'
                                  ? 'bg-[#10b981]/10'
                                  : quote.direction === 'down'
                                    ? 'bg-[#ef4444]/10'
                                    : ''
                              }`}
                            >
                              <td className={`px-3 ${rowPadding} text-center`}>
                                <button
                                  type="button"
                                  aria-label={`${favorite ? 'Remove' : 'Add'} ${quote.instrument.displayName} ${favorite ? 'from' : 'to'} favorites`}
                                  aria-pressed={favorite}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleFavorite(quote.instrument.assetId);
                                  }}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-[#ec4899] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                                >
                                  <Star className={`h-4 w-4 ${favorite ? 'fill-[#ec4899] text-[#ec4899]' : ''}`} />
                                </button>
                              </td>
                              <td className={`px-3 ${rowPadding}`}>
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#060918] text-xs font-bold text-[#00d4ff]">
                                    {quote.pair?.icon && !quote.pair.icon.startsWith('http') ? quote.pair.icon : quote.instrument.fallbackMark}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{quote.instrument.displayName}</p>
                                    <p className="text-[10px] capitalize text-slate-500">{quote.instrument.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td className={`px-3 ${rowPadding} font-mono text-xs font-semibold text-slate-300`}>{quote.instrument.canonicalSymbol}</td>
                              <td className={`px-3 ${rowPadding} text-right font-mono text-sm font-semibold tabular-nums text-white`}>
                                <span className="inline-flex items-center justify-end gap-1">
                                  {quote.direction === 'up' ? <ArrowUp className="h-3.5 w-3.5 text-[#10b981]" /> : null}
                                  {quote.direction === 'down' ? <ArrowDown className="h-3.5 w-3.5 text-[#ef4444]" /> : null}
                                  {formatPrice(quote.livePrice)}
                                </span>
                              </td>
                              <td className={`px-3 ${rowPadding} text-right font-mono text-xs font-semibold tabular-nums ${positive ? 'text-[#10b981]' : negative ? 'text-[#ef4444]' : 'text-slate-500'}`}>
                                <span className="inline-flex items-center gap-1">
                                  {positive ? <ArrowUp className="h-3 w-3" /> : negative ? <ArrowDown className="h-3 w-3" /> : null}
                                  {formatChange(quote.change24h)}
                                </span>
                              </td>
                              <td className={`px-3 ${rowPadding} text-right font-mono text-xs text-slate-500`}>—</td>
                              <td className={`px-3 ${rowPadding} text-right font-mono text-xs text-slate-500`}>—</td>
                              <td className={`px-3 ${rowPadding}`}>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${quote.marketStatus === 'Live' ? 'border-[#10b981]/25 bg-[#10b981]/10 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-slate-500'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${quote.marketStatus === 'Live' ? 'bg-[#10b981]' : 'bg-slate-600'}`} />
                                  {quote.marketStatus}
                                </span>
                              </td>
                              <td className={`px-3 ${rowPadding}`}>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openTradingMode(quote.instrument, 'spot');
                                    }}
                                    className="min-h-9 rounded-lg bg-[#00d4ff] px-3 text-[10px] font-bold text-[#060918] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                  >
                                    Spot
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openTradingMode(quote.instrument, 'binary');
                                    }}
                                    className="min-h-9 rounded-lg border border-[#6366f1]/45 bg-[#6366f1]/15 px-3 text-[10px] font-bold text-indigo-200 transition hover:bg-[#6366f1]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
                                  >
                                    Option
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-white/[0.06] sm:hidden">
                    {visibleQuotes.map((quote) => {
                      const selected = activePair.assetId === quote.instrument.assetId;
                      const favorite = favorites.has(quote.instrument.assetId);
                      const positive = (quote.change24h ?? 0) > 0;
                      const negative = (quote.change24h ?? 0) < 0;

                      return (
                        <article
                          key={quote.instrument.assetId}
                          className={`p-3 transition ${selected ? 'bg-[#00d4ff]/[0.07] shadow-[inset_3px_0_0_#00d4ff]' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`${favorite ? 'Remove' : 'Add'} ${quote.instrument.displayName} ${favorite ? 'from' : 'to'} favorites`}
                              aria-pressed={favorite}
                              onClick={() => toggleFavorite(quote.instrument.assetId)}
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                            >
                              <Star className={`h-4 w-4 ${favorite ? 'fill-[#ec4899] text-[#ec4899]' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => selectInstrument(quote.instrument)}
                              className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff]"
                            >
                              <span className="block truncate text-sm font-semibold text-white">{quote.instrument.displayName}</span>
                              <span className="block font-mono text-[10px] text-slate-500">{quote.instrument.canonicalSymbol}</span>
                            </button>

                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold tabular-nums text-white">{formatPrice(quote.livePrice)}</p>
                              <p className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${positive ? 'text-[#10b981]' : negative ? 'text-[#ef4444]' : 'text-slate-500'}`}>
                                {positive ? <ArrowUp className="h-3 w-3" /> : negative ? <ArrowDown className="h-3 w-3" /> : null}
                                {formatChange(quote.change24h)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-2">
                            <span className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold ${quote.marketStatus === 'Live' ? 'border-[#10b981]/25 bg-[#10b981]/10 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-slate-500'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${quote.marketStatus === 'Live' ? 'bg-[#10b981]' : 'bg-slate-600'}`} />
                              {quote.marketStatus}
                            </span>
                            <button
                              type="button"
                              onClick={() => openTradingMode(quote.instrument, 'spot')}
                              className="min-h-11 rounded-lg bg-[#00d4ff] px-3 text-xs font-bold text-[#060918] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              Spot
                            </button>
                            <button
                              type="button"
                              onClick={() => openTradingMode(quote.instrument, 'binary')}
                              className="min-h-11 rounded-lg border border-[#6366f1]/45 bg-[#6366f1]/15 px-3 text-xs font-bold text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
                            >
                              Option
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </main>
        </section>

        <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-[#0f172a] xl:flex">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Account</span>
              <button type="button" className="text-[#00d4ff]" aria-label="Account details">▼</button>
            </div>
          </div>
          <div className="p-4">
            <div className="rounded-xl border border-white/10 bg-[#060918] p-6 text-center">
              <div className="mb-4 text-5xl" aria-hidden="true">💼</div>
              <h3 className="text-lg font-bold text-white">Fund your wallet</h3>
              <p className="mb-4 mt-2 text-sm text-slate-400">Get your wallet ready to use web3</p>
              <button type="button" className="min-h-11 w-full rounded-lg bg-white px-4 font-semibold text-[#060918] transition hover:bg-slate-100">Add funds</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
