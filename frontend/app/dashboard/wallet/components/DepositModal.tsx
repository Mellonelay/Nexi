'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Copy } from 'lucide-react';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencies: any[];
    selectedCurrency: string;
    onSelectCurrency: (symbol: string) => void;
}

export default function DepositModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency }: DepositModalProps) {
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
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-[#121836] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Deposit {selectedCurrency}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Currency Selector */}
                        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                            {currencies.map(c => (
                                <button 
                                    key={c.symbol}
                                    onClick={() => onSelectCurrency(c.symbol)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
                                        selectedCurrency === c.symbol 
                                        ? 'bg-[#00C076]/10 border-[#00C076] text-[#00C076]' 
                                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                                    }`}
                                >
                                    {c.symbol}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-xl mb-6 flex justify-center shadow-inner">
                            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-black border-2 border-dashed border-gray-300 rounded-lg">
                                <QrCode size={64} className="opacity-50" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-xs text-gray-400">Deposit Address (Network: {selectedCurrency})</p>
                            <div 
                                className="bg-gray-900 p-3 rounded-xl font-mono text-xs break-all text-gray-300 border border-gray-800 flex items-center justify-between gap-2 cursor-pointer hover:border-gray-600 transition-colors group"
                                onClick={() => alert('Address Copied!')}
                            >
                                <span>0x71C7656EC7ab88b098defB751B7401B5f6d8976F</span>
                                <Copy size={14} className="text-gray-500 group-hover:text-white" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                                Send only <span className="text-white font-bold">{selectedCurrency}</span> to this address. 
                                Sending any other asset may result in permanent loss.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
