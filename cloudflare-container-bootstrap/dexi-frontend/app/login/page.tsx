"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WalletConnectControl from "../components/WalletConnectControl";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const onSession = () => router.push('/dashboard');
    window.addEventListener('nexi:wallet-session', onSession);
    return () => window.removeEventListener('nexi:wallet-session', onSession);
  }, [router]);

  return (
    <div className="nexi-safe-area-page nexi-page-shell flex min-h-[100dvh] min-w-0 items-center justify-center text-[#F5F7FB]">
      <div className="nexi-raised-panel w-full max-w-md space-y-6 rounded-2xl border border-violet-300/20 p-6 shadow-2xl sm:p-8">
        <h1 className="gradient-text text-center text-3xl font-bold">
          Login to NEXI
        </h1>
        <p className="text-center text-sm leading-6 text-[#C3BBD0]">Connect and sign a message with your Ethereum wallet to access NEXI.</p>
        <WalletConnectControl compact />
        <p className="text-center text-[#8C8299]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--nexi-focus)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
