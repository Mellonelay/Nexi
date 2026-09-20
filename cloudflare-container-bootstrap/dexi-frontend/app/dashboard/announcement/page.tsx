'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, CalendarDays, Megaphone, Search } from 'lucide-react';
import api from '../../lib/api';
import { authoritativeValue } from '../../lib/product-states';
import { DataStatePanel, inputClass, PageHeader, PageShell, Panel, PanelHeading, SecondaryButton, TabButton } from '../wallet/components/ProductPrimitives';
import SafeBackButton from '../../components/SafeBackButton';

type RecordValue = Record<string, unknown>;
const categories = ['All'];

export default function AnnouncementPage() {
  const [items, setItems] = useState<RecordValue[]>([]);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RecordValue | null>(null);
  const announcementEndpoint = process.env.NEXT_PUBLIC_ANNOUNCEMENT_ENDPOINT || '/communications/announcements';
  const loadAnnouncements = useCallback(async () => {
    setSelected(null);
    setState('LOADING');
    if (!announcementEndpoint) {
      setItems([]);
      setState('UNAVAILABLE');
      return;
    }
    try {
      const response = await api.get(announcementEndpoint);
      setItems(Array.isArray(response.data) ? response.data : []);
      setState('LIVE');
    } catch {
      setItems([]);
      setState('ERROR');
    }
  }, [announcementEndpoint]);
  useEffect(() => { void loadAnnouncements(); }, [loadAnnouncements]);
  const filtered = useMemo(() => items.filter((item) => (category === 'All' || authoritativeValue(item.category) === category) && `${authoritativeValue(item.title)} ${authoritativeValue(item.body)}`.toLowerCase().includes(query.toLowerCase())), [items, category, query]);
  const announcementListClass = selected ? 'hidden lg:block' : 'block';
  return <PageShell><PageHeader eyebrow="Content center" title="Announcements" description="Browse published announcements from the content authority." action={<SecondaryButton onClick={() => void loadAnnouncements()}>Refresh</SecondaryButton>} /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"><Panel className={announcementListClass}><PanelHeading title="Announcement directory" description="No historical or promotional records are hardcoded in this route." /><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#8C8299]" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search announcements" aria-label="Search announcements" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Announcement categories">{categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}</div><div className="mt-5">{state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading published content" />}{state === 'UNAVAILABLE' && <DataStatePanel state="UNAVAILABLE" title="Announcement service unavailable" message="Announcements are not available right now." />}{state === 'ERROR' && <DataStatePanel state="ERROR" title="Announcement service error" />}{state === 'LIVE' && filtered.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No published announcements returned" message="The content service returned no records matching this filter." />}{state === 'LIVE' && filtered.length > 0 && <div className="space-y-3">{filtered.map((item) => <button type="button" key={String(item.id)} onClick={() => setSelected(item)} className="block w-full rounded-xl border border-[#2B2037] bg-[#171022] p-4 text-left hover:border-[#49335E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs uppercase tracking-[0.1em] text-[#48C0CC]">Published content</span><span className="text-xs text-[#8C8299]"><CalendarDays size={13} className="mr-1 inline" />{authoritativeValue(item.updatedAt || item.createdAt)}</span></div><h2 className="mt-3 font-semibold">{authoritativeValue(item.title)}</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{authoritativeValue(item.body)}</p></button>)}</div>}</div></Panel><aside><Panel><PanelHeading title="Announcement detail" action={<Bookmark size={18} className="text-[#8C8299]" />} />{selected ? <SafeBackButton onBack={() => setSelected(null)} label="Back to announcements" showLabel className="mt-2 border-transparent px-2 text-sm font-semibold text-[#A995FF]" /> : null}{selected ? <article><div className="flex items-center gap-2 text-xs text-[#8C8299]"><Megaphone size={15} className="text-[#48C0CC]" />Published content · {authoritativeValue(selected.updatedAt || selected.createdAt)}</div><h2 className="mt-4 text-xl font-semibold">{authoritativeValue(selected.title)}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#C3BBD0]">{authoritativeValue(selected.body || selected.content || selected.excerpt)}</p></article> : <DataStatePanel state="UNAVAILABLE" title="Select a published announcement" message="Announcement details will appear here when available." />}</Panel></aside></main></PageShell>;
}
