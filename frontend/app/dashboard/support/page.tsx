'use client';

import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Mail, Search, Send } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';
import { inputClass, PageHeader, PageShell, Panel, PanelHeading, TabButton } from '../../components/PagePrimitives';

type SupportContacts = { telegramUrl: string | null; email: string | null };

const categories = ['All topics', 'Wallet', 'Account', 'Trading', 'Security'];
const helpTopics = [
  { title: 'Wallet operations', category: 'Wallet', copy: 'Deposit, withdraw, transfer, and convert actions require account confirmation.' },
  { title: 'Account verification', category: 'Account', copy: 'KYC state and document requirements are displayed only from the account authority.' },
  { title: 'Trading support', category: 'Trading', copy: 'Order and position issues need a request identifier for support to investigate.' },
  { title: 'Security events', category: 'Security', copy: 'Session, wallet signature, and sign-in issues can be reviewed when activity details are available.' },
];

function configuredTelegramUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !URL.canParse(value)) return null;
  const telegram = new URL(value);
  const allowed = telegram.protocol === 'https:' && telegram.hostname === 't.me'
    && telegram.pathname.length > 1 && !telegram.username && !telegram.password
    && !telegram.search && !telegram.hash;
  return allowed ? telegram.href : null;
}

function configuredSupportEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function supportActions(value: unknown): SupportContacts {
  const contacts = value && typeof value === 'object' ? value as Partial<SupportContacts> : {};
  return {
    telegramUrl: configuredTelegramUrl(contacts.telegramUrl),
    email: configuredSupportEmail(contacts.email),
  };
}

export default function SupportPage() {
  const [category, setCategory] = useState('All topics');
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<SupportContacts>({ telegramUrl: null, email: null });
  const [selectedTopic, setSelectedTopic] = useState(helpTopics[0]);

  useEffect(() => {
    let active = true;
    void api.get<unknown>('/public/config/support')
      .then(({ data }) => { if (active) setContacts(supportActions(data)); })
      .catch(() => { if (active) setContacts({ telegramUrl: null, email: null }); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => helpTopics.filter((topic) =>
    (category === 'All topics' || topic.category === category)
    && (topic.title + ' ' + topic.copy).toLowerCase().includes(query.toLowerCase())), [category, query]);

  return (
    <PageShell>
      <PageHeader eyebrow="Help center" title="Support" description="Browse help topics and contact NEXI support." />
      <main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)]">
        <div className="space-y-5">
          <Panel>
            <PanelHeading title="Find help" description="Search guidance for common account and product questions." />
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3 text-[#8C8299]" />
              <input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics" aria-label="Search help topics" />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Support categories">
              {categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}
            </div>
            <div className="mt-5 space-y-3">
              {filtered.length ? filtered.map((topic) => (
                <article key={topic.title} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
                  <div className="flex items-start gap-3">
                    <LifeBuoy size={18} className="mt-0.5 shrink-0 text-[#48C0CC]" />
                    <div>
                      <h2 className="font-semibold">{topic.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{topic.copy}</p>
                      <button type="button" onClick={() => setSelectedTopic(topic)} aria-pressed={selectedTopic.title === topic.title} className="mt-3 min-h-11 text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Open topic detail</button>
                    </div>
                  </div>
                </article>
              )) : <p className="rounded-xl border border-dashed border-[#49335E] p-5 text-sm text-[#8C8299]" role="status">No help topic matches. Try a different search or category.</p>}
            </div>
          </Panel>
          <Panel>
            <PanelHeading title="Help topic detail" description="Account-specific resolution appears when available." />
            <article className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#48C0CC]">{selectedTopic.category}</p>
              <h2 className="mt-3 text-lg font-semibold">{selectedTopic.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#C3BBD0]">{selectedTopic.copy}</p>
            </article>
          </Panel>
        </div>
        <aside className="self-start rounded-2xl border border-[#49335E] bg-[#100B18]/90 p-5">
          <h2 className="text-lg font-semibold">Chat with NEXI</h2>
          <p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Start or continue a private support conversation.</p>
          <Link href="/dashboard/messages" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-300/35 bg-violet-300/10 px-4 text-sm font-semibold text-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">Open chat</Link>
          {(contacts.telegramUrl || contacts.email) && <div className="mt-5 border-t border-[#2B2037] pt-4">
            <h3 className="text-sm font-semibold">Other contact options</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {contacts.telegramUrl && <a href={contacts.telegramUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#2B2037] px-3 text-sm text-[#C3BBD0] hover:border-violet-300/40"><Send size={16} aria-hidden="true" />Telegram</a>}
              {contacts.email && <a href={`mailto:${contacts.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#2B2037] px-3 text-sm text-[#C3BBD0] hover:border-violet-300/40"><Mail size={16} aria-hidden="true" />Email support</a>}
            </div>
          </div>}
        </aside>
      </main>
    </PageShell>
  );
}
