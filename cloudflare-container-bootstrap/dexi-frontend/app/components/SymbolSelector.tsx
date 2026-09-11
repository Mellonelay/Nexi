'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMarketData, MarketPair } from '../hooks/useMarketData';
import AssetIcon from './AssetIcon';
import { findAsset, type AssetCategory } from '../lib/asset-registry';

interface SymbolSelectorProps {
  readonly currentSymbol: string;
  readonly onSelect: (symbol: string) => void;
  readonly cryptoOnly?: boolean;
}

export default function SymbolSelector({ currentSymbol, onSelect, cryptoOnly = false }: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AssetCategory>('Crypto');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { marketPairs, metal, shares, forex, loading, error } = useMarketData();
  const normalizedCurrent = currentSymbol.replaceAll('/', '').toUpperCase();
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-w-0 items-center gap-2 text-lg font-bold transition-colors hover:text-gray-300"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {currentAsset && <AssetIcon item={{ assetId: currentAsset.id, symbol: currentAsset.symbol, displaySymbol: currentAsset.displaySymbol, name: currentAsset.name }} size="md" />}
        <span>
          {/* If it's a simple ticker like BTC, ETH, etc (no dots/slashes), append /USDT for display */}
          {/^[A-Z0-9]+$/.test(currentSymbol) && currentSymbol.length <= 5 ? `${currentSymbol}/USDT` : currentSymbol}
        </span>
        <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute left-0 top-full z-[100] mt-2 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-lg border border-white/10 bg-[#121836] shadow-xl">
          {/* Tabs */}
          {!cryptoOnly && (
            <div className="grid grid-cols-4 border-b border-white/10" role="tablist" aria-label="Asset categories">
              {(['Crypto', 'Stocks', 'Metals', 'Forex'] as AssetCategory[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`min-w-0 py-2 text-[10px] font-bold transition-colors ${activeTab === tab
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
          <div className="max-h-[min(55vh,360px)] overflow-y-auto overscroll-contain" role="listbox">
            {loading ? <p className="p-4 text-sm text-[#8C8299]" role="status">Loading approved instruments</p> : error ? <p className="p-4 text-sm text-[#8C8299]" role="status">Market data unavailable</p> : options.length === 0 ? <p className="p-4 text-sm text-[#8C8299]" role="status">No approved instruments available</p> : options.map((item: MarketPair) => {
              const hasPrice = item.price !== null && Number.isFinite(item.price);
              return (
                <button
                  key={item.symbol}
                  type="button"
                  role="option"
                  aria-selected={normalizedCurrent === item.symbol.replaceAll('/', '').toUpperCase()}
                  onClick={() => {
                    onSelect(item.symbol);
                    setIsOpen(false);
                  }}
                  className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetIcon item={item} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">
                        {activeTab === 'Crypto' ? `${item.displaySymbol}/USDT` : item.displaySymbol}
                      </div>
                      <div className="truncate text-[10px] text-gray-500">{item.name}</div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2 text-right">
                    <span className="block text-xs font-semibold text-white">{hasPrice ? item.price!.toLocaleString() : 'Unavailable'}</span>
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
