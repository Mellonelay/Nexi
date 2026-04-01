'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCw, ChevronDown, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const accounts = ['Spot Wallet', 'Funding Wallet', 'Options Wallet', 'Earn Wallet'];

const assets = [
    { symbol: 'USDT', name: 'Tether', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
    { symbol: 'BTC', name: 'Bitcoin', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { symbol: 'SOL', name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
];

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
    const [amount, setAmount] = useState('');
    const [fromAccount, setFromAccount] = useState('Spot Wallet');
    const [toAccount, setToAccount] = useState('Options Wallet');
    const [selectedAsset, setSelectedAsset] = useState(assets[0]);
    const [isLocked, setIsLocked] = useState(false);

    // Smart Locking Logic
    useEffect(() => {
        const isRestricted = fromAccount.includes('Option') || fromAccount.includes('Earn') || 
                             toAccount.includes('Option') || toAccount.includes('Earn');
        
        if (isRestricted) {
            const usdt = assets.find(a => a.symbol === 'USDT');
            if (usdt) setSelectedAsset(usdt);
            setIsLocked(true);
        } else {
            setIsLocked(false);
        }
    }, [fromAccount, toAccount]);

    const handleSwap = () => {
        setFromAccount(toAccount);
        setToAccount(fromAccount);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className={twMerge(
                        "relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden",
                        "bg-[#121836] border-gray-700/50"
                    )}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0a0e27]/50">
                        <h2 className="text-xl font-bold text-white">Transfer</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* From / To Section */}
                        <div className="flex items-center gap-4 relative">
                            {/* From Card */}
                            <div className="flex-1 bg-gray-900/50 rounded-2xl p-4 border border-gray-800 transition-colors hover:border-gray-700">
                                <span className="text-xs text-gray-500 font-medium block mb-2 uppercase tracking-wider">From</span>
                                <div className="relative">
                                    <select 
                                        value={fromAccount}
                                        onChange={(e) => setFromAccount(e.target.value)}
                                        className="w-full bg-transparent font-bold text-white text-sm appearance-none outline-none pr-6 cursor-pointer"
                                    >
                                        {accounts.filter(a => a !== toAccount).map(a => (
                                            <option key={a} value={a} className="bg-gray-900">{a}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            
                            {/* Swap Button */}
                            <motion.button 
                                whileTap={{ rotate: 180 }}
                                onClick={handleSwap}
                                className={twMerge(
                                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
                                    "bg-[#121836] p-2 rounded-full text-blue-400 border border-gray-700",
                                    "hover:text-white hover:border-blue-500 transition-colors shadow-lg"
                                )}
                            >
                                <RotateCw size={20} />
                            </motion.button>

                            {/* To Card */}
                            <div className="flex-1 bg-gray-900/50 rounded-2xl p-4 border border-gray-800 transition-colors hover:border-gray-700 text-right">
                                <span className="text-xs text-gray-500 font-medium block mb-2 uppercase tracking-wider">To</span>
                                <div className="relative">
                                    <select 
                                        value={toAccount}
                                        onChange={(e) => setToAccount(e.target.value)}
                                        className="w-full bg-transparent font-bold text-white text-sm appearance-none outline-none pl-6 cursor-pointer text-right"
                                        dir="rtl"
                                    >
                                        {accounts.filter(a => a !== fromAccount).map(a => (
                                            <option key={a} value={a} className="bg-gray-900">{a}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Asset Selection */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block font-medium">Asset</label>
                            <div className={twMerge(
                                "bg-gray-900/50 border border-gray-800 rounded-2xl p-3 flex items-center justify-between transition-all",
                                isLocked && "bg-gray-900/80 border-dashed border-gray-700"
                            )}>
                                {isLocked ? (
                                    // Locked State (USDT Only)
                                    <div className="flex items-center gap-3 w-full px-1">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <img src={selectedAsset.icon} className="w-6 h-6 rounded-full" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-bold text-white">{selectedAsset.symbol}</span>
                                            <span className="text-xs text-gray-500">Only USDT supported for this wallet</span>
                                        </div>
                                        <Lock size={16} className="text-gray-500" />
                                    </div>
                                ) : (
                                    // Unlocked Dropdown
                                    <div className="relative w-full">
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                             <img src={selectedAsset.icon} className="w-6 h-6 rounded-full" />
                                        </div>
                                        <select
                                            value={selectedAsset.symbol}
                                            onChange={(e) => setSelectedAsset(assets.find(a => a.symbol === e.target.value) || assets[0])}
                                            className="w-full bg-transparent font-bold text-white appearance-none outline-none pl-12 py-2 cursor-pointer"
                                        >
                                            {assets.map(a => (
                                                <option key={a.symbol} value={a.symbol} className="bg-gray-900">
                                                    {a.symbol} - {a.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-gray-400 font-medium">Amount</label>
                                <span className="text-xs text-gray-500">Available: <span className="text-white">10,450.00</span> {selectedAsset.symbol}</span>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className={twMerge(
                                        "w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-white font-mono text-lg outline-none transition-colors",
                                        "focus:border-blue-500 focus:bg-gray-900"
                                    )}
                                    placeholder="0.00"
                                />
                                <button 
                                    onClick={() => setAmount('10450.00')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-500 hover:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={twMerge(
                                "w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all mt-2",
                                "bg-gradient-to-r from-blue-600 to-blue-500 text-white",
                                "hover:shadow-blue-500/25"
                            )}
                            onClick={() => { alert('Transfer Successful!'); onClose(); }}
                        >
                            Confirm Transfer
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
