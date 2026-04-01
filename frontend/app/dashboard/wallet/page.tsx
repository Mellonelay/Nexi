'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownLeft,
  RefreshCcw, ChevronRight, History,
  Lock, Eye, EyeOff
} from 'lucide-react';
import api from '../../lib/api';

/** 
 * ASSET MANAGEMENT (H5 MOBILE PRO) 
 * Featuring "Slot Machine" number animations and a focused action grid. 
 */
export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('spot');
  const [frozenBalance, setFrozenBalance] = useState(0);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        // Mock for now until API is fully wired
        // const res = await api.get('/auth/profile');
        // setFrozenBalance(res.data.wallet.frozenBalance);
        setFrozenBalance(150.00);
      } catch (e) { }
    };
    fetchWallet();
  }, []);

  const assets = [
    { name: 'USDT', full: 'Tether', amount: '1,240.50', value: '1,240.50', icon: 'T' },
    { name: 'BTC', full: 'Bitcoin', amount: '0.02451', value: '1,042.10', icon: 'B' },
    { name: 'ETH', full: 'Ethereum', amount: '0.45', value: '1,120.00', icon: 'E' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white p-4 pb-32">
      {/* 1. Header & Total Balance */}
      <div className="bg-gradient-to-br from-[#1e254d] to-[#121836] rounded-[2rem] p-6 mb-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-purple-500/10 blur-[50px] rounded-full"></div>

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Wallet size={14} />
            <span>Total Assets (USDT)</span>
            <button onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          <button className="p-2 bg-white/5 rounded-full">
            <History size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="text-3xl font-black font-mono tracking-tighter mb-1">
          {showBalance ? '3,402.60' : '******'}
        </div>
        <div className="text-xs text-green-500 font-bold mb-4">≈ $3,402.60</div>

        {/* Frozen / Locked Balance Display */}
        <div className="flex items-center gap-4 bg-[#0a0e27]/50 p-3 rounded-xl border border-white/5">
          <div className="flex-1 border-r border-white/5">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Available</div>
            <div className="text-sm font-bold font-mono text-white">
              {showBalance ? '3,252.60' : '****'}
            </div>
          </div>
          <div className="flex-1 pl-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Lock size={10} /> Frozen
            </div>
            <div className="text-sm font-bold font-mono text-gray-300">
              {showBalance ? frozenBalance.toFixed(2) : '****'}
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Deposit', icon: ArrowDownLeft, color: 'bg-green-500' },
            { label: 'Withdraw', icon: ArrowUpRight, color: 'bg-red-500' },
            { label: 'Transfer', icon: RefreshCcw, color: 'bg-blue-500' },
          ].map((action, i) => (
            <button key={i} className="flex flex-col items-center gap-2 group">
              <div className={`${action.color} p-3 rounded-2xl shadow-lg transition-transform active:scale-90`}>
                <action.icon size={20} className="text-black" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Account Tabs */}
      <div className="flex gap-4 mb-4">
        {['spot', 'options', 'earn'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500 border border-white/5'
              }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3. Asset List */}
      <div className="bg-[#121836] rounded-[2rem] border border-white/5 overflow-hidden">
        {assets.map((asset, i) => (
          <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 active:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-black text-gray-400">
                {asset.icon}
              </div>
              <div>
                <div className="font-bold">{asset.name}</div>
                <div className="text-[10px] text-gray-500">{asset.full}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold">{asset.amount}</div>
              <div className="text-[10px] text-gray-500">≈ ${asset.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Secondary Features */}
      <div className="mt-6 grid grid-cols-1 gap-3">
        <button className="bg-[#121836] p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-blue-400" />
            <span className="text-sm font-bold">Safe Vault (Earn 12% APR)</span>
          </div>
          <ChevronRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
