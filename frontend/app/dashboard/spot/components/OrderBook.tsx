'use client';

import React, { useState } from 'react';

export interface Order {
  price: number;
  amount: number;
  total?: number;
}

interface OrderBookProps {
  asks: Order[];
  bids: Order[];
  onPriceClick: (price: number) => void;
}

export default function OrderBook({ asks, bids, onPriceClick }: OrderBookProps) {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');

  // Asks (Sell Orders)
  const displayAsks = [...asks].slice(0, 10).reverse();
  const maxAskAmt = Math.max(...displayAsks.map(o => o.amount), 1);

  // Bids (Buy Orders)
  const displayBids = bids.slice(0, 10);
  const maxBidAmt = Math.max(...displayBids.map(o => o.amount), 1);

  const lastPrice = displayBids.length > 0 ? displayBids[0].price : (displayAsks.length > 0 ? displayAsks[displayAsks.length - 1].price : 45000);

  return (
    <div className="flex flex-col h-full text-xs bg-gray-900">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-2 font-bold ${activeTab === 'book' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Order Book
        </button>
        <button 
            onClick={() => setActiveTab('trades')}
            className={`flex-1 py-2 font-bold ${activeTab === 'trades' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Trades
        </button>
      </div>

      {activeTab === 'book' ? (
        <>
            <div className="flex justify-between text-gray-500 px-2 py-1 border-b border-gray-800">
                <span>Price</span>
                <span>Amount</span>
            </div>
            
            {/* Asks (Red) - Selling */}
            <div className="flex-1 flex flex-col justify-end overflow-y-auto scrollbar-hide">
                {displayAsks.map((ask, i) => (
                <div 
                    key={i} 
                    className="relative flex justify-between px-2 py-0.5 cursor-pointer hover:bg-gray-800 group"
                    onClick={() => onPriceClick(ask.price)}
                >
                    {/* Depth Visual */}
                    <div 
                        className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-transparent to-red-500/10 transition-all duration-300"
                        style={{ width: `${(ask.amount / maxAskAmt) * 100}%` }}
                    />
                    <span className="text-[#FF4D4F] font-medium relative z-10">{ask.price.toFixed(2)}</span>
                    <span className="text-gray-300 relative z-10">{ask.amount.toFixed(4)}</span>
                </div>
                ))}
            </div>

            <div className="border-y border-gray-800 my-1 py-1 text-center text-lg font-bold text-white bg-gray-800/50 shrink-0">
                {lastPrice.toFixed(2)}
            </div>

            {/* Bids (Green) - Buying */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {displayBids.map((bid, i) => (
                <div 
                    key={i} 
                    className="relative flex justify-between px-2 py-0.5 cursor-pointer hover:bg-gray-800 group"
                    onClick={() => onPriceClick(bid.price)}
                >
                    {/* Depth Visual */}
                    <div 
                        className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-transparent to-green-500/10 transition-all duration-300"
                        style={{ width: `${(bid.amount / maxBidAmt) * 100}%` }}
                    />
                    <span className="text-[#00C076] font-medium relative z-10">{bid.price.toFixed(2)}</span>
                    <span className="text-gray-300 relative z-10">{bid.amount.toFixed(4)}</span>
                </div>
                ))}
            </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
            <div className="flex justify-between text-gray-500 mb-2 text-[10px] uppercase">
                <span>Price</span>
                <span>Amount</span>
                <span>Time</span>
            </div>
            {/* Mock Trades */}
            {Array.from({length: 20}).map((_, i) => {
                const isBuy = Math.random() > 0.5;
                return (
                    <div key={i} className="flex justify-between py-1 border-b border-gray-800/50">
                        <span className={isBuy ? 'text-[#00C076]' : 'text-[#FF4D4F]'}>
                            {(lastPrice + (Math.random() - 0.5) * 100).toFixed(2)}
                        </span>
                        <span className="text-gray-300">{(Math.random() * 0.5).toFixed(4)}</span>
                        <span className="text-gray-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                    </div>
                )
            })}
        </div>
      )}
    </div>
  );
}
