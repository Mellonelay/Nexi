'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface AssetListProps {
    currencies: any[];
    balances: any;
}

export default function AssetList({ currencies, balances }: AssetListProps) {
    const [hideSmall, setHideSmall] = useState(false);
    const [search, setSearch] = useState('');

    const filteredAssets = currencies.filter(c => {
        const bal = balances[c.symbol]?.available || 0;
        const matchesSearch = c.symbol.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
        const matchesBalance = hideSmall ? bal * (c.rate || 1) >= 1 : true;
        return matchesSearch && matchesBalance;
    });

    return (
        <div className="bg-[#121836] rounded-2xl border border-gray-800/50 overflow-hidden">
            {/* Controls */}
            <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-white">Assets</h2>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Hide Small Balances Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400 hover:text-white transition-colors select-none">
                        <input 
                            type="checkbox" 
                            checked={hideSmall} 
                            onChange={(e) => setHideSmall(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-offset-0 focus:ring-0" 
                        />
                        Hide Small Balances
                    </label>

                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search coin" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:border-gray-600 outline-none w-32 md:w-48 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-3 px-6 py-3 bg-gray-900/50 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <div>Asset</div>
                <div className="text-right">Balance</div>
                <div className="text-right">Value (USD)</div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-800">
                {filteredAssets.map(curr => {
                    const bal = balances[curr.symbol] || { available: 0, locked: 0 };
                    const total = bal.available + bal.locked;
                    const value = total * (curr.rate || 1); // Mock rate or real if available
                    
                    return (
                        <div key={curr.symbol} className="grid grid-cols-3 px-6 py-4 hover:bg-white/5 transition-colors items-center group cursor-pointer">
                            <div className="flex items-center gap-3">
                                {curr.logo ? (
                                    <img src={curr.logo} alt={curr.symbol} className="w-8 h-8 rounded-full" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                        {curr.symbol[0]}
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-white">{curr.symbol}</div>
                                    <div className="text-xs text-gray-500 group-hover:text-gray-400">{curr.name}</div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <div className="font-mono text-white text-sm">{total.toFixed(4)}</div>
                                {bal.locked > 0 && (
                                    <div className="text-[10px] text-gray-500">Locked: {bal.locked.toFixed(4)}</div>
                                )}
                            </div>
                            
                            <div className="text-right">
                                <div className="font-mono text-white text-sm">${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    );
                })}
                
                {filteredAssets.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No assets found.
                    </div>
                )}
            </div>
        </div>
    );
}
