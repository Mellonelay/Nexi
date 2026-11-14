'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMarketData, MarketPair } from '../hooks/useMarketData';
import AssetIcon from './AssetIcon';
import { findAsset, type AssetCategory } from '../lib/asset-registry';
import { normalizePair } from '../state/active-instrument';

interface SymbolSelectorProps {
  readonly currentSymbol: string;
  readonly onSelect: (symbol: string) => void;
  readonly cryptoOnly?: boolean;
  readonly compact?: boolean;
}

export default function SymbolSelector({ currentSymbol, onSelect, cryptoOnly = false, compact = false }: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuGeometry, setMenuGeometry] = useState({ top: 72, left: 12, width: 296, maxHeight: 320 });
  const [activeTab, setActiveTab] = useState<AssetCategory>('Crypto');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { marketPairs, metal, shares, forex, loading, error } = useMarketData();
  const normalizedCurrent = normalizePair(currentSymbol);
  const currentAsset = findAsset(currentSymbol);

  useEffect(() => {
    const asset = findAsset(currentSymbol);
    if (!cryptoOnly && asset) setActiveTab(asset.category);
  }, [cryptoOnly, currentSymbol]);

  const getList = (): MarketPair[] => {
    if (cryptoOnly) return marketPairs;
    switch (activeTab) {
      case 'Crypto': return marketPairs;
      case 'Metals': return metal;
      case 'Stocks': return shares;
      case 'Forex': return forex;
      default: return marketPairs;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const positionMenu = () => {
      const viewport = window.visualViewport;
      const visibleTop = (viewport?.offsetTop ?? 0) + 8;
      const visibleBottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 8;
      const visibleLeft = (viewport?.offsetLeft ?? 0) + 12;
      const visibleRight = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 12;
      const anchor = dropdownRef.current?.getBoundingClientRect();
      if (!anchor) return;

      const below = Math.max(0, visibleBottom - anchor.bottom - 8);
      const above = Math.max(0, anchor.top - visibleTop - 8);
      const placeAbove = below < 180 && above > below;
      const maxHeight = Math.min(360, Math.max(0, placeAbove ? above : below));
      const proposedTop = placeAbove ? anchor.top - maxHeight - 8 : anchor.bottom + 8;
      const width = Math.min(320, Math.max(0, visibleRight - visibleLeft));
      setMenuGeometry({
        top: Math.max(visibleTop, Math.min(proposedTop, visibleBottom - maxHeight)),
        left: Math.max(visibleLeft, Math.min(anchor.left, visibleRight - width)),
        width,
        maxHeight,
      });
    };

    const handlePageScroll = (event: Event) => {
      if (event.target instanceof Node && dropdownRef.current?.contains(event.target)) return;
      positionMenu();
    };
    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', handlePageScroll, true);
    window.visualViewport?.addEventListener('resize', positionMenu);
    window.visualViewport?.addEventListener('scroll', positionMenu);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', handlePageScroll, true);
      window.visualViewport?.removeEventListener('resize', positionMenu);
      window.visualViewport?.removeEventListener('scroll', positionMenu);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = getList();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`nexi-interactive nexi-symbol-selector-trigger flex min-h-[44px] min-w-0 max-w-full items-center gap-2 ${compact ? "text-base sm:text-lg" : "text-lg"} font-bold transition-colors hover:text-gray-300`}
        aria-controls="nexi-symbol-picker"
        aria-expanded={isOpen}
      >
        {currentAsset && <AssetIcon item={{ assetId: currentAsset.id, symbol: currentAsset.symbol, displaySymbol: currentAsset.displaySymbol, name: currentAsset.name }} size={compact ? "sm" : "md"} />}
        <span className="min-w-0 whitespace-normal break-words text-left leading-tight">
          {currentAsset?.pair ?? currentSymbol}
        </span>
        <ChevronDown size={compact ? 18 : 20} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div onKeyDown={(event) => { if (event.key === 'Escape') { setIsOpen(false); dropdownRef.current?.querySelector('button')?.focus(); } }} id="nexi-symbol-picker" role="group" aria-label="Choose an instrument" className="fixed z-[100] flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#100A18] shadow-xl" style={{ top: menuGeometry.top, left: menuGeometry.left, width: menuGeometry.width, maxHeight: menuGeometry.maxHeight }}>
          {/* Tabs */}
          {!cryptoOnly && (
            <div className="grid shrink-0 grid-cols-4 border-b border-white/10" role="tablist" aria-label="Asset categories">
              {(['Crypto', 'Stocks', 'Metals', 'Forex'] as AssetCategory[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`min-h-[44px] min-w-0 px-1 py-2 text-xs font-semibold transition-colors ${activeTab === tab
                      ? 'border-b-2 border-[#7353DD] bg-white/5 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" role="group" aria-label="Available instruments">
            {(loading || error) && <p className="p-4 text-sm text-[#8C8299]" role="status">{loading ? 'Loading prices…' : 'Prices unavailable. You can still explore instruments.'}</p>}
            {options.map((item: MarketPair) => {
              const hasPrice = item.dataState === 'LIVE' && item.source !== 'fallback' && item.price !== null && Number.isFinite(item.price);
              return (
                <button
                  key={item.symbol}
                  type="button"
                  aria-pressed={normalizedCurrent === normalizePair(item.symbol)}
                  onClick={() => {
                    onSelect(item.symbol);
                    setIsOpen(false);
                  }}
                  className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetIcon item={item} />
                    <div className="min-w-0">
                      <div className="break-words text-sm font-bold text-white">
                        {item.pair}
                      </div>
                      <div className="break-words text-xs leading-4 text-gray-400">{item.name}</div>
                    </div>
                  </div>
                  <div className="min-w-0 max-w-[46%] pl-2 text-right">
                    <span className="block min-w-0 break-words font-mono text-sm font-semibold tabular-nums text-white">{hasPrice ? item.price!.toLocaleString() : 'Unavailable'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
