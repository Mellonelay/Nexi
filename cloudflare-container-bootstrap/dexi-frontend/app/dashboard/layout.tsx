import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';
import WalletAccessGate from '../components/WalletAccessGate';
import { Suspense } from 'react';
import { RouteHistoryTracker } from '../components/SafeBackButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-[100dvh] min-w-0 bg-[#050508] text-white">
      <Suspense fallback={null}><RouteHistoryTracker /></Suspense>
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0">
        <AppHeader />
        <div className="h-full w-full min-w-0"><WalletAccessGate>{children}</WalletAccessGate></div>
      </main>
      <BottomNav />
    </div>
  );
}
