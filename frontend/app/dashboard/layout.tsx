import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { ActivePairProvider } from '../providers/ActivePairProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ActivePairProvider>
      <div className="flex min-h-screen bg-dexi-dark text-white">
        {/* Sidebar - Desktop Only */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-auto pb-16 md:pb-0">
          {/* Mobile Header if needed, but pages handle it */}
          <div className="container mx-auto h-full p-0 md:p-0">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </ActivePairProvider>
  );
}
