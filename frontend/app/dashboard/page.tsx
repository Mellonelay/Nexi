'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MarketPair, useMarketData } from '../hooks/useMarketData';
import { useRouter } from 'next/navigation';

const TradingChart = dynamic(() => import('../components/TradingChart'), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Quotes');
  const [subTab, setSubTab] = useState<'Crypto' | 'Metal' | 'Shares' | 'Forex'>('Crypto');
  const [walletConnected, setWalletConnected] = useState(false);
  
  const { marketPairs, metal, shares, forex, loading } = useMarketData();

  const getActiveData = () => {
    switch(subTab) {
        case 'Crypto': return marketPairs; // Default to marketPairs;
        case 'Metal': return metal;
        case 'Shares': return shares;
        case 'Forex': return forex;
        default: return marketPairs;
    }
  };

  const activeData = getActiveData();

  const handleRowClick = (symbol: string) => {
    // Navigate to Spot Trading with the selected symbol
    router.push(`/dashboard/spot?symbol=${symbol}`);
  };

  return (
    <div className="min-h-screen bg-dexi-dark text-white">
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen">
        {/* Left Sidebar - Hidden on mobile, controlled by Layout */}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="h-16 bg-dexi-darker border-b border-dexi-purple/20 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold gradient-text">NEXI</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setWalletConnected(!walletConnected)}
                className={`px-4 py-2 text-sm md:text-base rounded-lg font-semibold transition-all ${
                  walletConnected
                    ? 'bg-dexi-green text-white'
                    : 'bg-gradient-dexi text-white hover:shadow-neon-blue'
                }`}
              >
                {walletConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Tab Navigation - Mobile Friendly */}
          <div className="flex overflow-x-auto border-b border-dexi-purple/20 bg-dexi-darker scrollbar-hide">
            {['Favorites', 'Quotes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-dexi-cyan border-b-2 border-dexi-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-black">
            {/* Active Tab Content */}
            {activeTab === 'Quotes' && (
              <div>
                {/* Sub Tabs */}
                <div className="flex gap-6 px-4 py-3 border-b border-white/10 text-sm font-bold bg-black overflow-x-auto scrollbar-hide">
                    {['Crypto', 'Metal', 'Shares', 'Forex'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setSubTab(tab as any)}
                            className={`${subTab === tab ? 'text-white border-b-2 border-white pb-1' : 'text-gray-500'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Column Headers */}
                <div className="flex justify-between px-4 py-2 text-xs text-gray-500 bg-black">
                    <span className="flex-[1.5]">Trading Pair</span>
                    <span className="flex-1 text-right">Latest Price</span>
                    <span className="flex-1 text-right">Today change</span>
                </div>

                {/* List */}
                <div className="flex flex-col">
                  {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                  ) : (
                    activeData.map((item: MarketPair) => (
                      <div
                        key={item.symbol}
                        onClick={() => handleRowClick(item.symbol)}
                        className="flex items-center justify-between px-4 py-4 border-b border-white/5 bg-black cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        {/* Left: Symbol & Vol */}
                        <div className="flex-[1.5] flex items-center gap-3">
                          {item.icon && (item.icon.startsWith('http') ? (
                              <img src={item.icon} alt={item.symbol} className="w-8 h-8 rounded-full" />
                          ) : (
                              <span className="text-2xl">{item.icon}</span>
                          ))}
                          <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-bold text-white">{item.displaySymbol}</span>
                                {subTab === 'Crypto' && <span className="text-xs text-gray-500">/USDT</span>}
                            </div>
                            <div className="text-[10px] text-gray-500">24H: {(item.vol || 0).toFixed(2)}</div>
                          </div>
                        </div>

                        {/* Middle: Price */}
                        <div className="flex-1 text-right">
                            <span className={`text-base font-bold ${item.change >= 0 ? 'text-[#25a750]' : 'text-[#ca3f64]'}`}>
                                {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Right: Change Button */}
                        <div className="flex-1 flex justify-end">
                            <div className={`w-20 py-1.5 rounded text-center text-xs font-bold text-white ${
                                item.change >= 0 ? 'bg-[#25a750]' : 'bg-[#ca3f64]'
                            }`}>
                                {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
                            </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile, visible on large screens */}
        <div className="hidden lg:flex w-80 bg-dexi-darker border-l border-dexi-purple/20 flex-col">
          <div className="p-4 border-b border-dexi-purple/20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Account</span>
              <button className="text-dexi-cyan hover:text-dexi-blue transition-colors">
                ▼
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="card-dark p-6 mb-4">
              <div className="text-center mb-4">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-lg font-bold mb-2">Fund your wallet</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Get your wallet ready to use web3
                </p>
                <button className="w-full px-4 py-3 bg-white text-dexi-dark font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                  Add funds
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Actions */}
              <button className="card-dark p-4 text-center hover:border-dexi-blue/50 transition-all">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-semibold">Buy</div>
              </button>
              <button className="card-dark p-4 text-center hover:border-dexi-purple/50 transition-all">
                <div className="text-2xl mb-2">🔄</div>
                <div className="text-sm font-semibold">Swap</div>
              </button>
              <button className="card-dark p-4 text-center hover:border-dexi-cyan/50 transition-all">
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm font-semibold">Send</div>
              </button>
              <button className="card-dark p-4 text-center hover:border-dexi-green/50 transition-all">
                <div className="text-2xl mb-2">📥</div>
                <div className="text-sm font-semibold">Receive</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
