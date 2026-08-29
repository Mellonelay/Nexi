'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, ShieldCheck, UserRound } from 'lucide-react';
import api from '../../lib/api';
import { authoritativeValue, resolveEndpointTemplate } from '../../lib/product-states';
import { DataStatePanel, Metric, PageHeader, PageShell, Panel, PanelHeading, StatusBadge } from '../wallet/components/ProductPrimitives';
import { loadCurrentUser, sessionPrincipalId, type WalletProfile } from '../../lib/wallet-auth';

export default function ProfilePage() {
  const [kyc, setKyc] = useState<Record<string, unknown> | null>(null);
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const sessionQuery = useQuery<WalletProfile>({ queryKey: ['user', 'me'], queryFn: loadCurrentUser, enabled: typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token')), retry: false, staleTime: 30_000 });
  const userId = sessionPrincipalId();
  const vipState = 'UNAVAILABLE' as const;
  const kycEndpoint = userId
    ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_PROFILE_KYC_ENDPOINT, { userId })
    : null;
  const walletEndpoint = userId
    ? resolveEndpointTemplate(process.env.NEXT_PUBLIC_PROFILE_WALLET_ENDPOINT, { userId })
    : null;

  useEffect(() => {
    if (sessionQuery.isPending) return;
    if (!userId || !kycEndpoint || !walletEndpoint) {
      setKyc(null);
      setWallet(null);
      setState('UNAVAILABLE');
      return;
    }
    setState('LOADING');
    Promise.all([api.get(kycEndpoint), api.get(walletEndpoint)])
      .then(([kycResponse, walletResponse]) => {
        setKyc(kycResponse.data && typeof kycResponse.data === 'object' ? kycResponse.data : null);
        setWallet(walletResponse.data && typeof walletResponse.data === 'object' ? walletResponse.data : null);
        setState('LIVE');
      })
      .catch(() => {
        setKyc(null);
        setWallet(null);
        setState('ERROR');
      });
  }, [kycEndpoint, sessionQuery.isPending, userId, walletEndpoint]);
  const kycStatus = authoritativeValue(kyc?.status);
  return <PageShell><PageHeader eyebrow="Account identity" title="Profile & VIP" description="Identity, wallet status, security posture, and VIP progress are displayed only from backend-owned profile contracts." /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2"><Panel><PanelHeading title="Profile" action={<UserRound size={18} className="text-[#48C0CC]" />} /><div className="grid gap-3 sm:grid-cols-2"><Metric label="NEXI User ID" value={authoritativeValue(sessionQuery.data?.id)} /><Metric label="Wallet address" value={authoritativeValue(sessionQuery.data?.walletAddress)} /><Metric label="Chain ID" value={authoritativeValue(sessionQuery.data?.chainId)} /><Metric label="Display name" value={authoritativeValue(sessionQuery.data?.displayName)} /><Metric label="Email" value={authoritativeValue(sessionQuery.data?.email)} /><Metric label="Country" value={authoritativeValue(kyc?.country)} /><Metric label="KYC" value={state === 'LIVE' ? kycStatus : '—'} /></div>{state === 'LOADING' && <div className="mt-4"><DataStatePanel state="LOADING" title="Loading account authority" /></div>}{state === 'UNAVAILABLE' && <div className="mt-4"><DataStatePanel state="UNAVAILABLE" title={userId ? 'Profile endpoints unavailable' : 'Sign in to load profile'} message={userId ? 'Explicit public KYC and wallet read endpoints are required.' : undefined} /></div>}{state === 'ERROR' && <div className="mt-4"><DataStatePanel state="ERROR" title="Profile authority unavailable" /></div>}</Panel><Panel><PanelHeading title="Security and wallet status" action={<ShieldCheck size={18} className="text-[#48C0CC]" />} /><div className="space-y-3"><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">KYC state</span><StatusBadge state={kycStatus === '—' ? 'UNAVAILABLE' : kycStatus} /></div><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">Internal wallet</span><StatusBadge state={wallet ? 'LIVE' : 'UNAVAILABLE'} /></div><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">Wallet session</span><StatusBadge state={sessionQuery.data?.walletAddress ? 'LIVE' : 'UNAVAILABLE'} /></div></div></Panel><Panel><PanelHeading title="VIP directory" action={<Crown size={18} className="text-[#A995FF]" />} /><DataStatePanel state={vipState} title="VIP directory unavailable" message="VIP level, benefits, thresholds, progress, and eligibility must be supplied by the backend. No level or target is invented." /></Panel><Panel><PanelHeading title="VIP progress" description="Progress is intentionally empty until authoritative milestones arrive." /><div className="rounded-xl border border-[#2B2037] bg-[#171022] p-5"><div className="flex items-center justify-between text-sm"><span className="text-[#C3BBD0]">Current level</span><span className="font-mono">—</span></div><div className="mt-4 h-2 rounded-full bg-[#2B2037]"><div className="h-2 w-0 rounded-full bg-[#8B5CF6]" /></div><div className="mt-3 flex justify-between text-xs text-[#8C8299]"><span>Progress —</span><span>Next threshold —</span></div></div></Panel></main></PageShell>;
}
