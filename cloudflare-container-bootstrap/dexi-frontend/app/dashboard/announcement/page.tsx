'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, CalendarDays, Megaphone, Search } from 'lucide-react';
import api from '../../lib/api';
import { authoritativeValue } from '../../lib/product-states';
import { DataStatePanel, inputClass, PageHeader, PageShell, Panel, PanelHeading, SecondaryButton, TabButton } from '../wallet/components/ProductPrimitives';

type RecordValue = Record<string, unknown>;
const categories = ['All', 'Product', 'System', 'Education'];

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
  const filtered = useMemo(() => items.filter((item) => (category === 'All' || authoritativeValue(item.category) === category) && `${authoritativeValue(item.title)} ${authoritativeValue(item.excerpt)}`.toLowerCase().includes(query.toLowerCase())), [items, category, query]);
  return <PageShell><PageHeader eyebrow="Content center" title="Announcements" description="Published, scheduled, archived, and read state are managed by the content backend." action={<SecondaryButton onClick={() => void loadAnnouncements()}>Refresh</SecondaryButton>} /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"><Panel className={selected ? 'hidden lg:block' : 'block'}><PanelHeading title="Announcement directory" description="No historical or promotional records are hardcoded in this route." /><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#8C8299]" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search announcements" aria-label="Search announcements" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Announcement categories">{categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}</div><div className="mt-5">{state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading published content" />}{state === 'UNAVAILABLE' && <DataStatePanel state="UNAVAILABLE" title="Announcement service unavailable" message="The current backend does not expose a public announcement directory." />}{state === 'ERROR' && <DataStatePanel state="ERROR" title="Announcement service error" />}{state === 'LIVE' && filtered.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No published announcements returned" message="The content service returned no records matching this filter." />}{state === 'LIVE' && filtered.length > 0 && <div className="space-y-3">{filtered.map((item) => <button type="button" key={String(item.id)} onClick={() => setSelected(item)} className="nexi-interactive nexi-ripple block w-full rounded-xl border border-[#2B2037] bg-[#171022] p-4 text-left hover:border-[#49335E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs uppercase tracking-[0.1em] text-[#48C0CC]">{authoritativeValue(item.category)}</span><span className="text-xs text-[#8C8299]"><CalendarDays size={13} className="mr-1 inline" />{authoritativeValue(item.publishedAt)}</span></div><h2 className="mt-3 font-semibold">{authoritativeValue(item.title)}</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{authoritativeValue(item.excerpt)}</p></button>)}</div>}</div></Panel><aside className={selected ? 'block' : 'hidden lg:block'}><Panel><PanelHeading title="Announcement detail" action={<Bookmark size={18} className="text-[#8C8299]" />} />{selected ? <article><button type="button" onClick={() => setSelected(null)} className="nexi-interactive nexi-ripple mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#A995FF] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] lg:hidden" aria-label="Back to announcements"><ArrowLeft size={16} /> Back to announcements</button><div className="flex items-center gap-2 text-xs text-[#8C8299]"><Megaphone size={15} className="text-[#48C0CC]" />{authoritativeValue(selected.category)} · {authoritativeValue(selected.publishedAt)}</div><h2 className="mt-4 text-xl font-semibold">{authoritativeValue(selected.title)}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#C3BBD0]">{authoritativeValue(selected.body || selected.content || selected.excerpt)}</p><p className="mt-5 text-xs text-[#8C8299]">Read state: {authoritativeValue(selected.readState)}</p></article> : <DataStatePanel state="UNAVAILABLE" title="Select a published announcement" message="Detail content and read state appear only from the backend." />}</Panel></aside></main></PageShell>;
}
