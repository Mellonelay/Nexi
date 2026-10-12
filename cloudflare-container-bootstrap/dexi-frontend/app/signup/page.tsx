'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WalletConnectControl from '../components/WalletConnectControl';
import { captureReferralCode } from '../lib/wallet-auth';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    captureReferralCode();
    const onSession = () => router.push('/dashboard');
    window.addEventListener('nexi:wallet-session', onSession);
    return () => window.removeEventListener('nexi:wallet-session', onSession);
  }, [router]);

  return (
    <main className="nexi-safe-area-page nexi-page-shell flex min-h-[100dvh] min-w-0 items-center justify-center text-[#F5F7FB]">
      <div className="nexi-raised-panel w-full max-w-md space-y-6 rounded-2xl border border-violet-300/20 p-6 shadow-2xl sm:p-8">
        <h1 className="gradient-text text-center text-3xl font-bold">Create Account</h1>
        <p className="text-center text-sm leading-6 text-[#C3BBD0]">Create your NEXI account by connecting and signing with an Ethereum wallet.</p>
        <WalletConnectControl compact />
        <p className="text-center text-[#8C8299]">
          Already have an account? <Link href="/login" className="text-[var(--nexi-focus)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">Login</Link>
        </p>
      </div>
    </main>
  );
}
