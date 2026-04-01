'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, LineChart, TrendingUp, Settings, LogOut, Hammer, Landmark, Headphones, Bell, BookOpen, MessageSquare } from 'lucide-react';

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

  return (
    <div className="hidden md:flex flex-col h-screen w-64 bg-dexi-darker border-r border-dexi-purple/20">
      <div className="flex items-center justify-center h-16 border-b border-dexi-purple/20">
        <h1 className="text-2xl font-bold gradient-text">NEXI</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-dexi-purple/20 text-dexi-cyan border border-dexi-cyan/20 shadow-neon-blue'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-dexi-cyan' : ''}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-dexi-purple/20">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
