'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, LineChart, TrendingUp, Settings, LogOut, Hammer, Landmark, Headphones, Bell, BookOpen, MessageSquare } from 'lucide-react';
import { useActivePair } from '../providers/ActivePairProvider';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Spot Trading', href: '/dashboard/spot', icon: LineChart },
  { name: 'Option', href: '/dashboard/binary', icon: TrendingUp },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Earn', href: '/dashboard/mining', icon: Hammer },
  { name: 'Loan', href: '/dashboard/loans', icon: Landmark },
  { name: 'Support', href: '/dashboard/support', icon: Headphones },
  { name: 'Announcement', href: '/dashboard/announcements', icon: Bell },
  { name: 'Learn', href: '/dashboard/learn', icon: BookOpen },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activePair } = useActivePair();

  const hrefFor = (href: string): string => {
    if (href === '/dashboard/spot') {
      return `${href}?symbol=${encodeURIComponent(activePair.spotSymbol)}`;
    }
    if (href === '/dashboard/binary') {
      return `${href}?symbol=${encodeURIComponent(activePair.binarySymbol)}`;
    }
    return href;
  };

  return (
    <div className="hidden h-screen w-[280px] flex-col border-r border-dexi-purple/20 bg-dexi-darker md:flex">
      <div className="flex h-16 items-center justify-center border-b border-dexi-purple/20">
        <h1 className="gradient-text text-2xl font-bold">NEXI</h1>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={hrefFor(item.href)}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-dexi-cyan/20 bg-dexi-purple/20 text-dexi-cyan shadow-neon-blue'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-dexi-cyan' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-dexi-purple/20 p-4">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-white/5"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
