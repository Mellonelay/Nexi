import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-dexi-dark text-white">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {/* Mobile Header if needed, but pages handle it */}
        <div className="container mx-auto p-0 md:p-0 h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
