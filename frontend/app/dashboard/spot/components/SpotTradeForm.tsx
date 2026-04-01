'use client';

import { useState, useEffect } from 'react';

interface SpotTradeFormProps {
  onBuy: (type: 'LIMIT' | 'MARKET', price: number, amount: number) => void;
  onSell: (type: 'LIMIT' | 'MARKET', price: number, amount: number) => void;
  currentPrice: number;
  selectedPrice?: number | null;
  symbol?: string;
}

export default function SpotTradeForm({ onBuy, onSell, currentPrice, selectedPrice, symbol, balance = 0 }: SpotTradeFormProps & { balance?: number }) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // Reset/Update price when symbol changes
  useEffect(() => {
    if (currentPrice) {
        setPrice(currentPrice.toString());
    }
  }, [symbol, currentPrice]);

  // Update when user clicks order book
  useEffect(() => {
    if (selectedPrice) {
        setPrice(selectedPrice.toString());
        setType('LIMIT');
    }
  }, [selectedPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(price);
    const a = Number.parseFloat(amount);
    
    if (isNaN(a) || a <= 0) return;
    if (type === 'LIMIT' && (isNaN(p) || p <= 0)) return;

    if (side === 'BUY') {
      onBuy(type, p, a);
    } else {
      onSell(type, p, a);
    }
  };

  const handlePercentageClick = (pct: number) => {
    if (!balance || balance <= 0) return;
    const p = Number.parseFloat(price) || currentPrice;
    
    // Simple mock logic: assuming balance is always in Quote currency (USDT) for BUY
    // and Base currency for SELL (though we are passing a single balance prop which is likely USDT)
    // For a real app, we need separate balances.
    
    if (side === 'BUY') {
        if (p > 0) {
            // Amount = (Balance * %) / Price
            const maxBuy = (balance * (pct / 100)) / p;
            setAmount(maxBuy.toFixed(4));
        }
    } else {
        // For Sell, we usually use the Base asset balance. 
        // Since we mocked 'balance' as 10000 USDT in the parent, let's just pretend we have 1 BTC for selling
        // so the slider works visually.
        const mockBaseBalance = 1.0; 
        const amt = mockBaseBalance * (pct / 100);
        setAmount(amt.toFixed(4));
    }
  };

  return (
    <div className="p-4 bg-gray-900 h-full flex flex-col">
      {/* Big Price Display */}
      <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold font-mono ${currentPrice >= (Number.parseFloat(price) || 0) ? 'text-[#00C076]' : 'text-[#FF4D4F]'}`}>
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-4">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded-md font-bold transition-colors ${
            side === 'BUY' ? 'bg-[#00C076] text-gray-900' : 'text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded-md font-bold transition-colors ${
            side === 'SELL' ? 'bg-[#FF4D4F] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-4 mb-4 text-sm border-b border-gray-800 pb-2">
        <button
          onClick={() => setType('LIMIT')}
          className={`${type === 'LIMIT' ? 'text-white font-bold border-b-2 border-[#00C076]' : 'text-gray-400'}`}
        >
          Limit
        </button>
        <button
          onClick={() => setType('MARKET')}
          className={`${type === 'MARKET' ? 'text-white font-bold border-b-2 border-[#00C076]' : 'text-gray-400'}`}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {type === 'LIMIT' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Price (USDT)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none font-mono"
              placeholder="0.00"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 block mb-1">Amount (BTC)</label>
          <input
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none font-mono"
            placeholder="0.0000"
          />
        </div>

        {/* Balance */}
        <div className="flex justify-end text-[10px] text-gray-400 mb-2">
            <span>Avbl: <span className="text-white font-mono">{(balance || 0).toFixed(2)} USDT</span></span>
        </div>

        {/* Percentage Slider */}
        <div className="mb-4">
            <input 
                type="range" 
                min="0" 
                max="100" 
                step="1"
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                onChange={(e) => handlePercentageClick(parseInt(e.target.value))}
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                <span className="cursor-pointer hover:text-white" onClick={() => handlePercentageClick(0)}>0%</span>
                <span className="cursor-pointer hover:text-white" onClick={() => handlePercentageClick(25)}>25%</span>
                <span className="cursor-pointer hover:text-white" onClick={() => handlePercentageClick(50)}>50%</span>
                <span className="cursor-pointer hover:text-white" onClick={() => handlePercentageClick(75)}>75%</span>
                <span className="cursor-pointer hover:text-white" onClick={() => handlePercentageClick(100)}>100%</span>
            </div>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded-lg font-bold text-lg mt-auto shadow-lg ${
            side === 'BUY' 
                ? 'bg-[#00C076] text-gray-900 shadow-[#00C076]/20' 
                : 'bg-[#FF4D4F] text-white shadow-[#FF4D4F]/20'
          }`}
        >
          {side === 'BUY' ? 'Buy BTC' : 'Sell BTC'}
        </button>
      </form>
    </div>
  );
}
