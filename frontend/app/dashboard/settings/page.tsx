'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Globe2, LogOut, MonitorSmartphone, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { SUPPORTED_LOCALES, type LocaleCode } from '../../state/locale';
import { useLocale } from '../../state/LocaleProvider';
import { type VipProfile, type WalletProfile, clearWalletSession, sessionPrincipalId } from '../../lib/wallet-auth';
import { recoverPublicSession } from '../../lib/api';
import { DataStatePanel, Field, inputClass, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, TabButton } from '../../components/PagePrimitives';
import SafeBackButton from '../../components/SafeBackButton';
import WalletConnectControl from '../../components/WalletConnectControl';

const tabs = ['profile', 'security', 'notifications', 'about'] as const;
type Tab = typeof tabs[number];
type Preferences = { locale: string; timezone: string; theme: string; notificationSettings: Record<string, boolean> | null; tradingSettings: Record<string, unknown> | null };
type Session = { id: string; createdAt: string; lastUsedAt: string; absoluteExpiresAt: string; idleExpiresAt: string; revokedAt?: string | null; revokeReason?: string | null };
type SecurityState = { passwordSet: boolean; mfa: { enabled: boolean; hasSecret: boolean; hasBackupCodes: boolean } };
const notificationKeys = ['tradeEvents', 'walletEvents', 'securityEvents', 'productAnnouncements'] as const;
const notificationLabels: Record<typeof notificationKeys[number], string> = { tradeEvents: 'Trade events', walletEvents: 'Wallet events', securityEvents: 'Security events', productAnnouncements: 'Product announcements' };

type VipBenefitRow = { label: string; value: string };

function displayVipBenefit(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value) ?? ''; } catch { return ''; }
  }
  return String(value);
}

function vipBenefitRows(benefits: unknown): VipBenefitRow[] {
  const entries = typeof benefits === 'string'
    ? [['Benefit', benefits] as const]
    : Array.isArray(benefits)
      ? benefits.map((value, index) => [`Benefit ${index + 1}`, value] as const)
      : benefits && typeof benefits === 'object'
        ? Object.entries(benefits)
        : [];
  return entries.flatMap(([key, rawValue]) => {
    const value = displayVipBenefit(rawValue);
    if (!value) return [];
    const label = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
    return [{ label: label ? label[0].toUpperCase() + label.slice(1) : 'Benefit', value }];
  });
}

function VipProgress({ progress, threshold }: { progress: string; threshold: string }) {
  const current = Number(progress);
  const maximum = Number(threshold);
  const measurable = Number.isFinite(current) && current >= 0 && Number.isFinite(maximum) && maximum > 0;
  const value = measurable ? Math.min(current, maximum) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[#C3BBD0]">Progress</span>
        <span className="font-mono tabular-nums text-white">{progress} / {threshold}</span>
      </div>
      {measurable && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="VIP progress" aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={value} aria-valuetext={`${progress} / ${threshold}`}>
          <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${(value / maximum) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

function VipBenefits({ benefits }: { benefits: unknown }) {
  const rows = vipBenefitRows(benefits);
  return (
    <div>
      <h3 className="text-sm font-medium text-white">Benefits</h3>
      {rows.length ? (
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {rows.map((benefit) => (
            <div key={benefit.label} className="min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] p-3">
              <dt className="text-xs text-[#8C8299]">{benefit.label}</dt>
              <dd className="mt-1 break-words text-sm text-[#F5F7FB]">{benefit.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-[#8C8299]">No benefits are currently supplied.</p>
      )}
    </div>
  );
}

function VipMembershipPanel({ vip }: { vip: VipProfile | null | undefined }) {
  return (
    <Panel className="min-w-0">
      <PanelHeading title="VIP membership" />
      {vip ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-[#8C8299]">Current level</p>
            <p className="mt-1 font-semibold text-white">Level {vip.level}{vip.name.trim() ? ` · ${vip.name.trim()}` : ''}</p>
          </div>
          <VipProgress progress={vip.progress} threshold={vip.threshold} />
          <VipBenefits benefits={vip.benefits} />
        </div>
      ) : (
        <p className="text-sm text-[#8C8299]">VIP details are unavailable.</p>
      )}
    </Panel>
  );
}

async function copyReferralInviteLink(referralCode: string) {
  if (!navigator.clipboard?.writeText) {
    toast.error('Invite link could not be copied in this browser.');
    return;
  }
  const invite = new URL('/signup', window.location.origin);
  invite.searchParams.set('ref', referralCode);
  try {
    await navigator.clipboard.writeText(invite.toString());
    toast.success('Referral invite link copied.');
  } catch {
    toast.error('Referral invite link could not be copied.');
  }
}

type ReferralAttributionHistoryItem = { referredUserCode: number; status: string; attributedAt: string | null };
type ReferralRewardHistoryItem = { id: string; referredUserCode: number; amount: string; asset: string; status: string; rewardedAt: string };
type ReferralHistoryPage<T> = { items: T[]; limit: number; offset: number; hasMore: boolean };
type ReferralHistoryResponse = {
  referrals: ReferralHistoryPage<ReferralAttributionHistoryItem>;
  rewards: ReferralHistoryPage<ReferralRewardHistoryItem>;
};

const REFERRAL_HISTORY_PAGE_SIZE = 25;

function referralHistoryDate(value: string | null) {
  if (!value) return 'Date unavailable';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function referralStatusLabel(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, ' ');
}

function ReferralHistoryPanel() {
  const [history, setHistory] = useState<ReferralHistoryResponse | null>(null);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'ERROR' | 'UNAVAILABLE'>('LOADING');
  const offsetRef = useRef(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setState('LOADING');
      setHistory(null);
      offsetRef.current = 0;
      if (!sessionPrincipalId()) {
        setState('UNAVAILABLE');
        return;
      }
      try {
        const response = await api.get<ReferralHistoryResponse>('/referral/history', {
          params: { limit: REFERRAL_HISTORY_PAGE_SIZE, offset: 0 },
        });
        if (!active) return;
        setHistory(response.data);
        offsetRef.current = REFERRAL_HISTORY_PAGE_SIZE;
        setState('LIVE');
      } catch {
        if (active) setState('ERROR');
      }
    };
    void load();
    return () => { active = false; };
  }, [reload]);

  const loadMore = async () => {
    if (!history || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    const requestOffset = offsetRef.current;
    try {
      const response = await api.get<ReferralHistoryResponse>('/referral/history', {
        params: { limit: REFERRAL_HISTORY_PAGE_SIZE, offset: requestOffset },
      });
      setHistory((current) => current ? {
        referrals: {
          ...response.data.referrals,
          items: [...current.referrals.items, ...response.data.referrals.items],
        },
        rewards: {
          ...response.data.rewards,
          items: [...current.rewards.items, ...response.data.rewards.items],
        },
      } : response.data);
      offsetRef.current = requestOffset + REFERRAL_HISTORY_PAGE_SIZE;
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Panel className="min-w-0">
      <PanelHeading title="Referral history" />
      {state === 'LOADING' && <p className="text-sm text-[#8C8299]" role="status">Loading referral history…</p>}
      {state === 'UNAVAILABLE' && <p className="text-sm text-[#8C8299]">Connect and verify your wallet to view referral history.</p>}
      {state === 'ERROR' && (
        <div className="space-y-3">
          <p className="text-sm text-[#C3BBD0]" role="alert">Referral history could not be loaded.</p>
          <button type="button" onClick={() => setReload((value) => value + 1)} className="min-h-11 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">Retry</button>
        </div>
      )}
      {state === 'LIVE' && history && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <section aria-labelledby="referral-attribution-history-title" className="min-w-0">
              <h3 id="referral-attribution-history-title" className="text-sm font-medium text-white">Referred accounts</h3>
              {history.referrals.items.length ? (
                <ul className="mt-3 space-y-2">
                  {history.referrals.items.map((item) => (
                    <li key={item.referredUserCode} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-sm text-white">NEXI user {item.referredUserCode}</span>
                        <span className="text-xs capitalize text-[#C3BBD0]">{referralStatusLabel(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#8C8299]">Attributed: {referralHistoryDate(item.attributedAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#8C8299]">No referred accounts yet.</p>
              )}
            </section>
            <section aria-labelledby="referral-reward-history-title" className="min-w-0">
              <h3 id="referral-reward-history-title" className="text-sm font-medium text-white">Reward history</h3>
              {history.rewards.items.length ? (
                <ul className="mt-3 space-y-2">
                  {history.rewards.items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="break-all font-mono text-sm tabular-nums text-white">{item.amount} {item.asset}</span>
                        <span className="text-xs capitalize text-[#C3BBD0]">{referralStatusLabel(item.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#8C8299]">From NEXI user {item.referredUserCode} · {referralHistoryDate(item.rewardedAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#8C8299]">No referral rewards have been recorded.</p>
              )}
            </section>
          </div>
          {loadMoreError && <p className="text-sm text-[#FCA5A5]" role="alert">More history could not be loaded.</p>}
          {(history.referrals.hasMore || history.rewards.hasMore) && (
            <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="min-h-11 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-white disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">
              {loadingMore ? 'Loading…' : 'Load more history'}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

function ReferralMembershipPanel({ referral }: { referral: WalletProfile['referral'] }) {
  return (
    <Panel className="min-w-0">
      <PanelHeading title="Referral program" />
      {referral ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[#8C8299]">Your referral code</p>
              <p className="mt-1 break-all font-mono text-sm text-white">{referral.referralCode}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyReferralInviteLink(referral.referralCode)}
              className="min-h-11 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm text-white transition-colors hover:bg-violet-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]"
            >
              Copy invite link
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] p-3">
              <dt className="text-xs text-[#8C8299]">Referred accounts</dt>
              <dd className="mt-1 font-mono tabular-nums text-white">{referral.referralCount}</dd>
            </div>
            <div className="min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] p-3">
              <dt className="text-xs text-[#8C8299]">Referral earnings</dt>
              <dd className="mt-1 break-all font-mono tabular-nums text-white">{referral.totalEarnings}</dd>
            </div>
          </dl>
          <p className="text-xs text-[#C3BBD0]">
            Referred by: {referral.referredByUserCode === null ? 'None' : `NEXI user ${referral.referredByUserCode}`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[#8C8299]">Referral details are unavailable.</p>
      )}
    </Panel>
  );
}

function SessionsPanel({ sessions, onRevoke, onLogoutAll }: { sessions: Session[]; onRevoke: (id: string) => void; onLogoutAll: () => void }) {
  return <Panel><PanelHeading title="Sessions" action={<MonitorSmartphone size={18}/>} /><div className="space-y-2">{sessions.map((session)=><div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B2037] bg-[#171022] p-3"><div><p className="font-mono text-xs">{session.id}</p><p className="text-xs text-[#8C8299]">Last used {new Date(session.lastUsedAt).toLocaleString()} {session.revokedAt?'· revoked':''}</p></div><button type="button" disabled={Boolean(session.revokedAt)} onClick={()=>onRevoke(session.id)} className="min-h-10 rounded-lg border border-[#2B2037] px-3 text-xs disabled:opacity-40">Revoke</button></div>)}</div><button type="button" onClick={onLogoutAll} className="mt-4 min-h-11 rounded-xl border border-[#FF748A]/40 px-4 text-sm text-[#FFB6C2]"><LogOut size={16} className="mr-2 inline"/>Log out all sessions</button></Panel>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaLabel, setMfaLabel] = useState('NEXI account');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [kyc, setKyc] = useState<Record<string, unknown> | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [frontDocument, setFrontDocument] = useState<File | null>(null);
  const [backDocument, setBackDocument] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'LOADING'|'LIVE'|'ERROR'|'UNAVAILABLE'>('LOADING');
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && tabs.includes(requestedTab as Tab)) setTab(requestedTab as Tab);
  }, [searchParams]);

  const load = async () => {
    if (!sessionPrincipalId()) { setState('UNAVAILABLE'); return; }
    setState('LOADING');
    try {
      const [me, pref, kycStatus, sessionList, securityStatus] = await Promise.all([
        api.get<WalletProfile>('/auth/me').then((r) => r.data),
        api.get<Preferences>('/auth/preferences').then((r)=>r.data),
        api.get('/kyc/status').then((r)=>r.data),
        api.get<Session[]>('/auth/sessions').then((r)=>r.data),
        api.get<SecurityState>('/auth/security/status').then((r)=>r.data),
      ]);
      setProfile(me); setDisplayName(me.displayName ?? ''); setEmail(me.email ?? '');
      setPreferences(pref); setKyc(kycStatus); setSessions(Array.isArray(sessionList) ? sessionList : []); setSecurity(securityStatus); setState('LIVE');
    } catch { setState('ERROR'); }
  };
  useEffect(() => {
    const initialize = async () => { await recoverPublicSession(); await load(); };
    void initialize();
    const onSession = () => void load();
    window.addEventListener('nexi:wallet-session', onSession);
    return () => window.removeEventListener('nexi:wallet-session', onSession);
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { const response = await api.patch<WalletProfile>('/auth/me', { displayName: displayName.trim() || undefined, email: email.trim() || undefined }); setProfile(response.data); toast.success('Profile saved.'); }
    catch { toast.error('Profile could not be saved.'); } finally { setBusy(false); }
  };
  const submitKyc = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!frontDocument) { toast.error('Choose the front of your identity document.'); return; }
    setBusy(true);
    try {
      const upload = async (file: File) => (await api.post<{ evidenceId: string }>('/kyc/evidence', file, { headers: { 'Content-Type': file.type } })).data.evidenceId;
      const frontEvidenceId = await upload(frontDocument);
      const backEvidenceId = backDocument ? await upload(backDocument) : undefined;
      const response = await api.post('/kyc/submit', { firstName, lastName, dob, country, documentType, frontEvidenceId, ...(backEvidenceId ? { backEvidenceId } : {}) });
      setKyc(response.data); setFrontDocument(null); setBackDocument(null); toast.success('KYC submitted for review.');
    } catch { toast.error('KYC submission could not be accepted.'); } finally { setBusy(false); }
  };
  const patchPreferences = async (patch: Partial<Preferences>) => {
    setBusy(true);
    try { const response = await api.patch<Preferences>('/auth/preferences', patch); setPreferences(response.data); if (response.data.locale) setLocale(response.data.locale as LocaleCode); toast.success('Preference saved.'); }
    catch { toast.error('Preference could not be saved.'); } finally { setBusy(false); }
  };
  const saveSecurityPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await api.post('/auth/security/password/change', { newSecurityPassword: newPassword, ...(security?.passwordSet ? { currentSecurityPassword: currentPassword } : {}) });
      setCurrentPassword(''); setNewPassword(''); setSecurity((value) => value ? { ...value, passwordSet: true } : value);
      clearWalletSession(); toast.success('Security password saved. Please verify your wallet again.'); router.replace('/login');
    } catch { toast.error('Security password could not be saved.'); } finally { setBusy(false); }
  };
  const setupMfa = async () => {
    setBusy(true);
    try { const response = await api.post<{ secret: string; uri: string }>('/auth/security/mfa/setup', { label: mfaLabel }); setMfaSetup(response.data); toast.success('MFA setup created. Verify a code to enable it.'); }
    catch { toast.error('MFA setup could not be created.'); } finally { setBusy(false); }
  };
  const verifyMfa = async () => {
    setBusy(true);
    try { await api.post('/auth/security/mfa/verify', { token: mfaToken }); setMfaSetup(null); setMfaToken(''); await load(); toast.success('MFA enabled.'); }
    catch { toast.error('MFA code is invalid.'); } finally { setBusy(false); }
  };
  const generateBackupCodes = async () => {
    setBusy(true);
    try { const response = await api.post<{ codes: string[] }>('/auth/security/mfa/backup-codes', {}); setBackupCodes(response.data.codes); await load(); toast.success('New recovery codes generated.'); }
    catch { toast.error('Recovery codes could not be generated.'); } finally { setBusy(false); }
  };
  const disableMfa = async () => {
    setBusy(true);
    try { await api.post('/auth/security/mfa/disable', { securityPassword: mfaPassword, token: mfaToken }); setMfaPassword(''); setMfaToken(''); await load(); toast.success('MFA disabled.'); }
    catch { toast.error('MFA could not be disabled.'); } finally { setBusy(false); }
  };
  const revokeSession = async (id: string) => { try { await api.post(`/auth/sessions/${encodeURIComponent(id)}/revoke`); await load(); toast.success('Session revoked.'); } catch { toast.error('Session could not be revoked.'); } };
  const logoutAll = async () => { try { await api.post('/auth/logout-all'); } finally { clearWalletSession(); router.replace('/'); } };

  const kycStatus = typeof kyc?.status === 'string' ? kyc.status : 'NOT_SUBMITTED';
  if (state === 'LOADING') return <PageShell><DataStatePanel state="LOADING" title="Loading account settings" /></PageShell>;
  if (state === 'UNAVAILABLE') return <PageShell><div className="mx-auto max-w-xl pt-8 sm:pt-14"><Panel className="p-5 text-center sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">Protected account</p><h1 className="mt-2 text-xl font-semibold text-white">Verify your Ethereum wallet</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8C8299]">Profile, KYC, security, sessions and account preferences require an authenticated NEXI wallet session.</p><div className="mx-auto mt-5 max-w-xs"><WalletConnectControl compact /></div></Panel></div></PageShell>;
  if (state !== 'LIVE' || !profile || !preferences || !security) return <PageShell><DataStatePanel state={state} title="Account settings unavailable" /></PageShell>;

  return <PageShell><div className="mb-4"><SafeBackButton fallback="/dashboard" label="Back to Dashboard" /></div><PageHeader eyebrow="Account" title="Settings" description="Manage profile, identity verification, sessions, notifications, locale and appearance." /><main className="mx-auto min-w-0 max-w-7xl"><div className="mb-4 flex min-w-0 gap-2 overflow-x-auto pb-1" role="tablist">{tabs.map((item)=><TabButton key={item} active={tab===item} onClick={()=>setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</TabButton>)}</div>
  {tab==='profile'&&<div className="grid gap-4 lg:grid-cols-2"><Panel><PanelHeading title="Connected wallet" /><div className="grid gap-3 sm:grid-cols-3"><p className="min-w-0 rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">Address<br/><span className="break-all font-mono text-xs">{profile.walletAddress??'—'}</span></p><p className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">Chain ID<br/><span className="font-mono">{profile.chainId??'—'}</span></p><p className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">KYC<br/><span className="font-mono">{profile.kycStatus}</span></p></div></Panel><Panel><PanelHeading title="Preferences" action={<Globe2 size={18}/>} /><p className="mb-2 text-xs text-[#8C8299]">Language</p><div className="grid gap-2 sm:grid-cols-2">{SUPPORTED_LOCALES.map((item)=><button type="button" key={item.code} onClick={()=>void patchPreferences({locale:item.code})} className={`min-h-11 rounded-xl border px-3 text-left text-sm ${locale===item.code?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037] bg-[#171022]'}`}><span className="font-semibold">{item.label}</span><span className="ml-2 text-xs text-[#8C8299]">{item.code}</span></button>)}</div><p className="mb-2 mt-4 text-xs text-[#8C8299]">Appearance</p><div className="flex gap-2"><button type="button" onClick={()=>void patchPreferences({theme:'dark'})} className={`min-h-11 rounded-xl border px-4 ${preferences.theme==='dark'?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037]'}`}>Dark</button><button type="button" onClick={()=>void patchPreferences({theme:'system'})} className={`min-h-11 rounded-xl border px-4 ${preferences.theme==='system'?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037]'}`}>System</button></div></Panel><Panel><PanelHeading title="Profile" action={<UserRound size={18}/>} /><form onSubmit={saveProfile} className="space-y-3"><Field label="NEXI User ID"><input className={inputClass} value={profile.id} readOnly /></Field><Field label="Display name"><input className={inputClass} value={displayName} onChange={(e)=>setDisplayName(e.target.value)} /></Field><Field label="Email"><input className={inputClass} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></Field><PrimaryButton type="submit" disabled={busy}>Save profile</PrimaryButton></form></Panel><Panel><PanelHeading title="Identity verification" action={<ShieldCheck size={18}/>} /><p className="mb-4 text-sm text-[#C3BBD0]">Status: <strong>{kycStatus}</strong></p>{kycStatus!=='APPROVED'&&kycStatus!=='PENDING'&&<form onSubmit={submitKyc} className="space-y-3"><Field label="First name"><input className={inputClass} value={firstName} onChange={(e)=>setFirstName(e.target.value)} required /></Field><Field label="Last name"><input className={inputClass} value={lastName} onChange={(e)=>setLastName(e.target.value)} required /></Field><Field label="Date of birth"><input className={inputClass} type="date" value={dob} onChange={(e)=>setDob(e.target.value)} required /></Field><Field label="Country"><input className={inputClass} value={country} onChange={(e)=>setCountry(e.target.value)} required /></Field><Field label="Document type"><select className={inputClass} value={documentType} onChange={(e)=>setDocumentType(e.target.value)}><option>PASSPORT</option><option>ID_CARD</option><option>DRIVERS_LICENSE</option></select></Field><Field label="Identity document front"><input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e)=>setFrontDocument(e.target.files?.[0] ?? null)} required /></Field><Field label="Identity document back (optional)"><input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e)=>setBackDocument(e.target.files?.[0] ?? null)} /></Field><p className="text-xs text-[#C3BBD0]">Private upload. JPEG, PNG, WebP or PDF up to 5 MiB per file.</p><PrimaryButton type="submit" disabled={busy}>Submit for verification</PrimaryButton></form>}</Panel><VipMembershipPanel vip={profile.vip} /><ReferralMembershipPanel referral={profile.referral} /><ReferralHistoryPanel /></div>}
  {tab==='security'&&<div className="grid gap-4 lg:grid-cols-2"><SessionsPanel sessions={sessions} onRevoke={(id)=>void revokeSession(id)} onLogoutAll={()=>void logoutAll()} /><Panel><PanelHeading title="Security password" action={<ShieldCheck size={18}/>} /><p className="mb-4 text-sm text-[#C3BBD0]">This password protects sensitive account actions. It is not a public login credential; NEXI public access remains wallet/SIWE only.</p><form onSubmit={saveSecurityPassword} className="space-y-3">{security.passwordSet&&<Field label="Current password"><input className={inputClass} type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required /></Field>}<Field label={security.passwordSet?'New security password':'Set security password'}><input className={inputClass} type="password" minLength={12} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></Field><PrimaryButton type="submit" disabled={busy}>{security.passwordSet?'Change password':'Set password'}</PrimaryButton></form></Panel><Panel><PanelHeading title="Authenticator MFA" action={<ShieldCheck size={18}/>} /><p className="mb-4 text-sm text-[#C3BBD0]">TOTP and one-time recovery codes are managed here for sensitive actions.</p>{!security.mfa.enabled&&!mfaSetup&&<div className="space-y-3"><Field label="Authenticator label"><input className={inputClass} value={mfaLabel} onChange={(e)=>setMfaLabel(e.target.value)} /></Field><PrimaryButton type="button" onClick={()=>void setupMfa()} disabled={busy}>Set up MFA</PrimaryButton></div>}{mfaSetup&&<div className="space-y-3"><p className="break-all rounded-xl border border-[#2B2037] bg-[#171022] p-3 font-mono text-xs">Secret: {mfaSetup.secret}<br />URI: {mfaSetup.uri}</p><Field label="Authenticator code"><input className={inputClass} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={mfaToken} onChange={(e)=>setMfaToken(e.target.value)} /></Field><PrimaryButton type="button" onClick={()=>void verifyMfa()} disabled={busy}>Verify and enable MFA</PrimaryButton></div>}{security.mfa.enabled&&<div className="space-y-3"><p className="text-sm text-emerald-300">MFA is enabled.</p><button type="button" onClick={()=>void generateBackupCodes()} disabled={busy} className="min-h-11 rounded-xl border border-[#2B2037] px-4 text-sm">Generate recovery codes</button><Field label="Security password"><input className={inputClass} type="password" value={mfaPassword} onChange={(e)=>setMfaPassword(e.target.value)} /></Field><Field label="TOTP or recovery code"><input className={inputClass} inputMode="numeric" value={mfaToken} onChange={(e)=>setMfaToken(e.target.value)} /></Field><button type="button" onClick={()=>void disableMfa()} disabled={busy} className="min-h-11 rounded-xl border border-[#FF748A]/40 px-4 text-sm text-[#FFB6C2]">Disable MFA</button></div>}{backupCodes.length>0&&<div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/5 p-3"><p className="text-xs text-amber-200">Store these recovery codes securely. They are shown once.</p><p className="mt-2 break-all font-mono text-xs">{backupCodes.join(' · ')}</p></div>}</Panel></div>}
  {tab==='notifications'&&<Panel><PanelHeading title="Notifications" action={<Bell size={18}/>} /><div className="space-y-3">{notificationKeys.map((key)=><label key={key} className="flex min-h-12 items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3"><span>{notificationLabels[key]}</span><input type="checkbox" checked={Boolean(preferences.notificationSettings?.[key])} onChange={(e)=>void patchPreferences({ notificationSettings: { ...(preferences.notificationSettings??{}), [key]:e.target.checked } })} /></label>)}</div></Panel>}




  {tab==='about'&&<Panel className="space-y-5"><div><PanelHeading title="About NEXI" /><p className="max-w-3xl text-sm leading-6 text-[#C3BBD0]">NEXI is a mobile-first financial application for exploring supported markets and account services through a connected wallet.</p></div><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Who We Are</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">NEXI is a digital product for wallet-authenticated market access and account services.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Mission</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Our aim is to make market and wallet workflows clear, accessible, and transparent about account and service status.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">What We Offer</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Quotes Hub covers 53 instruments across crypto, stocks, forex, and metals. Spot and isolated Margin provide charting, order entry, market depth, trades, orders, and positions where supported. Options availability, durations, and payouts use current service configuration. Wallet, Deposit, Withdrawal, Transfer, Convert, Earn, Mining, and Loans depend on account and service availability.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Security &amp; Technology</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Public account access uses wallet signature verification (SIWE). Account balances and financial activity are shown from the configured account authority; sensitive actions may require security password or authenticator MFA.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Values</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Clear information, careful handling of account access, and honest unavailable or error states guide the product experience.</p></section><section id="risk-disclosure" className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Risk Disclosure</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Digital assets and other markets can be volatile and may result in loss. Isolated margin and short-duration options involve substantial risk, including loss of the amount committed. Market data, prices, liquidity, and service availability can change; review each transaction and its displayed terms before confirming. This information is not financial advice.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Regional Availability</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Available markets and account features may vary by region, eligibility, and verification status. A disabled or unavailable service is not offered for the current account context. <a className="underline decoration-violet-300/40 underline-offset-4 hover:text-white" href="/dashboard/support">Contact Support</a> for current service and regional information.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Corporate Information</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">This page does not publish a verified legal-entity registration or regulatory authorization. Request current corporate information through Support.</p></section><section className="border-t border-[#2B2037] pt-4"><h2 className="text-sm font-semibold text-white">Help, Contact &amp; Policies</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]"><a className="underline decoration-violet-300/40 underline-offset-4 hover:text-white" href="/dashboard/support">Help Center and Contact Support</a> · <a className="underline decoration-violet-300/40 underline-offset-4 hover:text-white" href="#risk-disclosure">Risk Disclosure</a>. Request current policy documents through Support.</p></section></Panel>}
  </main></PageShell>;
}
