'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencies: any[];
    selectedCurrency: string;
    onSelectCurrency: (symbol: string) => void;
    onWithdraw: (amount: string, address: string) => void;
}

export default function WithdrawModal({ isOpen, onClose, currencies, selectedCurrency, onSelectCurrency, onWithdraw }: WithdrawModalProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
        const address = (form.elements.namedItem('address') as HTMLInputElement).value;
        onWithdraw(amount, address);
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
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative bg-[#121836] w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
                            {currencies.map(c => (
                                <button 
                                    key={c.symbol}
                                    onClick={() => onSelectCurrency(c.symbol)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
                                        selectedCurrency === c.symbol 
                                        ? 'bg-[#FF4D4F]/10 border-[#FF4D4F] text-[#FF4D4F]' 
                                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                                    }`}
                                >
                                    {c.symbol}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 ml-1">Destination Address</label>
                                <input 
                                    name="address"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 mt-1 outline-none focus:border-blue-500 font-mono text-sm text-white transition-colors"
                                    placeholder="0x..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 ml-1">Amount</label>
                                <div className="relative">
                                    <input 
                                        name="amount"
                                        type="number"
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 mt-1 outline-none focus:border-blue-500 font-mono text-sm text-white transition-colors"
                                        placeholder="0.00"
                                        required
                                    />
                                    <span className="absolute right-4 top-[22px] text-xs font-bold text-gray-500">{selectedCurrency}</span>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full mt-4 py-4 bg-[#FF4D4F] hover:bg-red-600 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
                            >
                                Confirm Withdrawal
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
