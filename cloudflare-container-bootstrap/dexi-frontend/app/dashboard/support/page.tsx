'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { LifeBuoy, Search, Ticket } from 'lucide-react';
import api from '../../lib/api';
import { DataStatePanel, Field, inputClass, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, TabButton } from '../wallet/components/ProductPrimitives';

const categories = ['All topics', 'Wallet', 'Account', 'Trading', 'Security'];
const helpTopics = [
  { title: 'Wallet operations', category: 'Wallet', copy: 'Deposit, withdraw, transfer, and convert actions require account confirmation.' },
  { title: 'Account verification', category: 'Account', copy: 'KYC state and document requirements are displayed only from the account authority.' },
  { title: 'Trading support', category: 'Trading', copy: 'Order and position issues need a request identifier for support to investigate.' },
  { title: 'Security events', category: 'Security', copy: 'Session, wallet signature, and sign-in issues can be reviewed when activity details are available.' },
];

export default function SupportPage() {
  const [category, setCategory] = useState('All topics');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(helpTopics[0]);
  const [tickets, setTickets] = useState<Array<{ id: string; subject: string; status: string; updatedAt?: string }>>([]);
  const submissionLock = useRef(false);
  const filtered = useMemo(() => helpTopics.filter((topic) => (category === 'All topics' || topic.category === category) && `${topic.title} ${topic.copy}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  useEffect(() => {
    let active = true;
    api.get('/communications/tickets', { params: { page: 1, limit: 25 } })
      .then((response) => { if (active) setTickets(Array.isArray(response.data) ? response.data : response.data?.items ?? []); })
      .catch(() => { if (active) setTickets([]); });
    return () => { active = false; };
  }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submissionLock.current) return;
    if (!subject.trim() || !message.trim()) { setFeedback('Subject and message are required.'); return; }
    submissionLock.current = true;
    try {
      await api.post('/communications/tickets', { subject: subject.trim(), body: message.trim(), idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `ticket-${Date.now()}` });
      setSubject(''); setMessage(''); setFeedback('Ticket submitted. Status and replies will appear here.');
      const response = await api.get('/communications/tickets', { params: { page: 1, limit: 25 } });
      setTickets(Array.isArray(response.data) ? response.data : response.data?.items ?? []);
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'The support service rejected the ticket.'); }
    finally { submissionLock.current = false; }
  };
  return <PageShell><PageHeader eyebrow="Help center" title="Support" description="Search help topics and create support tickets." /><main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"><div className="space-y-5"><Panel><PanelHeading title="Find help" description="Static guidance explains the shell; ticket state is loaded from the support authority." /><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#8C8299]" /><input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics" aria-label="Search help topics" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Support categories">{categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}</div><div className="mt-5 space-y-3">{filtered.length > 0 ? filtered.map((topic) => <article key={topic.title} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><div className="flex items-start gap-3"><LifeBuoy size={18} className="mt-0.5 shrink-0 text-[#48C0CC]" /><div><h2 className="font-semibold">{topic.title}</h2><p className="mt-2 text-sm leading-6 text-[#C3BBD0]">{topic.copy}</p><button type="button" onClick={() => setSelectedTopic(topic)} aria-pressed={selectedTopic.title === topic.title} className="mt-3 min-h-11 text-sm font-semibold text-[#A995FF] underline-offset-4 hover:underline">Open topic detail</button></div></div></article>) : <DataStatePanel state="UNAVAILABLE" title="No help topic matches" message="Try a different search or category." />}</div></Panel><Panel><PanelHeading title="Help topic detail" description="Account-specific resolution will appear when available." /><article className="rounded-xl border border-[#2B2037] bg-[#171022] p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#48C0CC]">{selectedTopic.category}</p><h2 className="mt-3 text-lg font-semibold">{selectedTopic.title}</h2><p className="mt-3 text-sm leading-7 text-[#C3BBD0]">{selectedTopic.copy}</p></article></Panel><Panel><PanelHeading title="Recent tickets" description="Read-back from the support authority." /><div className="space-y-2">{tickets.length ? tickets.map((ticket) => <article key={ticket.id} className="flex items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3"><span className="truncate pr-3 text-sm">{ticket.subject}</span><span className="text-xs font-semibold text-[#48C0CC]">{ticket.status}</span></article>) : <DataStatePanel state="EMPTY" title="No recent tickets" message="Submitted tickets will appear here after they are saved." />}</div></Panel></div><aside><Panel><PanelHeading title="Create a ticket" description="Submit a support ticket." /><form className="space-y-4" onSubmit={submit}><Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Describe the issue" aria-label="Ticket subject" /></Field><Field label="Message"><textarea className={`${inputClass} min-h-32 py-3`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Include a request, transaction, or session identifier when available." aria-label="Ticket message" /></Field><p className="text-xs text-[#8C8299]">Add attachment is available when the support reply channel accepts uploaded evidence.</p>{feedback && <p className="text-sm text-[#C8FCFF]" role="status">{feedback}</p>}<PrimaryButton type="submit">Submit ticket</PrimaryButton></form></Panel><Panel><PanelHeading title="Ticket state" /><div className="flex items-start gap-3 text-sm text-[#C3BBD0]"><Ticket size={17} className="mt-0.5 text-[#48C0CC]" /><span>OPEN · PENDING · RESOLVED · CLOSED are backend-owned states.</span></div></Panel></aside></main></PageShell>;
}
