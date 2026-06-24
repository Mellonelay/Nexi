'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, ArrowLeftRight, Wallet, Cpu, X, TrendingUp, LineChart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivePair } from '../providers/ActivePairProvider';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Markets', href: '/dashboard/spot', icon: BarChart3 },
  { name: 'Trade', href: '#', icon: ArrowLeftRight, isFloating: true },
  { name: 'Assets', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Mine', href: '/dashboard/mining', icon: Cpu },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const { activePair } = useActivePair();

  const spotHref = `/dashboard/spot?symbol=${encodeURIComponent(activePair.spotSymbol)}`;
  const binaryHref = `/dashboard/binary?symbol=${encodeURIComponent(activePair.binarySymbol)}`;

  const hrefFor = (href: string): string => {
    if (href === '/dashboard/spot') return spotHref;
    return href;
  };

  return (
    <>
      <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
        <div className="pointer-events-auto relative mx-auto max-w-lg">
          <div className="flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-[#0a0e27]/90 px-4 shadow-2xl backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.isFloating) {
                return (
                  <div key={item.name} className="relative -top-6">
                    <button
                      type="button"
                      aria-label="Open trading mode selector"
                      onClick={() => setIsTradeModalOpen(true)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-dexi-blue to-dexi-purple shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </button>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-dexi-cyan">
                      {item.name}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={hrefFor(item.href)}
                  className={`flex min-h-11 min-w-11 flex-col items-center justify-center space-y-1 transition-colors ${
                    isActive ? 'text-dexi-cyan' : 'text-gray-400'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTradeModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#121836] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:border"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Select Trading Mode</h3>
                  <p className="mt-1 text-xs text-gray-400">Active pair: {activePair.canonicalSymbol}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close trading mode selector"
                  onClick={() => setIsTradeModalOpen(false)}
                  className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dexi-cyan"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href={spotHref}
                  onClick={() => setIsTradeModalOpen(false)}
                  className="group flex min-h-40 flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#0a0e27] p-6 transition-all hover:border-dexi-blue/50 hover:bg-dexi-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dexi-blue"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dexi-blue/10 transition-transform group-hover:scale-110">
                    <LineChart size={32} className="text-dexi-blue" />
                  </div>
                  <span className="font-bold text-white group-hover:text-dexi-blue">Spot Trading</span>
                </Link>

                <Link
                  href={binaryHref}
                  onClick={() => setIsTradeModalOpen(false)}
                  className="group flex min-h-40 flex-col items-center gap-3 rounded-2xl border border-white/5 bg-[#0a0e27] p-6 transition-all hover:border-dexi-purple/50 hover:bg-dexi-purple/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dexi-purple"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dexi-purple/10 transition-transform group-hover:scale-110">
                    <TrendingUp size={32} className="text-dexi-purple" />
                  </div>
                  <span className="font-bold text-white group-hover:text-dexi-purple">Option Trading</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
