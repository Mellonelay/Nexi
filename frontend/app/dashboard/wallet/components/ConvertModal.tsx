'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown } from 'lucide-react';
import { useState } from 'react';

interface ConvertModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ConvertModal({ isOpen, onClose }: ConvertModalProps) {
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
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Convert</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        {/* From */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs text-gray-500">From</span>
                                <span className="text-xs text-gray-500">Balance: 0.45 BTC</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <input className="bg-transparent text-2xl font-bold text-white outline-none w-1/2" placeholder="0.00" />
                                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                                    <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" className="w-5 h-5 rounded-full" />
                                    <span className="font-bold text-white">BTC</span>
                                </div>
                            </div>
                        </div>

                        {/* Swap Icon */}
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-gray-800 p-2 rounded-full border-4 border-[#121836]">
                                <ArrowDown size={20} className="text-gray-400" />
                            </div>
                        </div>

                        {/* To */}
                        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs text-gray-500">To</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <input className="bg-transparent text-2xl font-bold text-white outline-none w-1/2" placeholder="0.00" readOnly />
                                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                                    <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-5 h-5 rounded-full" />
                                    <span className="font-bold text-white">USDT</span>
                                </div>
                            </div>
                        </div>

                        {/* Rate */}
                        <div className="flex justify-between text-xs text-gray-500 px-2">
                            <span>Reference Price</span>
                            <span>1 BTC ≈ 95,000.00 USDT</span>
                        </div>

                        {/* Action */}
                        <button 
                            className="w-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] mt-4"
                            onClick={() => { alert('Preview Only'); onClose(); }}
                        >
                            Preview Conversion
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
