'use client';

import { useEffect, useState } from 'react';
import { Bell, Globe2, LogOut, MonitorSmartphone, Palette, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import { SUPPORTED_LOCALES, type LocaleCode } from '../../state/locale';
import { useLocale } from '../../state/LocaleProvider';
import { loadCurrentUser, type WalletProfile, clearWalletSession } from '../../lib/wallet-auth';
import { DataStatePanel, Field, inputClass, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, TabButton } from '../wallet/components/ProductPrimitives';

const tabs = ['profile', 'security', 'notifications', 'language', 'wallet', 'session', 'appearance', 'about'] as const;
type Tab = typeof tabs[number];
type Preferences = { locale: string; timezone: string; theme: string; notificationSettings: Record<string, boolean> | null; tradingSettings: Record<string, unknown> | null };
type Session = { id: string; createdAt: string; lastUsedAt: string; absoluteExpiresAt: string; idleExpiresAt: string; revokedAt?: string | null; revokeReason?: string | null };
const notificationKeys = ['tradeEvents', 'walletEvents', 'securityEvents', 'productAnnouncements'] as const;
const notificationLabels: Record<typeof notificationKeys[number], string> = { tradeEvents: 'Trade events', walletEvents: 'Wallet events', securityEvents: 'Security events', productAnnouncements: 'Product announcements' };

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [kyc, setKyc] = useState<Record<string, unknown> | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('PASSPORT');
  const [documentUrl, setDocumentUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'LOADING'|'LIVE'|'ERROR'|'UNAVAILABLE'>('LOADING');
  const { locale, setLocale } = useLocale();

  const load = async () => {
    if (!localStorage.getItem('token')) { setState('UNAVAILABLE'); return; }
    setState('LOADING');
    try {
      const [me, pref, kycStatus, sessionList] = await Promise.all([
        loadCurrentUser(),
        api.get<Preferences>('/auth/preferences').then((r)=>r.data),
        api.get('/kyc/status').then((r)=>r.data),
        api.get<Session[]>('/auth/sessions').then((r)=>r.data),
      ]);
      setProfile(me); setDisplayName(me.displayName ?? ''); setEmail(me.email ?? '');
      setPreferences(pref); setKyc(kycStatus); setSessions(Array.isArray(sessionList) ? sessionList : []); setState('LIVE');
    } catch { setState('ERROR'); }
  };
  useEffect(() => { void load(); }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { const response = await api.patch<WalletProfile>('/auth/me', { displayName: displayName.trim() || undefined, email: email.trim() || undefined }); setProfile(response.data); toast.success('Profile saved.'); }
    catch { toast.error('Profile could not be saved.'); } finally { setBusy(false); }
  };
  const submitKyc = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { const response = await api.post('/kyc/submit', { firstName, lastName, dob, country, documentType, documentUrl }); setKyc(response.data); toast.success('KYC submitted for review.'); }
    catch { toast.error('KYC submission could not be accepted.'); } finally { setBusy(false); }
  };
  const patchPreferences = async (patch: Partial<Preferences>) => {
    setBusy(true);
    try { const response = await api.patch<Preferences>('/auth/preferences', patch); setPreferences(response.data); if (response.data.locale) setLocale(response.data.locale as LocaleCode); toast.success('Preference saved.'); }
    catch { toast.error('Preference could not be saved.'); } finally { setBusy(false); }
  };
  const revokeSession = async (id: string) => { try { await api.post(`/auth/sessions/${encodeURIComponent(id)}/revoke`); await load(); toast.success('Session revoked.'); } catch { toast.error('Session could not be revoked.'); } };
  const logoutAll = async () => { try { await api.post('/auth/logout-all'); } finally { clearWalletSession(); window.location.assign('/'); } };

  const kycStatus = typeof kyc?.status === 'string' ? kyc.status : 'NOT_SUBMITTED';
  if (state === 'LOADING') return <PageShell><DataStatePanel state="LOADING" title="Loading account settings" /></PageShell>;
  if (state !== 'LIVE' || !profile || !preferences) return <PageShell><DataStatePanel state={state} title={state === 'UNAVAILABLE' ? 'Sign in to manage settings' : 'Account settings unavailable'} /></PageShell>;

  return <PageShell><PageHeader eyebrow="Account" title="Settings" description="Profile, identity verification, sessions, notifications, locale and appearance are synchronized with the authenticated backend contract." /><main className="mx-auto min-w-0 max-w-7xl"><div className="mb-4 flex min-w-0 gap-2 overflow-x-auto pb-1" role="tablist">{tabs.map((item)=><TabButton key={item} active={tab===item} onClick={()=>setTab(item)}>{item[0].toUpperCase()+item.slice(1)}</TabButton>)}</div>
  {tab==='profile'&&<div className="grid gap-4 lg:grid-cols-2"><Panel><PanelHeading title="Profile" action={<UserRound size={18}/>} /><form onSubmit={saveProfile} className="space-y-3"><Field label="NEXI User ID"><input className={inputClass} value={profile.id} readOnly /></Field><Field label="Display name"><input className={inputClass} value={displayName} onChange={(e)=>setDisplayName(e.target.value)} /></Field><Field label="Email"><input className={inputClass} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></Field><PrimaryButton type="submit" disabled={busy}>Save profile</PrimaryButton></form></Panel><Panel><PanelHeading title="Identity verification" action={<ShieldCheck size={18}/>} /><p className="mb-4 text-sm text-[#C3BBD0]">Status: <strong>{kycStatus}</strong></p>{kycStatus!=='APPROVED'&&kycStatus!=='PENDING'&&<form onSubmit={submitKyc} className="space-y-3"><Field label="First name"><input className={inputClass} value={firstName} onChange={(e)=>setFirstName(e.target.value)} required /></Field><Field label="Last name"><input className={inputClass} value={lastName} onChange={(e)=>setLastName(e.target.value)} required /></Field><Field label="Date of birth"><input className={inputClass} type="date" value={dob} onChange={(e)=>setDob(e.target.value)} required /></Field><Field label="Country"><input className={inputClass} value={country} onChange={(e)=>setCountry(e.target.value)} required /></Field><Field label="Document type"><select className={inputClass} value={documentType} onChange={(e)=>setDocumentType(e.target.value)}><option>PASSPORT</option><option>ID_CARD</option><option>DRIVERS_LICENSE</option></select></Field><Field label="Document URL"><input className={inputClass} type="url" value={documentUrl} onChange={(e)=>setDocumentUrl(e.target.value)} placeholder="https://…" required /></Field><PrimaryButton type="submit" disabled={busy}>Submit for verification</PrimaryButton></form>}</Panel></div>}
  {tab==='security'&&<Panel><PanelHeading title="Security" action={<ShieldCheck size={18}/>} /><p className="text-sm text-[#C3BBD0]">Ethereum wallet sign-in uses a server-issued SIWE challenge, exact wallet signature verification, rotating sessions, and revocation. Password/2FA management remains separate from the wallet-auth contract.</p></Panel>}
  {tab==='notifications'&&<Panel><PanelHeading title="Notifications" action={<Bell size={18}/>} /><div className="space-y-3">{notificationKeys.map((key)=><label key={key} className="flex min-h-12 items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3"><span>{notificationLabels[key]}</span><input type="checkbox" checked={Boolean(preferences.notificationSettings?.[key])} onChange={(e)=>void patchPreferences({ notificationSettings: { ...(preferences.notificationSettings??{}), [key]:e.target.checked } })} /></label>)}</div></Panel>}
  {tab==='language'&&<Panel><PanelHeading title="Language" action={<Globe2 size={18}/>} /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SUPPORTED_LOCALES.map((item)=><button type="button" key={item.code} onClick={()=>void patchPreferences({locale:item.code})} className={`min-h-12 rounded-xl border px-3 text-left ${locale===item.code?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037] bg-[#171022]'}`}><span className="block font-semibold">{item.label}</span><span className="text-xs text-[#8C8299]">{item.code}</span></button>)}</div></Panel>}
  {tab==='wallet'&&<Panel><PanelHeading title="Connected Ethereum wallet" /><div className="grid gap-3 sm:grid-cols-3"><p className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">Address<br/><span className="break-all font-mono text-xs">{profile.walletAddress??'—'}</span></p><p className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">Chain ID<br/><span className="font-mono">{profile.chainId??'—'}</span></p><p className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-sm">KYC<br/><span className="font-mono">{profile.kycStatus}</span></p></div></Panel>}
  {tab==='session'&&<Panel><PanelHeading title="Sessions" action={<MonitorSmartphone size={18}/>} /><div className="space-y-2">{sessions.map((session)=><div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2B2037] bg-[#171022] p-3"><div><p className="font-mono text-xs">{session.id}</p><p className="text-xs text-[#8C8299]">Last used {new Date(session.lastUsedAt).toLocaleString()} {session.revokedAt?'· revoked':''}</p></div><button type="button" disabled={Boolean(session.revokedAt)} onClick={()=>void revokeSession(session.id)} className="min-h-10 rounded-lg border border-[#2B2037] px-3 text-xs disabled:opacity-40">Revoke</button></div>)}</div><button type="button" onClick={()=>void logoutAll()} className="mt-4 min-h-11 rounded-xl border border-[#FF748A]/40 px-4 text-sm text-[#FFB6C2]"><LogOut size={16} className="mr-2 inline"/>Log out all sessions</button></Panel>}
  {tab==='appearance'&&<Panel><PanelHeading title="Appearance" action={<Palette size={18}/>} /><div className="flex gap-2"><button type="button" onClick={()=>void patchPreferences({theme:'dark'})} className={`min-h-11 rounded-xl border px-4 ${preferences.theme==='dark'?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037]'}`}>Dark</button><button type="button" onClick={()=>void patchPreferences({theme:'system'})} className={`min-h-11 rounded-xl border px-4 ${preferences.theme==='system'?'border-[#8B5CF6] bg-[#2A1742]':'border-[#2B2037]'}`}>System</button></div></Panel>}
  {tab==='about'&&<Panel><PanelHeading title="About NEXI" /><p className="text-sm text-[#C3BBD0]">NEXI Public · authenticated REST and Socket.IO client. Runtime release metadata is supplied by the platform environment.</p></Panel>}
  </main></PageShell>;
}
