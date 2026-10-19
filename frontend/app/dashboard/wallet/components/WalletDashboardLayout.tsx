import type { ReactNode } from 'react';

/** Wallet composition boundary; shared shell and navigation remain outside it. */
export default function WalletDashboardLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto min-w-0 max-w-7xl space-y-3 sm:space-y-4">{children}</main>;
}
