'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMarketData, MarketPair } from '../hooks/useMarketData';

interface SymbolSelectorProps {
  readonly currentSymbol: string;
  readonly onSelect: (symbol: string) => void;
}

export default function SymbolSelector({ currentSymbol, onSelect }: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Crypto' | 'Metal' | 'Shares' | 'Forex'>('Crypto');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { marketPairs, metal, shares, forex } = useMarketData();

  const getList = (): MarketPair[] => {
    switch (activeTab) {
      case 'Crypto': return marketPairs;
      case 'Metal': return metal;
      case 'Shares': return shares;
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xl font-bold hover:text-gray-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>
          {/* If it's a simple ticker like BTC, ETH, etc (no dots/slashes), append /USDT for display */}
          {/^[A-Z0-9]+$/.test(currentSymbol) && currentSymbol.length <= 5 ? `${currentSymbol}/USDT` : currentSymbol}
        </span>
        <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[320px] bg-[#121836] border border-white/10 rounded-lg shadow-xl z-[100] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10" role="tablist">
            {['Crypto', 'Metal', 'Shares', 'Forex'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === tab
                    ? 'text-white bg-white/5 border-b-2 border-[#00C076]'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto" role="listbox">
            {getList().map((item: MarketPair) => (
              <button
                key={item.symbol}
                type="button"
                role="option"
                aria-selected={currentSymbol === item.symbol}
                onClick={() => {
                  onSelect(item.symbol);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-white">
                      {activeTab === 'Crypto' ? `${item.displaySymbol}/USDT` : item.displaySymbol}
                    </div>
                    <div className="text-[10px] text-gray-500">{item.name}</div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${item.change >= 0 ? 'text-[#00C076]' : 'text-[#FF4D4F]'}`}>
                  {item.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
