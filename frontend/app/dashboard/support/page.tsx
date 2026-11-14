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
  // The address becomes a mailto: URL; reject URI delimiters and control characters.
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email) ? email : null;
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
      <main className="mx-auto min-w-0 max-w-7xl space-y-3 sm:space-y-5">
        <Panel>
          <PanelHeading title="Find help" description="Search guidance for common account and product questions." />
          <div className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-3 text-[#8C8299]" />
            <input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics" aria-label="Search help topics" />
          </div>
          <div className="nexi-scroll-rail mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1 sm:mt-4" role="tablist" aria-label="Support categories">
            {categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}
          </div>
          <div className="mt-3 space-y-2 sm:mt-5 sm:space-y-3">
            {filtered.length ? filtered.map((topic) => (
              <article key={topic.title} className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
                <div className="flex min-w-0 items-start gap-2.5">
                  <LifeBuoy size={18} className="mt-0.5 shrink-0 text-[#48C0CC]" />
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold">{topic.title}</h2>
                    <p className="mt-1 break-words text-sm leading-5 text-[#C3BBD0] sm:mt-2 sm:leading-6">{topic.copy}</p>
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
            <div className="text-sm text-[#8C8299]" role="status"><p>No external support contact methods are configured.</p><p className="mt-2 text-[#C3BBD0]">For in-app help, message NEXI Support.</p><Link href="/dashboard/messages" className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#A995FF] underline-offset-4 hover:underline">Open Messages</Link></div>
          ) : (
            <div className="grid min-w-0 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15rem), 1fr))" }}>
              {contacts.telegramUrl && (
                <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Send size={17} aria-hidden="true" className="text-[#48C0CC]" />Telegram</div>
                  <p className="mt-2 text-sm text-[#C3BBD0]">{telegramUsername?.startsWith('+') ? 'Telegram support' : `@${telegramUsername}`}</p>
                  <a href={contacts.telegramUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Open Telegram</a>
                </div>
              )}
              {contacts.email && (
                <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Mail size={17} aria-hidden="true" className="text-[#48C0CC]" />Email</div>
                  <p className="mt-2 break-words text-sm text-[#C3BBD0]">{contacts.email}</p>
                  <a href={`mailto:${contacts.email}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Send email</a>
                </div>
              )}
            </div>
          )}
          {(contacts.telegramUrl || contacts.email) && <Link href="/dashboard/messages" className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">Message NEXI Support</Link>}
        </Panel>
      </main>
    </PageShell>
  );
}
