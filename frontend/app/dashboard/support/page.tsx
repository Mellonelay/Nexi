'use client';

import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Mail, Search, Send } from 'lucide-react';
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
  const [contactsState, setContactsState] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let active = true;
    void api.get<unknown>('/public/config/support')
      .then(({ data }) => {
        if (!active) return;
        setContacts(supportActions(data));
        setContactsState('ready');
      })
      .catch(() => {
        if (!active) return;
        setContacts({ telegramUrl: null, email: null });
        setContactsState('unavailable');
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => helpTopics.filter((topic) =>
    (category === 'All topics' || topic.category === category)
    && (topic.title + ' ' + topic.copy).toLowerCase().includes(query.toLowerCase())), [category, query]);
  const telegramUsername = contacts.telegramUrl
    ? contacts.telegramUrl.split('/').filter(Boolean).pop() ?? null
    : null;

  return (
    <PageShell>
      <PageHeader eyebrow="Help center" title="Help" description="Browse help topics or contact NEXI." />
      <main className="mx-auto max-w-7xl space-y-5">
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
                  </div>
                </div>
              </article>
            )) : <p className="rounded-xl border border-dashed border-[#49335E] p-5 text-sm text-[#8C8299]" role="status">No help topic matches. Try a different search or category.</p>}
          </div>
        </Panel>

        <Panel>
          <PanelHeading title="Contact Us" description="Contact options configured by NEXI support." />
          {contactsState === 'loading' ? (
            <p className="text-sm text-[#8C8299]" role="status">Loading contact options…</p>
          ) : contactsState === 'unavailable' ? (
            <p className="text-sm text-[#8C8299]" role="status">Contact options are unavailable right now.</p>
          ) : !contacts.telegramUrl && !contacts.email ? (
            <p className="text-sm text-[#8C8299]" role="status">No support contact methods are configured.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.telegramUrl && (
                <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Send size={17} aria-hidden="true" className="text-[#48C0CC]" />Telegram</div>
                  <p className="mt-2 text-sm text-[#C3BBD0]">{telegramUsername?.startsWith('+') ? 'Telegram support' : `@${telegramUsername}`}</p>
                  <a href={contacts.telegramUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Open Telegram</a>
                </div>
              )}
              {contacts.email && (
                <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Mail size={17} aria-hidden="true" className="text-[#48C0CC]" />Email</div>
                  <p className="mt-2 break-all text-sm text-[#C3BBD0]">{contacts.email}</p>
                  <a href={`mailto:${contacts.email}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Send email</a>
                </div>
              )}
            </div>
          )}
        </Panel>
      </main>
    </PageShell>
  );
}
