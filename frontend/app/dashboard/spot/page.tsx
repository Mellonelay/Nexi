'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import SymbolSelector from '../../components/SymbolSelector';
import { useMarketData } from '../../hooks/useMarketData';

const TradingChart = dynamic(() => import('../../components/TradingChart'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#0a0e27] animate-pulse" />
});

// Mock Order Book Data Generator
const generateOrderBook = (basePrice: number) => {
    const bids = Array.from({ length: 15 }, (_, i) => ({
        price: basePrice - (i * 5) - Math.random() * 2,
        amount: Math.random() * 1.5 + 0.1,
        total: 0
    }));
    const asks = Array.from({ length: 15 }, (_, i) => ({
        price: basePrice + (i * 5) + Math.random() * 2,
        amount: Math.random() * 1.5 + 0.1,
        total: 0
    }));
    return { bids, asks };
};

export default function SpotPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    
    const { marketPairs } = useMarketData();
    const [price, setPrice] = useState(89750.00);
    const [orderBook, setOrderBook] = useState({ bids: [] as any[], asks: [] as any[] });
    const [tradeSide, setTradeSide] = useState<'BUY' | 'SELL'>('BUY');
    const [limitPrice, setLimitPrice] = useState('89750.00');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState(12450.00); // Mock Balance

    // TP/SL State
    const [isTpSlEnabled, setIsTpSlEnabled] = useState(false);
    const [tp, setTp] = useState('');
    const [sl, setSl] = useState('');

    // Socket & Data Effect
    useEffect(() => {
        // Initial Mock Data
        const { bids, asks } = generateOrderBook(price);
        setOrderBook({ bids, asks });

        // Update price from market data
        const current = marketPairs.find((c: any) => c.symbol === symbol || c.displaySymbol === symbol);
        if (current && current.price > 0) {
            setPrice(current.price);
            setLimitPrice(current.price.toFixed(2));
        }

        // Simulate Live Data
        const interval = setInterval(() => {
            const change = (Math.random() - 0.5) * 10;
            // Only update mock price if we don't have real data yet
            if (!current) {
                setPrice(p => p + change);
            } else {
                // If we have real data, maybe fluctuate slightly around it or wait for next fetch
                // Ideally, useMarketData updates 'crypto' and this effect re-runs.
                // But let's keep local fluctuation for visual liveness if data fetch is slow
                // setPrice(current.price); 
            }
            
            setOrderBook(prev => {
                const newBids = prev.bids.map(b => ({ ...b, amount: Math.random() > 0.7 ? Math.random() * 2 : b.amount }));
                const newAsks = prev.asks.map(a => ({ ...a, amount: Math.random() > 0.7 ? Math.random() * 2 : a.amount }));
                return { bids: newBids, asks: newAsks };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [marketPairs, symbol]); // Add dependencies

    // Max Volume for Depth Bars
    const maxVolume = useMemo(() => {
        const maxBid = Math.max(...orderBook.bids.map(b => b.amount), 0);
        const maxAsk = Math.max(...orderBook.asks.map(a => a.amount), 0);
        return Math.max(maxBid, maxAsk);
    }, [orderBook]);

    const handlePercentage = (pct: number) => {
        // Calculate amount based on balance and price
        if (!limitPrice || Number.parseFloat(limitPrice) === 0) return;
        const p = Number.parseFloat(limitPrice);
        
        if (tradeSide === 'BUY') {
            // Balance is in USDT
            const maxBuy = balance / p;
            setAmount((maxBuy * pct).toFixed(6));
        } else {
            // Balance would be in BTC (mocking 0.5 BTC for sell side)
            const btcBalance = 0.5; 
            setAmount((btcBalance * pct).toFixed(6));
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0a0e27] text-white font-sans">
            
            {/* TOP AREA (30%) - Chart */}
            <div className="h-[30%] border-b border-gray-800 relative bg-[#060918]">
                {/* Header Overlay */}
                <div className="absolute top-2 left-4 z-10 flex items-center gap-3 bg-[#121836]/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 shadow-lg">
                    <SymbolSelector 
                        currentSymbol={symbol} 
                        onSelect={(s) => router.push(`/dashboard/spot?symbol=${s}`)} 
                    />
                    <div className="h-6 w-px bg-white/10 mx-1" />
                    <span className={clsx("font-mono text-sm font-bold", price >= 45000 ? "text-[#00C076]" : "text-[#FF4D4F]")}>
                        {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <TradingChart symbol={symbol} type="spot" />
            </div>

            {/* MIDDLE AREA (40%) - Order Book */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0e27]">
                {/* Order Book Header - Side by Side */}
                <div className="grid grid-cols-2 gap-1 px-2 py-2 text-[10px] text-gray-500 border-b border-gray-800 bg-[#121836]">
                    <div className="flex justify-between px-2">
                        <span>Bid (Amount)</span>
                        <span>Price</span>
                    </div>
                    <div className="flex justify-between px-2">
                        <span>Price</span>
                        <span>Ask (Amount)</span>
                    </div>
                </div>
                
                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="grid grid-cols-2 h-full">
                        {/* Left Column: Bids (Green) */}
                        <div className="border-r border-gray-800/50">
                            {orderBook.bids.slice(0, 15).map((bid, i) => (
                                <div key={`bid-${i}`} className="flex justify-between items-center px-3 py-1 relative group cursor-pointer hover:bg-[#00C076]/5">
                                    {/* Depth Bar (Right Aligned for Left Col) */}
                                    <div 
                                        className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-[#00C076]/10 to-transparent transition-all duration-300 pointer-events-none"
                                        style={{ width: `${(bid.amount / maxVolume) * 100}%` }}
                                    />
                                    <span className="text-gray-300 text-xs font-mono relative z-10">{bid.amount.toFixed(4)}</span>
                                    <span className="text-[#00C076] text-xs font-mono relative z-10">{bid.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Right Column: Asks (Red) */}
                        <div>
                            {orderBook.asks.slice(0, 15).map((ask, i) => (
                                <div key={`ask-${i}`} className="flex justify-between items-center px-3 py-1 relative group cursor-pointer hover:bg-[#FF4D4F]/5">
                                    {/* Depth Bar (Left Aligned for Right Col) */}
                                    <div 
                                        className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#FF4D4F]/10 to-transparent transition-all duration-300 pointer-events-none"
                                        style={{ width: `${(ask.amount / maxVolume) * 100}%` }}
                                    />
                                    <span className="text-[#FF4D4F] text-xs font-mono relative z-10">{ask.price.toFixed(2)}</span>
                                    <span className="text-gray-300 text-xs font-mono relative z-10">{ask.amount.toFixed(4)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Current Price Footer (Sticky at bottom of Order Book) */}
                <div className="py-2 bg-[#121836] border-t border-gray-800 flex justify-center items-center z-20 shadow-lg">
                    <span className={clsx("text-lg font-bold font-mono", price >= 45000 ? "text-[#00C076]" : "text-[#FF4D4F]")}>
                        {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">≈ ${(price * 1).toLocaleString()}</span>
                </div>
            </div>

            {/* BOTTOM AREA (30%) - Trade Form */}
            <div className="h-[30%] bg-[#121836] border-t border-gray-800 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-20">
                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button 
                        type="button"
                        onClick={() => setTradeSide('BUY')}
                        className={clsx(
                            "flex-1 py-3 font-bold text-sm transition-all relative overflow-hidden",
                            tradeSide === 'BUY' ? "text-[#00C076] bg-[#00C076]/10" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Buy BTC
                        {tradeSide === 'BUY' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C076]" />}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setTradeSide('SELL')}
                        className={clsx(
                            "flex-1 py-3 font-bold text-sm transition-all relative overflow-hidden",
                            tradeSide === 'SELL' ? "text-[#FF4D4F] bg-[#FF4D4F]/10" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Sell BTC
                        {tradeSide === 'SELL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4D4F]" />}
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
                    {/* Inputs */}
                    <div className="space-y-3">
                        {/* Limit Price */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Price</span>
                            <input 
                                type="number" 
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                className="w-full bg-[#0a0e27] border border-gray-700 rounded-lg py-2.5 pl-12 pr-12 text-right font-mono text-white focus:border-blue-500 outline-none transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">USDT</span>
                            
                            <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden">
                                <button type="button" className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"><Plus size={10} /></button>
                                <button type="button" className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"><Minus size={10} /></button>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Amount</span>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#0a0e27] border border-gray-700 rounded-lg py-2.5 pl-14 pr-12 text-right font-mono text-white focus:border-blue-500 outline-none transition-colors"
                                placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">BTC</span>
                        </div>

                        {/* Percentage Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                            <div className="flex gap-2">
                                {[25, 50, 75, 100].map((pct) => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => handlePercentage(pct / 100)}
                                        className="flex-1 bg-[#0a0e27] border border-gray-700 rounded py-1 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TP/SL Toggle */}
                        <div className="flex items-center gap-2 mt-2">
                            <div 
                                className={clsx(
                                    "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                    isTpSlEnabled ? "bg-blue-500 border-blue-500" : "border-gray-500 bg-transparent"
                                )}
                                onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}
                            >
                                {isTpSlEnabled && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <span 
                                className="text-xs text-gray-400 cursor-pointer select-none"
                                onClick={() => setIsTpSlEnabled(!isTpSlEnabled)}
                            >
                                TP/SL
                            </span>
                        </div>

                        {/* TP/SL Inputs */}
                        {isTpSlEnabled && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">TP</span>
                                    <input 
                                        type="number" 
                                        value={tp}
                                        onChange={(e) => setTp(e.target.value)}
                                        className="w-full bg-[#0a0e27] border border-gray-700 rounded py-2 pl-7 pr-2 text-right font-mono text-xs text-white focus:border-[#00C076] outline-none"
                                        placeholder="Take Profit"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">SL</span>
                                    <input 
                                        type="number" 
                                        value={sl}
                                        onChange={(e) => setSl(e.target.value)}
                                        className="w-full bg-[#0a0e27] border border-gray-700 rounded py-2 pl-7 pr-2 text-right font-mono text-xs text-white focus:border-[#FF4D4F] outline-none"
                                        placeholder="Stop Loss"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Info & Action */}
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-3">
                            <span>Avbl</span>
                            <span className="text-white font-mono">
                                {tradeSide === 'BUY' ? `${balance.toLocaleString()} USDT` : '0.5000 BTC'}
                            </span>
                        </div>

                        <button 
                            type="button"
                            className={clsx(
                                "w-full py-3 rounded-lg font-bold text-white shadow-lg active:scale-[0.98] transition-all",
                                tradeSide === 'BUY' 
                                    ? "bg-[#00C076] hover:bg-[#00C076]/90 shadow-[0_4px_12px_rgba(0,192,118,0.3)]" 
                                    : "bg-[#FF4D4F] hover:bg-[#FF4D4F]/90 shadow-[0_4px_12px_rgba(255,77,79,0.3)]"
                            )}
                        >
                            {tradeSide === 'BUY' ? 'Buy BTC' : 'Sell BTC'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
