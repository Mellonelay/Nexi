import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import WalletAccessGate from "../components/WalletAccessGate";
import { Suspense } from "react";
import { RouteHistoryTracker } from "../components/SafeBackButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletAccessGate>
      <div className="relative flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#050508] text-white lg:flex-row">
        <Suspense fallback={null}>
          <RouteHistoryTracker />
        </Suspense>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto">
          <AppHeader />
          <div className="h-full w-full min-w-0">{children}</div>
        </main>
        <BottomNav />
      </div>
    </WalletAccessGate>
  );
}
