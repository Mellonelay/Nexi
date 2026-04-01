'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, ArrowLeftRight, Wallet, Cpu, X, TrendingUp, LineChart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Markets', href: '/dashboard/spot', icon: BarChart3 },
  { name: 'Trade', href: '#', icon: ArrowLeftRight, isFloating: true }, // href="#" as placeholder
  { name: 'Assets', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Mine', href: '/dashboard/mining', icon: Cpu },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2 pointer-events-none">
        <div className="mx-auto max-w-lg relative pointer-events-auto">
          {/* Glassmorphism Background Container */}
          <div className="flex items-center justify-between px-4 h-16 rounded-2xl border border-white/10 bg-[#0a0e27]/90 backdrop-blur-md shadow-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.isFloating) {
                return (
                  <div key={item.name} className="relative -top-6">
                    <button
                      onClick={() => setIsTradeModalOpen(true)}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-dexi-blue to-dexi-purple shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-transform active:scale-90"
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
                  href={item.href}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
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

      {/* Trade Selection Modal */}
      <AnimatePresence>
        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTradeModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#121836] rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Select Trading Mode</h3>
                <button 
                  onClick={() => setIsTradeModalOpen(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/dashboard/spot" 
                  onClick={() => setIsTradeModalOpen(false)}
                  className="flex flex-col items-center gap-3 p-6 bg-[#0a0e27] rounded-2xl border border-white/5 hover:border-dexi-blue/50 hover:bg-dexi-blue/5 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-dexi-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LineChart size={32} className="text-dexi-blue" />
                  </div>
                  <span className="font-bold text-white group-hover:text-dexi-blue">Spot Trading</span>
                </Link>

                <Link 
                  href="/dashboard/binary" 
                  onClick={() => setIsTradeModalOpen(false)}
                  className="flex flex-col items-center gap-3 p-6 bg-[#0a0e27] rounded-2xl border border-white/5 hover:border-dexi-purple/50 hover:bg-dexi-purple/5 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-dexi-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
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
