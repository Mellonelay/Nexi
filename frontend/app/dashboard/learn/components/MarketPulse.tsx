'use client';
import { ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { useState } from 'react';

const news = [
    { id: 1, title: 'Bitcoin Hits $95k ATH', summary: 'Market sentiment reaches extreme greed as institutional inflows surge.', time: '2h ago', sentiment: 'Bullish' },
    { id: 2, title: 'Ethereum Gas Fees Drop', summary: 'L2 adoption drives mainnet costs to yearly lows.', time: '4h ago', sentiment: 'Neutral' },
    { id: 3, title: 'SEC Approves New ETF', summary: 'Major regulatory win for crypto markets.', time: '6h ago', sentiment: 'Bullish' },
];

export default function MarketPulse() {
    return (
        <div className="bg-[#121836] rounded-2xl border border-gray-800/50 p-6 h-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-[#00C076] rounded-full"></span>
                Market Pulse
            </h2>
            
            <div className="space-y-4">
                {news.map(item => (
                    <div key={item.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white">{item.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                item.sentiment === 'Bullish' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                                {item.sentiment}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.summary}</p>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={12} /> {item.time}
                            </span>
                            
                            <div className="flex gap-2">
                                <button className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-green-400 hover:bg-green-900/20 transition-colors">
                                    <ThumbsUp size={14} />
                                </button>
                                <button className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                                    <ThumbsDown size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
