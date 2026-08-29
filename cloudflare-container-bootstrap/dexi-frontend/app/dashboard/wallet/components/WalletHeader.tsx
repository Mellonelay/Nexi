'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';

interface WalletHeaderProps {
    totalBalance: number;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onDeposit: () => void;
    onWithdraw: () => void;
    onTransfer: () => void;
    onConvert: () => void;
}

function AnimatedNumber({ value }: { value: number }) {
    // Slot Machine feel: High stiffness, low damping for snap
    const spring = useSpring(value, { mass: 0.5, stiffness: 200, damping: 10 });
    const display = useTransform(spring, (current) =>
        `$${current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
}

export default function WalletHeader({ totalBalance, activeTab, onTabChange, onDeposit, onWithdraw, onTransfer, onConvert }: WalletHeaderProps) {
    const [isHidden, setIsHidden] = useState(false);

    const tabs = [
        { name: 'Overview', color: 'bg-[#121836]' },
        { name: 'Spot', color: 'bg-blue-900/40' },
        { name: 'Options', color: 'bg-purple-900/40' },
        { name: 'Funding', color: 'bg-orange-900/40' },
        { name: 'Earn', color: 'bg-green-900/40' }
    ];

    const activeColor = tabs.find(t => t.name === activeTab)?.color || 'bg-[#121836]';

    let tabBgColor = 'bg-white';
    if (activeTab === 'Options') tabBgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
    else if (activeTab === 'Spot') tabBgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
    else if (activeTab === 'Funding') tabBgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
    else if (activeTab === 'Earn') tabBgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';

    return (
        <motion.div
            layout
            className={`rounded-2xl p-6 mb-6 shadow-lg border border-gray-800/50 transition-colors duration-500 ${activeColor}`}
        >
            {/* Balance Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm font-medium">
                    <span>{activeTab === 'Overview' ? 'Estimated Total Balance' : `${activeTab} Balance`}</span>
                    <button onClick={() => setIsHidden(!isHidden)} className="hover:text-white transition-colors">
                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <div className="flex items-baseline gap-3">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        {isHidden ? '****' : <AnimatedNumber value={totalBalance} />}
                    </h1>
                    <span className="text-gray-500 font-mono text-sm">
                        {isHidden ? '≈ **** BTC' : `≈ ${(totalBalance / 95000).toFixed(8)} BTC`}
                    </span>
                </div>
            </div>

            {/* Tabs (Cards) */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.name}
                        onClick={() => onTabChange(tab.name)}
                        className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap overflow-hidden group ${activeTab === tab.name
                            ? 'text-white shadow-lg ring-1 ring-white/10'
                            : 'text-gray-400 bg-[#0a0e27]/50 hover:bg-[#0a0e27] hover:text-white'
                            }`}
                    >
                        {activeTab === tab.name && (
                            <motion.div
                                layoutId="activeTabBg"
                                className={`absolute inset-0 opacity-20 ${tabBgColor}`}
                            />
                        )}
                        <span className="relative z-10">{tab.name}</span>
                    </button>
                ))}
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-4 gap-4">
                <ActionButton label="Deposit" icon={ArrowDownCircle} color="text-[#00C076]" onClick={onDeposit} />
                <ActionButton label="Withdraw" icon={ArrowUpCircle} color="text-[#FF4D4F]" onClick={onWithdraw} />
                <ActionButton label="Transfer" icon={ArrowRightLeft} color="text-[#3B82F6]" onClick={onTransfer} />
                <ActionButton label="Convert" icon={RefreshCw} color="text-[#8B5CF6]" onClick={onConvert} />
            </div>
        </motion.div>
    );
}

function ActionButton({ label, icon: Icon, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-2 group p-2 rounded-xl hover:bg-white/5 transition-colors active:scale-95"
        >
            <div className={`w-12 h-12 rounded-full bg-gray-900/50 border border-white/5 flex items-center justify-center group-hover:bg-gray-800 transition-all shadow-lg ${color}`}>
                <Icon size={24} />
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-white">{label}</span>
        </button>
    );
}
