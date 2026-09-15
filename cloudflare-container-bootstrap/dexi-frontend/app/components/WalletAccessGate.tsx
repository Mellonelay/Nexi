'use client';

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import WalletConnectControl from './WalletConnectControl';

type WalletEnvironmentState = 'CHECKING' | 'AVAILABLE' | 'UNAVAILABLE';

export default function WalletAccessGate({ children }: { children: React.ReactNode }) {
  const uiQaBypassWalletEnvironment =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_NEXI_UI_QA_BYPASS_WALLET_ENVIRONMENT === '1';

  const { isConnected, isReconnecting } = useAccount();
  const [environment, setEnvironment] = useState<WalletEnvironmentState>('CHECKING');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isConnected) { setEnvironment('AVAILABLE'); return; }

    let finished = false;
    const markAvailable = () => { if (!finished) setEnvironment('AVAILABLE'); };
    const providerWindow = window as typeof window & { ethereum?: unknown };
    if (providerWindow.ethereum) markAvailable();

    const onProvider = () => markAvailable();
    window.addEventListener('eip6963:announceProvider', onProvider as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    const timer = window.setTimeout(() => {
      finished = true;
      setEnvironment((current) => current === 'AVAILABLE' ? current : 'UNAVAILABLE');
    }, 350);
    return () => {
      finished = true;
      window.clearTimeout(timer);
      window.removeEventListener('eip6963:announceProvider', onProvider as EventListener);
    };
  }, [isConnected]);

  if (uiQaBypassWalletEnvironment) return <>{children}</>;

  if (isReconnecting || environment === 'CHECKING') {
    return <main className="flex min-h-[100dvh] items-center justify-center bg-[#050508] p-6 text-sm text-[var(--nexi-text-secondary)]">Detecting Web3 wallet environment…</main>;
  }

  if (environment === 'AVAILABLE' || isConnected) return <>{children}</>;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#050508] p-6">
      <section className="nexi-shell-glass w-full max-w-xl rounded-3xl border border-violet-300/20 p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-200"><Wallet className="h-8 w-8" aria-hidden="true" /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nexi-cyan)]">Wallet access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Web3 wallet access required</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--nexi-text-secondary)]">Open NEXI inside a compatible Ethereum wallet browser, install an EIP-6963/EIP-1193 wallet, or connect through an available wallet provider. Wallet discovery and NEXI account verification are separate steps.</p>
        <div className="mx-auto mt-6 max-w-xs"><WalletConnectControl compact /></div>
      </section>
    </main>
  );
}
