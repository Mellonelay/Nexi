import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import AppHeader from "../components/AppHeader";
import { Suspense } from "react";
import { RouteHistoryTracker } from "../components/SafeBackButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nexi-dashboard-shell relative flex min-w-0 flex-col overflow-hidden bg-[#050508] text-white lg:flex-row">
      <Suspense fallback={null}>
        <RouteHistoryTracker />
      </Suspense>
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="min-h-0 min-w-0 flex flex-1 flex-col overflow-x-clip overflow-y-auto">
        <AppHeader />
        <div className="min-h-0 w-full min-w-0 flex-1">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
