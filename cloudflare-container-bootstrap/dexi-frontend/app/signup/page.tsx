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
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">Create Account</h1>
        <p className="text-center text-sm text-gray-300">Create your NEXI account by connecting and signing with an Ethereum wallet.</p>
        <WalletConnectControl compact />
        <p className="text-center text-[#8C8299]">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
