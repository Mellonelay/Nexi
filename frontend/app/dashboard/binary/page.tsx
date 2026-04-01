'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../lib/api';
import TradingChart from '../../components/TradingChart';
import io from 'socket.io-client';
import { ArrowUp, ArrowDown, Wallet } from 'lucide-react';
import SymbolSelector from '../../components/SymbolSelector';
import TimeframeSelector from '../../components/TimeframeSelector';
import { useMarketData } from '../../hooks/useMarketData';
import { useSearchParams } from 'next/navigation';

export default function BinaryPage() {
    const searchParams = useSearchParams();
    const initialSymbol = searchParams.get('symbol') || 'BTCUSDT';

    const [interval, setInterval] = useState('1m');
    const [duration, setDuration] = useState(60);
    const [amount, setAmount] = useState('');
    const [stopProfit, setStopProfit] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [pair, setPair] = useState(initialSymbol);
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'trade' | 'entrust' | 'history'>('trade');
    const [activePositions, setActivePositions] = useState<any[]>([]);

    const { marketPairs, metal, shares, forex, timeframes } = useMarketData();

    const currentMarketData = useMemo(() => {
        const all = [...marketPairs, ...metal, ...shares, ...forex];
        return all.find(i => i.symbol === pair) || all.find(i => i.symbol === 'BTCUSDT') || {
            price: 0,
            change: 0,
            vol: 0,
            displaySymbol: pair,
            icon: '🪙'
        };
    }, [pair, marketPairs, metal, shares, forex]);

    const currentPrice = currentMarketData.price;

    const socketRef = useRef<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
        socketRef.current = socket;

        socket.on('binary_position_opened', (position) => {
            setActivePositions(prev => [...prev, position]);
        });

        socket.on('binary_position_closed', (data) => {
            // alert(`Position Closed: ${data.status} | Profit: ${data.profit}`);
            setActivePositions(prev => prev.filter(p => p.id !== data.id));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const openPosition = async (side: 'CALL' | 'PUT') => {
        if (!user) return alert('Please login');
        if (!amount) return alert('Please enter amount');

        try {
            await api.post('/binary/position', {
                userId: user.id,
                pair,
                amount: Number.parseFloat(amount),
                side,
                duration
            });
            alert('Position Opened!');
            setAmount('');
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to open position');
        }
    };

    const timeOptions = useMemo(() => {
        if (timeframes && timeframes.length > 0) {
            return timeframes.map(t => ({
                sec: t.seconds,
                profit: `${(Number.parseFloat(t.profit) * 100).toFixed(0)}%`,
                rawProfit: Number.parseFloat(t.profit)
            }));
        }
        return [
            { sec: 30, profit: '60%', rawProfit: 0.6 },
            { sec: 60, profit: '75%', rawProfit: 0.75 },
            { sec: 180, profit: '85%', rawProfit: 0.85 },
            { sec: 300, profit: '100%', rawProfit: 1.0 }
        ];
    }, [timeframes]);

    // Set default duration once loaded
    useEffect(() => {
        if (timeOptions.length > 0 && !timeOptions.some(t => t.sec === duration)) {
            setDuration(timeOptions[0].sec);
        }
    }, [timeOptions, duration]);

    const currentProfitRate = useMemo(() => {
        const opt = timeOptions.find(t => t.sec === duration);
        return opt ? opt.rawProfit : 0;
    }, [duration, timeOptions]);

    return (
        <div className="flex flex-col h-screen bg-[#0a0e27] text-white pb-[80px] overflow-hidden">
            {/* Header */}
            <header className="px-4 py-3 flex justify-between items-center bg-[#121836] border-b border-white/5 z-10 shrink-0">
                <div className="flex items-center gap-2 cursor-pointer z-20">
                    <SymbolSelector
                        currentSymbol={currentMarketData.displaySymbol}
                        onSelect={(s) => setPair(s)}
                    />
                </div>
                <div className="flex gap-4 text-[10px] text-gray-400">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500">Price</span>
                        <span className={`font-mono text-base ${currentMarketData.change >= 0 ? 'text-[#00C076]' : 'text-[#FF4D4F]'}`}>
                            {currentPrice.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500">Vol</span>
                        <span className="text-white font-mono">{currentMarketData.vol ? currentMarketData.vol.toFixed(2) : '---'}</span>
                    </div>
                </div>
            </header>

            {/* Timeframe Bar */}
            <div className="px-4 py-2 border-b border-white/5 bg-[#0a0e27]">
                <TimeframeSelector interval={interval} onChange={setInterval} />
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative w-full bg-[#0a0e27]">
                <TradingChart symbol={pair} type="binary" interval={interval} />
            </div>

            {/* Trading Interface (Bottom Half) */}
            <div className="bg-[#121836] border-t border-white/5 shrink-0">
                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {['Trade', 'Current Entrust', 'History'].map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0] as any)}
                            className={`flex-1 py-3 text-sm font-medium relative ${activeTab === tab.toLowerCase().split(' ')[0]
                                ? 'text-[#00C076]'
                                : 'text-gray-400'
                                }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase().split(' ')[0] && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#00C076]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'trade' && (
                    <div className="p-4 space-y-4">
                        {/* Time Selection */}
                        <div className="grid grid-cols-5 gap-2">
                            {/* Ensure we always have 5 items by filling with dummies if needed */}
                            {[...timeOptions, ...new Array(Math.max(0, 5 - timeOptions.length)).fill(null)].slice(0, 5).map((opt, i) => {
                                if (!opt) {
                                    // Render Disabled/Empty Placeholder
                                    return (
                                        <div key={`empty-${i}`} className="flex flex-col items-center justify-center py-2 rounded border bg-[#0a0e27] border-white/5 opacity-50 cursor-not-allowed">
                                            <span className="text-xs font-bold text-gray-500">--</span>
                                            <span className="text-[10px] text-gray-600">--%</span>
                                        </div>
                                    )
                                }
                                return (
                                    <button
                                        key={opt.sec}
                                        type="button"
                                        onClick={() => setDuration(opt.sec)}
                                        className={`flex flex-col items-center justify-center py-2 rounded border transition-all ${duration === opt.sec
                                            ? 'bg-[#00C076]/10 border-[#00C076] shadow-[0_0_10px_rgba(0,192,118,0.2)]'
                                            : 'bg-[#0a0e27] border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <span className={`text-xs font-bold ${duration === opt.sec ? 'text-white' : 'text-gray-300'}`}>{opt.sec}s</span>
                                        <span className="text-[10px] text-[#00C076]">{opt.profit}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Amount Input */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-xs text-gray-400">Qty</span>
                                </div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-[#0a0e27] border border-white/10 rounded-lg py-3 pl-10 pr-16 text-white outline-none focus:border-[#00C076] font-mono text-sm"
                                    placeholder="Enter amount"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 px-3 text-xs font-bold text-[#00C076] hover:text-[#00a062]"
                                    onClick={() => {/* Set max balance logic */ }}
                                >
                                    All
                                </button>
                            </div>
                        </div>

                        {/* Balance & Info */}
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <Wallet size={12} />
                                <span>Available:</span>
                                <span className="text-white font-mono">10,000.00 USDT</span>
                            </div>
                            <div>
                                <span>Profit: </span>
                                <span className="text-[#00C076] font-bold">
                                    {amount ? `+${(Number.parseFloat(amount) * currentProfitRate).toFixed(2)}` : '0.00'}
                                </span>
                            </div>
                        </div>

                        {/* Trade Buttons - Moved here */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => openPosition('CALL')}
                                className="flex-1 bg-[#00C076] hover:bg-[#00a062] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <span>Buy Long</span>
                                <ArrowUp size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => openPosition('PUT')}
                                className="flex-1 bg-[#FF4D4F] hover:bg-[#d93638] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                            >
                                <span>Buy Short</span>
                                <ArrowDown size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
