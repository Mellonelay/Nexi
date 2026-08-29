'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, BookOpen, GraduationCap, Search } from 'lucide-react';
import api from '../../lib/api';
import { authoritativeValue } from '../../lib/product-states';
import { DataStatePanel, inputClass, PageHeader, PageShell, Panel, PanelHeading, TabButton } from '../wallet/components/ProductPrimitives';

type LearnArticle = { id?: unknown; slug?: unknown; title?: unknown; summary?: unknown; body?: unknown; category?: { name?: unknown } | unknown; status?: unknown };
type LearnCategory = { id?: unknown; name?: unknown };

function articleCategoryValue(category: LearnArticle['category']) {
  if (typeof category === 'object' && category !== null && 'name' in category) {
    return (category as { name?: unknown }).name;
  }
  return category;
}

export default function LearnPage() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<LearnArticle[]>([]);
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'ERROR'>('LOADING');
  const [selected, setSelected] = useState<LearnArticle | null>(null);
  const load = useCallback(async () => {
    setState('LOADING');
    try {
      const [articlesResponse, categoriesResponse] = await Promise.all([api.get('/communications/learn'), api.get('/communications/learn/categories')]);
      setArticles(Array.isArray(articlesResponse.data) ? articlesResponse.data : []);
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      setState('LIVE');
    } catch { setArticles([]); setCategories([]); setState('ERROR'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const categoryNames = ['All', ...categories.map((item) => authoritativeValue(item.name)).filter((item) => item !== '—')];
  const visible = useMemo(() => articles.filter((item) => {
    const itemCategory = authoritativeValue(articleCategoryValue(item.category));
    return (category === 'All' || itemCategory === category) && `${authoritativeValue(item.title)} ${authoritativeValue(item.summary)}`.toLowerCase().includes(query.toLowerCase());
  }), [articles, category, query]);
  return <PageShell><PageHeader eyebrow="Education" title="Learn" description="Published articles and categories are loaded from the backend content authority; progress remains unavailable until its contract exists." /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"><div className={selected ? 'hidden lg:block space-y-5' : 'block space-y-5'}><Panel><PanelHeading title="Learning directory" description="Only backend-published, schedule-ready articles are displayed." /><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#8C8299]" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons" aria-label="Search lessons" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Learning categories">{categoryNames.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}</div>{state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading published lessons" />}{state === 'ERROR' && <DataStatePanel state="ERROR" title="Learn content unavailable" message="The authoritative content service could not be reached." />}{state === 'LIVE' && <div className="mt-5 grid gap-3 md:grid-cols-2">{visible.map((item) => { const itemCategory = authoritativeValue(articleCategoryValue(item.category)); return <button type="button" key={String(item.id ?? item.slug)} onClick={() => setSelected(item)} className="nexi-interactive nexi-ripple rounded-xl border border-[#2B2037] bg-[#171022] p-4 text-left hover:border-[#49335E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><div className="flex items-center gap-3"><BookOpen size={18} className="text-[#48C0CC]" /><span className="text-xs uppercase tracking-[0.1em] text-[#8C8299]">{itemCategory}</span></div><h2 className="mt-4 font-semibold">{authoritativeValue(item.title)}</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{authoritativeValue(item.summary)}</p><p className="mt-4 text-xs text-[#A995FF]">Published content</p></button>; })}</div>}{state === 'LIVE' && visible.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No published lesson matches" message="The backend returned no article matching this filter." />}</Panel><Panel><PanelHeading title="Learning progress" action={<GraduationCap size={18} className="text-[#48C0CC]" />} /><DataStatePanel state="UNAVAILABLE" title="Progress unavailable" message="Course progress, level, streak, and achievements must come from the backend profile/content contract." /></Panel><Panel><PanelHeading title="Related content" /><DataStatePanel state="UNAVAILABLE" title="Related lessons unavailable" message="Related content will appear when the content authority exposes relationships." /></Panel></div><aside className={selected ? 'block' : 'hidden lg:block'}><Panel><PanelHeading title="Lesson detail" action={<Bookmark size={18} className="text-[#8C8299]" />} />{selected ? <article><button type="button" onClick={() => setSelected(null)} className="nexi-interactive nexi-ripple mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#A995FF] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] lg:hidden" aria-label="Back to lessons"><ArrowLeft size={16} /> Back to lessons</button><p className="text-xs uppercase tracking-[0.12em] text-[#48C0CC]">{authoritativeValue(articleCategoryValue(selected.category))}</p><h2 className="mt-3 text-xl font-semibold">{authoritativeValue(selected.title)}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#C3BBD0]">{authoritativeValue(selected.body ?? selected.summary)}</p><div className="mt-5 rounded-xl border border-dashed border-[#49335E] bg-[#0B0711] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#48C0CC]">Media slot</p><p className="mt-2 text-sm leading-6 text-[#8C8299]">Images, video, and embeds will render only from an authoritative content response.</p></div></article> : <DataStatePanel state="UNAVAILABLE" title="Select a lesson" message="Lesson detail, bookmarks, and read state are backend-owned." />}</Panel></aside></main></PageShell>;
}
