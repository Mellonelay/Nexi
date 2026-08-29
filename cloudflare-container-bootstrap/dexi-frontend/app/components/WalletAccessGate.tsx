'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { clearWalletSession, loadCurrentUser } from '../lib/wallet-auth';

export default function WalletAccessGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { address, isConnected, isReconnecting } = useAccount();

  const check = useCallback(async () => {
    const token = window.localStorage.getItem('token');
    if (!token || !isConnected || !address) { setAuthorized(false); return; }
    try {
      const user = await loadCurrentUser();
      if (!user.walletAddress || user.walletAddress.toLowerCase() !== address.toLowerCase()) {
        clearWalletSession(); setAuthorized(false); return;
      }
      setAuthorized(true);
    } catch { clearWalletSession(); setAuthorized(false); }
  }, [address, isConnected]);

  useEffect(() => {
    if (isReconnecting) { setAuthorized(null); return; }
    void check();
    const onSession = () => {
      if (window.localStorage.getItem('token')) void check();
      else setAuthorized(false);
    };
    window.addEventListener('nexi:wallet-session', onSession);
    return () => window.removeEventListener('nexi:wallet-session', onSession);
  }, [check, isReconnecting]);

  if (authorized === null) return <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-6 text-sm text-[var(--nexi-text-secondary)]">Checking wallet access…</div>;
  if (authorized) return <>{children}</>;
  return <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-6"><section className="nexi-shell-glass w-full max-w-xl rounded-3xl border border-violet-300/20 p-8 text-center shadow-2xl md:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200"><Wallet className="h-8 w-8" aria-hidden="true" /></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nexi-cyan)]">Wallet access</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{isConnected ? 'Wallet verification required' : 'Web3 wallet access required'}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--nexi-text-secondary)]">{isConnected ? 'Your Web3 wallet is connected. Please complete wallet verification to securely access your account.' : 'This platform is accessible only through a verified Web3 wallet connection. Please open it in a Web3-enabled browser or connect a compatible wallet to continue.'}</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('nexi:verify-wallet-request'))} className="mt-6 min-h-11 rounded-xl border border-violet-300/30 bg-violet-500/20 px-5 text-sm font-semibold text-white hover:bg-violet-500/30">{isConnected ? 'Verify wallet' : 'Connect wallet'}</button></section></main>;
}
