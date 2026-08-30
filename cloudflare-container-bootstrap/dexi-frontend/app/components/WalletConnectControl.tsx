'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { captureReferralCode, clearReferralCode, clearWalletSession, loadCurrentUser, logoutWallet, requestWalletChallenge, setWalletSession, verifyWalletChallenge } from '../lib/wallet-auth';
import { config as wagmiConfig } from '../lib/wagmi';

function truncateAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

function walletErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/tab is not active|not active/i.test(message)) return 'Brave Wallet requires an active wallet tab. Open Brave Wallet, approve the request, then retry.';
  if (/user rejected|rejected the request|denied/i.test(message)) return 'Wallet request was rejected. Approve the connection to continue.';
  if (/connectoralreadyconnected/i.test(message)) return 'Verify wallet to continue.';
  return 'Wallet verification failed.';
}

function WalletConnectControlInner({ compact = false }: { compact?: boolean }) {
  const { address, chainId, connector: activeConnector, isConnected } = useAccount();
  const { connectors, connectAsync, error: connectionError } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const previousAddress = useRef<string | null>(null);
  const previousChainId = useRef<number | null>(null);
  const sessionQuery = useQuery({ queryKey: ['user', 'me'], queryFn: loadCurrentUser, enabled: typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token')), retry: false, staleTime: 30_000 });

  useEffect(() => { captureReferralCode(); }, []);

  useEffect(() => {
    const addressChanged = Boolean(address && previousAddress.current && previousAddress.current.toLowerCase() !== address.toLowerCase());
    const chainChanged = Boolean(chainId && previousChainId.current && previousChainId.current !== chainId);
    const disconnected = !isConnected && Boolean(previousAddress.current);
    if (addressChanged || chainChanged || disconnected) {
      clearWalletSession();
      void queryClient.cancelQueries({ queryKey: ['user', 'me'] });
      queryClient.removeQueries({ queryKey: ['user', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    }
    previousAddress.current = address ?? null;
    previousChainId.current = chainId ?? null;
  }, [address, chainId, isConnected, queryClient]);

  useEffect(() => {
    if (sessionQuery.error) clearWalletSession();
  }, [sessionQuery.error]);

  const authenticateConnectedWallet = useCallback(async (selectedAddress: string, selectedChainId: number) => {
    const challenge = await requestWalletChallenge(selectedAddress, selectedChainId);
    const signature = await signMessageAsync({ message: challenge.message });
    const referralCode = captureReferralCode();
    const verified = await verifyWalletChallenge(challenge.message, signature, referralCode);
    setWalletSession(verified);
    clearReferralCode();
    await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    setOpen(false);
    setMessage('Connected');
  }, [queryClient, signMessageAsync]);

  const connect = useCallback(async (connector?: (typeof connectors)[number]) => {
    setBusy(true); setMessage('');
    try {
      let selectedAddress = address;
      let selectedChainId = chainId;
      if (!isConnected || !selectedAddress || !selectedChainId) {
        if (!connector) throw new Error('No compatible wallet was discovered.');
        const result = await connectAsync({ connector });
        selectedAddress = result.accounts[0];
        selectedChainId = result.chainId;
      } else if (activeConnector && connector && activeConnector.uid !== connector.uid) {
        disconnect();
        const result = await connectAsync({ connector });
        selectedAddress = result.accounts[0];
        selectedChainId = result.chainId;
      }
      if (!selectedAddress || !selectedChainId) throw new Error('The wallet did not provide an account.');
      await authenticateConnectedWallet(selectedAddress, selectedChainId);
    } catch (error) { setMessage(walletErrorMessage(error)); }
    finally { setBusy(false); }
  }, [activeConnector, address, authenticateConnectedWallet, chainId, connectAsync, disconnect, isConnected]);

  useEffect(() => {
    const onVerifyRequest = () => {
      if (isConnected && address && chainId && !busy) void connect(activeConnector ?? connectors[0]);
    };
    window.addEventListener('nexi:verify-wallet-request', onVerifyRequest);
    return () => window.removeEventListener('nexi:verify-wallet-request', onVerifyRequest);
  }, [activeConnector, address, busy, chainId, connect, connectors, isConnected]);

  const disconnectWallet = async () => {
    setBusy(true);
    try { await logoutWallet(); } finally { disconnect(); queryClient.removeQueries({ queryKey: ['user', 'me'] }); setBusy(false); }
  };

  const sessionWalletAddress = sessionQuery.data?.walletAddress;
  if (isConnected && sessionWalletAddress && address && sessionWalletAddress.toLowerCase() === address.toLowerCase()) {
    return <button type="button" onClick={() => void disconnectWallet()} disabled={busy} className="min-h-11 rounded-xl border border-violet-300/25 bg-[#2A1742] px-3 text-left text-sm text-[#F8F6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]" title="Disconnect wallet">{truncateAddress(sessionWalletAddress)}</button>;
  }

  return <div className="relative">
    <button type="button" onClick={() => isConnected && address && chainId ? void connect(activeConnector ?? connectors[0]) : setOpen((value) => !value)} disabled={busy} className={`${compact ? 'w-full' : ''} min-h-11 rounded-xl border border-violet-300/25 bg-[#171022] px-3 text-sm font-semibold text-[#F8F6FF] transition hover:border-violet-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]`}>{busy ? 'Verifying…' : isConnected && address ? 'Verify wallet' : 'Connect'}</button>
    {open && <div className="absolute left-0 top-full z-[90] mt-2 min-w-56 rounded-xl border border-violet-300/25 bg-[#0B0A0E] p-2 shadow-2xl" role="dialog" aria-label="Choose a wallet">
      <p className="px-2 py-2 text-xs text-[#8C8299]">Choose a wallet</p>
      {connectors.map((connector) => <button type="button" key={connector.uid} onClick={() => void connect(connector)} className="block min-h-11 w-full rounded-lg px-2 text-left text-sm text-[#F8F6FF] hover:bg-[#2A1742]">{connector.name}</button>)}
      {(message || connectionError) && <p className="px-2 py-2 text-xs text-[#FFB6C2]" role="alert">{message || 'Wallet verification failed.'}</p>}
    </div>}
  </div>;
}

export default function WalletConnectControl(props: { compact?: boolean }) {
  if (!wagmiConfig) return <span className="text-xs text-[#8C8299]" role="status">Wallet connection is not configured.</span>;
  return <WalletConnectControlInner {...props} />;
}
