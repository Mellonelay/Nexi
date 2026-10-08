'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bookmark, BookOpen, GraduationCap, Search } from 'lucide-react';
import api from '../../lib/api';
import { authoritativeValue } from '../../lib/product-states';
import { DataStatePanel, inputClass, PageHeader, PageShell, Panel, PanelHeading, TabButton } from '../../components/PagePrimitives';
import { useLocale } from '../../state/LocaleProvider';

type LearnArticle = { id?: unknown; slug?: unknown; title?: unknown; summary?: unknown; body?: unknown; category?: { name?: unknown } | unknown; status?: unknown };
type LearnCategory = { id?: unknown; name?: unknown };

function articleCategoryValue(category: LearnArticle['category']) {
  if (typeof category === 'object' && category !== null && 'name' in category) {
    return (category as { name?: unknown }).name;
  }
  return category;
}

export default function LearnPage() {
  const { locale } = useLocale();
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<LearnArticle[]>([]);
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [state, setState] = useState<'LOADING' | 'LIVE' | 'ERROR'>('LOADING');
  const [selected, setSelected] = useState<LearnArticle | null>(null);
  const load = useCallback(async () => {
    setState('LOADING');
    try {
      const [articlesResponse, categoriesResponse] = await Promise.all([
        api.get('/communications/learn', { params: { locale } }),
        api.get('/communications/learn/categories'),
      ]);
      setArticles(Array.isArray(articlesResponse.data) ? articlesResponse.data : []);
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      setState('LIVE');
    } catch { setArticles([]); setCategories([]); setState('ERROR'); }
  }, [locale]);
  useEffect(() => { void load(); }, [load]);
  const openArticle = async (item: LearnArticle) => {
    const slug = typeof item.slug === 'string' ? item.slug.trim() : '';
    if (!slug) {
      setSelected(item);
      return;
    }
    try {
      const response = await api.get(`/communications/learn/${encodeURIComponent(slug)}`, { params: { locale } });
      setSelected(response.data && typeof response.data === 'object' ? response.data as LearnArticle : item);
    } catch {
      setSelected(item);
    }
  };
  const categoryNames = ['All', ...categories.map((item) => authoritativeValue(item.name)).filter((item) => item !== '—')];
  const visible = useMemo(() => articles.filter((item) => {
    const itemCategory = authoritativeValue(articleCategoryValue(item.category));
    return (category === 'All' || itemCategory === category) && `${authoritativeValue(item.title)} ${authoritativeValue(item.summary)}`.toLowerCase().includes(query.toLowerCase());
  }), [articles, category, query]);
  const lessonListClass = selected ? 'hidden lg:block' : 'block';
  return <PageShell><PageHeader eyebrow="Education" title="Learn" description="Browse published articles and categories. Learning progress is not available yet." /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"><div className="space-y-5"><Panel className={lessonListClass}><PanelHeading title="Learning directory" description="Only published articles are shown." /><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#8C8299]" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lessons" aria-label="Search lessons" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Learning categories">{categoryNames.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}</div>{state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading published lessons" />}{state === 'ERROR' && <DataStatePanel state="ERROR" title="Learn content unavailable" message="Learning content could not be loaded." />}{state === 'LIVE' && <div className="mt-5 grid gap-3 md:grid-cols-2">{visible.map((item) => { const itemCategory = authoritativeValue(articleCategoryValue(item.category)); return <button type="button" key={String(item.id ?? item.slug)} onClick={() => void openArticle(item)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4 text-left hover:border-[#49335E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><div className="flex items-center gap-3"><BookOpen size={18} className="text-[#48C0CC]" /><span className="text-xs uppercase tracking-[0.1em] text-[#8C8299]">{itemCategory}</span></div><h2 className="mt-4 font-semibold">{authoritativeValue(item.title)}</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{authoritativeValue(item.summary)}</p><p className="mt-4 text-xs text-[#A995FF]">Published content</p></button>; })}</div>}{state === 'LIVE' && visible.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No published lesson matches" message="No articles match this filter." />}</Panel><Panel><PanelHeading title="Learning progress" action={<GraduationCap size={18} className="text-[#48C0CC]" />} /><DataStatePanel state="UNAVAILABLE" title="Progress unavailable" message="Course progress, level, streak, and achievements are not available yet." /></Panel></div><aside><Panel><PanelHeading title="Lesson detail" action={<Bookmark size={18} className="text-[#8C8299]" />} />{selected && <button type="button" onClick={() => setSelected(null)} className="mb-3 min-h-11 text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline lg:hidden">Back to lessons</button>}{selected ? <article><p className="text-xs uppercase tracking-[0.12em] text-[#48C0CC]">{authoritativeValue(articleCategoryValue(selected.category))}</p><h2 className="mt-3 text-xl font-semibold">{authoritativeValue(selected.title)}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#C3BBD0]">{authoritativeValue(selected.body ?? selected.summary)}</p><p className="mt-5 text-xs text-[#8C8299]">Media is not available for this lesson.</p></article> : <DataStatePanel state="UNAVAILABLE" title="Select a lesson" message="Lesson details, bookmarks, and read state will appear here when available." />}</Panel></aside></main></PageShell>;
}
