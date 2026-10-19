"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bitcoin,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Gem,
  Search,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { MarketPair, useMarketData } from "../hooks/useMarketData";
import { useFavoriteAssets } from "../hooks/useFavoriteAssets";
import { nexiTransition } from "../lib/nexi-motion";
import { marketDisplayStatus } from "../lib/market-data";
import {
  instrumentFromMarketPair,
  normalizePair,
  pairToRouteSymbol,
} from "../state/active-instrument";
import { useActiveInstrument } from "../state/ActivePairProvider";
import { useLocale } from "../state/LocaleProvider";
import {
  AssetMark,
  MarketSparkline,
} from "./components/QuotesHubVisuals";

const tabs = [
  { label: "Favorites", icon: Star },
  { label: "Crypto", icon: Bitcoin },
  { label: "Metals", icon: Gem },
  { label: "Forex", icon: CircleDollarSign },
  { label: "Stocks", icon: BarChart3 },
] as const;

type Tab = (typeof tabs)[number]["label"];

function formatValue(item: MarketPair, value: "price" | "change" | "volume") {
  if (value === "price" && item.sessionState === "CLOSED" && item.price !== null) {
    return item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  }
  if (item.dataState !== "LIVE" || item.source === "fallback") return "—";
  if (value === "price")
    return item.price === null
      ? "—"
      : item.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        });
  if (value === "change")
    return item.change === null
      ? "—"
      : `${item.change > 0 ? "+" : ""}${item.change.toFixed(2)}%`;
  return item.vol == null
    ? "—"
    : item.vol.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
export default function Dashboard() {
  const router = useRouter();
  const { activeInstrument, setActiveInstrument } = useActiveInstrument();
  const { t } = useLocale();
  const favorites = useFavoriteAssets();
  const isFavorite = favorites.isFavorite;
  const [activeTab, setActiveTab] = useState<Tab>("Crypto");
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const {
    marketPairs,
    metal,
    shares,
    forex,
    loading,
    error: marketError,
  } = useMarketData();

  const allMarketPairs = useMemo(
    () => [...marketPairs, ...metal, ...shares, ...forex],
    [forex, marketPairs, metal, shares],
  );
  const activeData = useMemo(() => {
    const source =
      activeTab === "Favorites"
        ? allMarketPairs.filter((item) => isFavorite(item.symbol))
        : activeTab === "Metals"
          ? metal
          : activeTab === "Forex"
            ? forex
            : activeTab === "Stocks"
              ? shares
              : marketPairs;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return source;
    return source.filter((item) =>
      `${item.displaySymbol} ${item.name} ${item.symbol}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [activeTab, allMarketPairs, isFavorite, forex, marketPairs, metal, query, shares]);

  const activePair =
    [...marketPairs, ...metal, ...shares, ...forex].find(
      (item) =>
        normalizePair(item.symbol) === normalizePair(activeInstrument.pair),
    );

  const openAsset = (item: MarketPair) => {
    const instrument = instrumentFromMarketPair(item);
    setActiveInstrument(instrument);
    router.push(
      `/dashboard/asset/${encodeURIComponent(pairToRouteSymbol(instrument.pair))}`,
    );
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="nexi-page-shell relative min-h-full overflow-hidden pb-0 text-[var(--nexi-text)] md:pb-8">
      <div
        aria-hidden="true"
        className="nexi-atmosphere pointer-events-none absolute inset-0"
      />
      <div className="relative mx-auto flex min-h-full max-w-[1510px] flex-col px-3 pb-2 pt-1.5 md:px-7 md:pb-8 md:pt-5">
        <header className="nexi-dashboard-toolbar -mx-3 mt-2 flex min-h-[54px] items-center justify-end gap-2 px-3 md:-mx-7 md:min-h-[60px] md:px-7">
          <label className="nexi-shell-glass hidden h-11 min-w-[320px] max-w-[430px] flex-1 items-center gap-2 rounded-xl border border-[var(--nexi-border-subtle)] px-4 text-sm text-[var(--nexi-text-muted)] md:flex">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("filter")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search markets, assets, or pairs"
              className="w-full bg-transparent text-white outline-none placeholder:text-[var(--nexi-text-muted)]"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search markets"
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((value) => !value)}
              className="nexi-header-icon nexi-interactive h-11 w-11 md:hidden"
            >
              <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </header>
        {mobileSearchOpen && (
          <label className="nexi-dashboard-search nexi-shell-glass mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-violet-300/20 px-3 text-sm md:hidden">
            <Search
              className="h-4 w-4 shrink-0 text-[var(--nexi-cyan)]"
              aria-hidden="true"
            />
            <span className="sr-only">{t("filter")}</span>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search markets, assets, or pairs"
              className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--nexi-text-muted)]"
            />
          </label>
        )}
        <section className="nexi-dashboard-hero mt-3 grid grid-cols-[minmax(0,1fr)_164px] items-start gap-2 md:mt-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-end md:gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 pt-1">
            <h1 className="nexi-dashboard-title whitespace-nowrap text-[clamp(1.875rem,8vw,3rem)] font-semibold leading-[1.02] tracking-[var(--nexi-type-display-tracking)] gradient-text">
              Quotes Hub
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 md:mt-3">
              <p className="text-xs leading-[18px] text-[var(--nexi-text-secondary)] md:text-base">
                Real-time markets. Precision insights.
              </p>
            </div>
          </div>

          {activePair && (
            <section className="nexi-active-pair relative overflow-hidden rounded-[12px] p-2.5 md:rounded-[22px] md:p-5">
              <div className="relative flex min-w-0 items-center gap-1.5 md:gap-3">
                <button
                  type="button"
                  onClick={() => openAsset(activePair)}
                  className="nexi-interactive flex min-w-0 flex-1 items-center gap-2 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] md:gap-3"
                >
                  <AssetMark item={activePair} large />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-0.5 text-[14px] font-semibold leading-none md:gap-1.5 md:text-[1.35rem]">
                      <span>{instrumentFromMarketPair(activePair).pair}</span>
                    </span>
                    <span className="mt-1 inline-flex rounded border border-violet-300/20 bg-violet-500/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-violet-300 md:mt-2 md:rounded-md md:px-2 md:py-1 md:text-[10px]">
                      {activePair.category === "Crypto" ? "SPOT" : "MARKET"}
                    </span>
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-[var(--nexi-text-secondary)] md:h-5 md:w-5"
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  disabled={favorites.status !== "READY" || favorites.saving}
                  aria-label={favorites.isFavorite(activePair.symbol) ? "Remove pair from favorites" : "Add pair to favorites"}
                  aria-pressed={favorites.isFavorite(activePair.symbol)}
                  title={favorites.status === "READY" ? "Toggle saved favorite" : favorites.status === "LOADING" ? "Loading saved favorites" : favorites.status === "SIGN_IN_REQUIRED" ? "Connect your wallet to load favorites" : "Favorites are unavailable"}
                  onClick={() => void favorites.toggleFavorite(activePair.symbol)}
                  className={`nexi-active-pair-favorite nexi-icon-button h-11 w-11 shrink-0 rounded-[12px] md:rounded-[14px] ${favorites.isFavorite(activePair.symbol) ? "text-violet-200" : ""}`}
                >
                  <Star className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" fill={favorites.isFavorite(activePair.symbol) ? "currentColor" : "none"} />
                </button>
              </div>
            </section>
          )}
        </section>

        <section className="nexi-tabs-shell mt-3 overflow-hidden rounded-[10px] md:mt-5 md:rounded-[22px]">
          <div
            className="grid grid-cols-5 gap-0 p-1 md:gap-1 md:p-1.5"
            role="tablist"
            aria-label="Market categories"
          >
            {tabs.map(({ label, icon: Icon }, index) => {
              const active = activeTab === label;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(label)}
                  className={`relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[8px] px-1 text-[10px] font-medium transition md:min-h-14 md:flex-row md:gap-2 md:rounded-[16px] md:text-sm ${index < tabs.length - 1 ? "border-r border-white/[0.05] md:border-r-0" : ""} ${active ? "text-white" : "text-[var(--nexi-text-secondary)] hover:bg-white/[0.04] hover:text-white"}`}
                >
                  {active && (
                    <LazyMotion features={domAnimation}>
                      <m.span
                      layoutId="quotes-tab"
                      className="nexi-tab-edge absolute inset-0 rounded-[8px] border border-[color:var(--nexi-cal-violet-bright)]/55 bg-[linear-gradient(180deg,rgba(44,20,108,.88),rgba(24,8,72,.8))] shadow-[0_0_20px_rgba(115,83,221,.28)] md:rounded-[16px]"
                      transition={{ type: "tween", ...nexiTransition.tab }}
                      />
                    </LazyMotion>
                  )}
                  <Icon
                    className={`relative h-[17px] w-[17px] md:h-5 md:w-5 ${active ? "text-violet-300" : ""}`}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
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
              <p className="mt-1 text-xs text-[var(--nexi-text-muted)]">
                {loading
                  ? t("loadingMarketCatalog")
                  : `${activeData.length} instruments available`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--nexi-text-muted)] md:mt-4 md:grid-cols-[minmax(0,1.35fr)_140px_minmax(0,.82fr)_minmax(0,.72fr)_minmax(0,.72fr)] md:gap-3 md:px-4 md:text-[10px]">
            <span className="md:hidden">Market</span>
            <span className="hidden md:block">{t("asset")}</span>
            <span className="text-right md:hidden">Price / 24h</span>
            <span className="hidden md:block" aria-hidden="true" />
            <span className="hidden min-w-0 text-right md:block">
              {t("lastPrice")}
            </span>
            <span className="hidden min-w-0 text-right md:block">
              {t("change24h")}
            </span>
            <span className="hidden min-w-0 text-right md:block">
              {t("volume24h")}
            </span>
          </div>

          {marketError && <p role="status" className="mt-3 text-xs text-[var(--nexi-text-muted)]">Prices unavailable. You can still explore all instruments.</p>}
          <div className="mt-1.5 space-y-1.5 md:mt-3 md:space-y-2.5">
            {loading || (activeTab === "Favorites" && favorites.status === "LOADING") ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]" role="status">
                {t("loadingMarketCatalog")}…
              </div>
            ) : activeTab === "Favorites" && favorites.status === "SIGN_IN_REQUIRED" ? (
              <div className="nexi-market-row flex flex-col items-center gap-3 px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]" role="status">
                <p>Connect your wallet to view and save favorites.</p>
                <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">
                  Connect wallet
                </Link>
              </div>
            ) : activeTab === "Favorites" && favorites.status === "UNAVAILABLE" ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]" role="status">
                Favorites could not be loaded. Try again later.
              </div>
            ) : activeData.length === 0 ? (
              <div className="nexi-market-row px-4 py-14 text-center text-sm text-[var(--nexi-text-muted)]" role="status">
                {activeTab === "Favorites" ? "No saved favorites yet. Save a pair from its header or asset details." : t("noInstrumentsAvailable")}
              </div>
            ) : (
              activeData.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => openAsset(item)}
                  className="nexi-market-row nexi-interactive group grid min-h-[76px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-[10px] px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] md:min-h-[78px] md:grid-cols-[minmax(0,1.35fr)_140px_minmax(0,.82fr)_minmax(0,.72fr)_minmax(0,.72fr)] md:gap-3 md:rounded-[18px] md:px-4 md:py-0"
                >
                  <span className="flex min-w-0 items-center gap-2 md:gap-3">
                    <span className="shrink-0">
                      <AssetMark item={item} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-white group-hover:text-[var(--nexi-cyan)] md:text-[15px]">
                        {instrumentFromMarketPair(item).pair}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--nexi-text-muted)] md:mt-1 md:text-xs">
                        {item.name}
                      </span>
                      <span className={`mt-1 inline-flex rounded border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] md:text-[9px] ${marketDisplayStatus(item.dataState, item.sessionState) === "Closed" ? "border-white/15 text-[var(--nexi-text-muted)]" : marketDisplayStatus(item.dataState, item.sessionState) === "Live" ? "border-emerald-300/20 text-emerald-200" : "border-rose-300/20 text-rose-200"}`}>
                        {marketDisplayStatus(item.dataState, item.sessionState)}
                      </span>
                    </span>
                  </span>
                  <span className="hidden min-w-0 overflow-hidden md:block">
                    <MarketSparkline item={item} compact />
                  </span>
                  <span className="flex min-w-0 flex-col items-end md:hidden">
                    <span className="font-mono text-xs tabular-nums text-white">
                      {formatValue(item, "price")}
                    </span>
                    <span
                      className={`mt-1 font-mono text-[10px] tabular-nums ${item.dataState !== "LIVE" ? "text-[var(--nexi-text-muted)]" : item.change !== null && item.change >= 0 ? "text-[var(--nexi-positive)]" : "text-[var(--nexi-negative)]"}`}
                    >
                      {formatValue(item, "change")}
                    </span>
                  </span>
                  <span className="col-span-2 flex min-w-0 items-center justify-between border-t border-white/[0.04] pt-1 md:hidden">
                    <span className="h-5 w-20 overflow-hidden">
                      <span className="block origin-top-left scale-[0.62]">
                        <MarketSparkline item={item} compact />
                      </span>
                    </span>
                    <span className="font-mono text-[9px] tabular-nums text-[var(--nexi-text-secondary)]">
                      <span className="mr-1 font-sans uppercase text-[var(--nexi-text-muted)]">
                        24h vol
                      </span>
                      {formatValue(item, "volume")}
                    </span>
                  </span>
                  <span className="hidden min-w-0 text-right font-mono text-sm tabular-nums text-white md:block">
                    {formatValue(item, "price")}
                  </span>
                  <span
                    className={`hidden min-w-0 text-right font-mono text-sm tabular-nums md:block ${item.dataState !== "LIVE" ? "text-[var(--nexi-text-muted)]" : item.change !== null && item.change >= 0 ? "text-[var(--nexi-positive)]" : "text-[var(--nexi-negative)]"}`}
                  >
                    {formatValue(item, "change")}
                  </span>
                  <span className="hidden min-w-0 text-right font-mono text-sm tabular-nums text-[var(--nexi-text-secondary)] md:block">
                    {formatValue(item, "volume")}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
