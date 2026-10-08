'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, LineChart, TrendingUp, Settings, Hammer, Landmark, Headphones, Bell, BookOpen, MessageSquare, Languages } from 'lucide-react';
import { useLocale } from '../state/LocaleProvider';
import { localeLabel } from '../state/locale';
import type { UiMessageKey } from '../state/messages';
import { NexiWordmark } from '../dashboard/components/QuotesHubVisuals';
import AccountIdentityHeader from './AccountIdentityHeader';

const navItems: Array<{ key: UiMessageKey; href: string; icon: typeof Home }> = [
  { key: 'dashboard', href: '/dashboard', icon: Home }, { key: 'spotTrading', href: '/dashboard/spot', icon: LineChart }, { key: 'optionsBinary', href: '/dashboard/binary', icon: TrendingUp }, { key: 'wallet', href: '/dashboard/wallet', icon: Wallet }, { key: 'earn', href: '/dashboard/mining', icon: Hammer }, { key: 'loan', href: '/dashboard/loans', icon: Landmark }, { key: 'support', href: '/dashboard/support', icon: Headphones }, { key: 'announcements', href: '/dashboard/announcement', icon: Bell }, { key: 'learn', href: '/dashboard/learn', icon: BookOpen }, { key: 'messages', href: '/dashboard/messages', icon: MessageSquare }, { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname(); const { locale, setLocale, languages, t } = useLocale();
  return <aside className="nexi-sidebar hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-violet-300/15 text-[#F8F6FF] lg:flex">
    <div className="flex h-16 shrink-0 items-center border-b border-violet-300/15 px-5"><NexiWordmark compact /></div>
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label={t('primary')}>
      <AccountIdentityHeader />
      {navItems.map(({ key, href, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`nexi-interactive flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] ${active ? 'border-violet-300/25 bg-[#2A1742] text-[#F8F6FF] shadow-[0_0_24px_rgba(139,92,246,0.12)]' : 'border-transparent text-[#C3BBD0] hover:bg-white/5 hover:text-white'}`}><Icon aria-hidden="true" className={`mr-3 h-5 w-5 ${active ? 'text-[#A995FF]' : 'text-[#8C8299]'}`} />{t(key)}</Link>; })}
    </nav>
    <div className="border-t border-violet-300/15 p-4"><label className="flex min-h-11 items-center gap-2 rounded-lg border border-violet-300/15 bg-[#171022] px-3 text-xs text-[#C3BBD0]" htmlFor="desktop-locale-select"><Languages className="h-4 w-4 text-[#8C8299]" aria-hidden="true" /><span className="sr-only">{t('languageSelection')}</span><select id="desktop-locale-select" value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} className="min-w-0 flex-1 bg-transparent text-xs text-[#F8F6FF] outline-none"><option value={locale}>{localeLabel(locale)}</option>{languages.filter((item) => item.code !== locale).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label></div>
  </aside>;
}
