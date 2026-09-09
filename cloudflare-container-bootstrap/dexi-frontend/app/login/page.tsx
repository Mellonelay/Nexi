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
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">
          Login to NEXI
        </h1>
        <p className="text-center text-sm text-gray-300">Connect and sign a message with your Ethereum wallet to access NEXI.</p>
        <WalletConnectControl compact />
        <p className="text-center text-[#8C8299]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
