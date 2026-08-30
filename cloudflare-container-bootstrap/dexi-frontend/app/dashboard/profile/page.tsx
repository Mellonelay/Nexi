'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Crown, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { authoritativeValue } from '../../lib/product-states';
import { DataStatePanel, Metric, PageHeader, PageShell, Panel, PanelHeading, StatusBadge } from '../wallet/components/ProductPrimitives';
import type { ReferralProfile, VipProfile } from '../../lib/wallet-auth';

type Profile = {
  id: string;
  email: string | null;
  displayName: string | null;
  walletAddress: string | null;
  chainId: number | null;
  kycStatus: string;
  country: string | null;
  createdAt: string;
  lastActive: string;
  referral: ReferralProfile;
  vip: VipProfile;
};

type VipLevel = { id: string; level: number; name: string; threshold: string; benefits: unknown; enabled: boolean };

async function loadProfile() {
  const response = await api.get<Profile>('/profile/me');
  return response.data;
}

async function loadVipLevels() {
  const response = await api.get<VipLevel[]>('/vip/levels');
  return response.data;
}

export default function ProfilePage() {
  const authenticated = typeof window !== 'undefined' && Boolean(window.localStorage.getItem('token'));
  const profileQuery = useQuery({ queryKey: ['profile', 'me'], queryFn: loadProfile, enabled: authenticated, retry: false, staleTime: 30_000 });
  const levelsQuery = useQuery({ queryKey: ['vip', 'levels'], queryFn: loadVipLevels, retry: false, staleTime: 60_000 });
  const profile = profileQuery.data;
  const vip = profile?.vip;
  const referral = profile?.referral;
  const progressPercent = useMemo(() => {
    if (!vip) return 0;
    const progress = Number(vip.progress);
    const threshold = Number(vip.threshold);
    if (!Number.isFinite(progress) || !Number.isFinite(threshold) || threshold <= 0) return vip.level === 0 ? 0 : 100;
    return Math.max(0, Math.min(100, (progress / threshold) * 100));
  }, [vip]);

  const copyReferral = async () => {
    if (!referral?.referralCode) return;
    const url = `${window.location.origin}/?ref=${encodeURIComponent(referral.referralCode)}`;
    await navigator.clipboard.writeText(url);
    toast.success('Referral link copied.');
  };

  if (!authenticated) return <PageShell><DataStatePanel state="UNAVAILABLE" title="Connect and verify your wallet to load your NEXI profile" /></PageShell>;
  if (profileQuery.isPending) return <PageShell><DataStatePanel state="LOADING" title="Loading NEXI profile" /></PageShell>;
  if (profileQuery.isError || !profile) return <PageShell><DataStatePanel state="ERROR" title="Profile authority unavailable" /></PageShell>;

  return <PageShell><PageHeader eyebrow="Wallet-native identity" title="Profile, VIP & Referral" description="One verified Ethereum wallet maps to one NEXI account, stable public NEXI User ID, profile, KYC, Referral identity, and VIP state." /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
    <Panel><PanelHeading title="NEXI profile" action={<UserRound size={18} className="text-[#48C0CC]" />} /><div className="grid gap-3 sm:grid-cols-2"><Metric label="NEXI User ID" value={profile.id} /><Metric label="Wallet address" value={authoritativeValue(profile.walletAddress)} /><Metric label="Chain ID" value={authoritativeValue(profile.chainId)} /><Metric label="Display name" value={authoritativeValue(profile.displayName)} /><Metric label="Email" value={authoritativeValue(profile.email)} /><Metric label="Country" value={authoritativeValue(profile.country)} /></div></Panel>
    <Panel><PanelHeading title="Identity status" action={<ShieldCheck size={18} className="text-[#48C0CC]" />} /><div className="space-y-3"><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">Wallet authentication</span><StatusBadge state={profile.walletAddress ? 'LIVE' : 'UNAVAILABLE'} /></div><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">KYC</span><StatusBadge state={profile.kycStatus} /></div><div className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-4"><span className="text-sm text-[#C3BBD0]">Account state</span><StatusBadge state="LIVE" /></div></div></Panel>
    <Panel><PanelHeading title="VIP" action={<Crown size={18} className="text-[#A995FF]" />} /><div className="rounded-xl border border-[#2B2037] bg-[#171022] p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-[#8C8299]">Current level</p><p className="mt-1 text-xl font-semibold text-white">VIP {vip.level} · {vip.name}</p></div><span className="font-mono text-sm text-[#A995FF]">{vip.progress}</span></div><div className="mt-4 h-2 rounded-full bg-[#2B2037]"><div className="h-2 rounded-full bg-[#8B5CF6]" style={{ width: `${progressPercent}%` }} /></div><div className="mt-3 flex justify-between text-xs text-[#8C8299]"><span>Progress {vip.progress}</span><span>Threshold {vip.threshold}</span></div></div>{levelsQuery.data?.length ? <div className="mt-3 flex gap-2 overflow-x-auto">{levelsQuery.data.map((level)=><div key={level.id} className={`min-w-32 rounded-xl border p-3 ${level.level===vip.level?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037] bg-[#171022]'}`}><p className="text-xs text-[#8C8299]">VIP {level.level}</p><p className="font-semibold text-white">{level.name}</p><p className="mt-1 text-xs text-[#C3BBD0]">{level.threshold}</p></div>)}</div> : null}</Panel>
    <Panel><PanelHeading title="Referral" action={<UsersRound size={18} className="text-[#48C0CC]" />} /><div className="grid gap-3 sm:grid-cols-2"><Metric label="Referral code" value={referral.referralCode} /><Metric label="Invited users" value={referral.referralCount} /><Metric label="Referral earnings" value={referral.totalEarnings} /><Metric label="Referred by" value={authoritativeValue(referral.referredByUserCode)} /></div><button type="button" onClick={()=>void copyReferral()} className="mt-4 min-h-11 rounded-xl border border-violet-300/25 bg-[#2A1742] px-4 text-sm font-semibold text-white"><Copy size={16} className="mr-2 inline" />Copy referral link</button></Panel>
  </main></PageShell>;
}
