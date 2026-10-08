'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LifeBuoy, Search, Ticket } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { apiBaseUrl } from '../../lib/api';
import { getAccessToken } from '../../lib/auth-session';
import LocalDateTime from '../../components/LocalDateTime';
import { DataStatePanel, Field, inputClass, PageHeader, PageShell, Panel, PanelHeading, PrimaryButton, TabButton } from '../../components/PagePrimitives';

type TicketReply = {
  id: string;
  authorId: string;
  body: string;
  createdAt?: string;
};

type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  assignedToId?: string | null;
  updatedAt?: string;
  replies?: TicketReply[];
};

const categories = ['All topics', 'Wallet', 'Account', 'Trading', 'Security'];
const helpTopics = [
  { title: 'Wallet operations', category: 'Wallet', copy: 'Deposit, withdraw, transfer, and convert actions require account confirmation.' },
  { title: 'Account verification', category: 'Account', copy: 'KYC state and document requirements are displayed only from the account authority.' },
  { title: 'Trading support', category: 'Trading', copy: 'Order and position issues need a request identifier for support to investigate.' },
  { title: 'Security events', category: 'Security', copy: 'Session, wallet signature, and sign-in issues can be reviewed when activity details are available.' },
];

function ticketRows(data: unknown): SupportTicket[] {
  if (Array.isArray(data)) return data as SupportTicket[];
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as SupportTicket[];
  }
  return [];
}

function nextIdempotencyKey(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? prefix + '-' + Date.now();
}

export default function SupportPage() {
  const [category, setCategory] = useState('All topics');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState(helpTopics[0]);
  const [ticketsState, setTicketsState] = useState<'LOADING' | 'LIVE' | 'ERROR'>('LOADING');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const replyLock = useRef(false);

  const filtered = useMemo(
    () => helpTopics.filter((topic) =>
      (category === 'All topics' || topic.category === category)
      && (topic.title + ' ' + topic.copy).toLowerCase().includes(query.toLowerCase())),
    [category, query],
  );

  const selectedTicket = selectedTicketId
    ? tickets.find((ticket) => ticket.id === selectedTicketId) ?? null
    : null;
  const loadTickets = useCallback(async () => {
    setTicketsState('LOADING');
    try {
    const response = await api.get('/communications/tickets', { params: { page: 1, limit: 25 } });
    const rows = ticketRows(response.data);
    setTickets(rows);
    setSelectedTicketId((current) =>
      current && rows.some((ticket) => ticket.id === current) ? current : rows[0]?.id ?? null);
    setTicketsState('LIVE');
    } catch (error) {
      setTickets([]);
      setSelectedTicketId(null);
      setTicketsState('ERROR');
      throw error;
    }
  }, []);

  useEffect(() => {
    const sync = () => setSessionRevision((current) => current + 1);
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  useEffect(() => {
    let active = true;
    void loadTickets().catch(() => {
      if (active) setTickets([]);
    });
    return () => { active = false; };
  }, [loadTickets, sessionRevision]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const socket = io(apiBaseUrl + '/communications', {
      auth: { token },
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
    });
    let connectedOnce = false;
    const refresh = () => { void loadTickets().catch(() => undefined); };
    const onConnect = () => {
      if (connectedOnce) refresh();
      connectedOnce = true;
    };
    const onEvent = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const event = (payload as { event?: unknown }).event;
      if (!event || typeof event !== 'object') return;
      const type = String((event as { type?: unknown }).type ?? '');
      if (type.startsWith('SUPPORT_TICKET_')) refresh();
    };
    socket.on('connect', onConnect);
    socket.on('communications.event', onEvent);
    return () => {
      socket.off('connect', onConnect);
      socket.off('communications.event', onEvent);
      socket.disconnect();
    };
  }, [loadTickets, sessionRevision]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submissionLock.current) return;
    if (!subject.trim() || !message.trim()) {
      setFeedback('Subject and message are required.');
      return;
    }
    submissionLock.current = true;
    try {
      await api.post('/communications/tickets', {
        subject: subject.trim(),
        body: message.trim(),
        idempotencyKey: nextIdempotencyKey('ticket'),
      });
      setSubject('');
      setMessage('');
      setFeedback('Ticket submitted. Status and replies will appear here.');
      await loadTickets();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The support service rejected the ticket.');
    } finally {
      submissionLock.current = false;
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (replyLock.current || !selectedTicket) return;
    if (!reply.trim()) {
      setFeedback('Reply message is required.');
      return;
    }
    replyLock.current = true;
    try {
      await api.post('/communications/tickets/' + encodeURIComponent(selectedTicket.id) + '/replies', {
        body: reply.trim(),
        idempotencyKey: nextIdempotencyKey('ticket-reply-' + selectedTicket.id),
      });
      setReply('');
      setFeedback('Reply submitted.');
      await loadTickets();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The support service rejected the reply.');
    } finally {
      replyLock.current = false;
    }
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Help center" title="Support" description="Search help topics and create support tickets." />
      <main className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="space-y-5">
          <Panel>
            <PanelHeading title="Find help" description="Search help topics or review your recent support tickets." />
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3 text-[#8C8299]" />
              <input className={inputClass + ' pl-10'} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics" aria-label="Search help topics" />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Support categories">
              {categories.map((item) => <TabButton key={item} active={category === item} onClick={() => setCategory(item)}>{item}</TabButton>)}
            </div>
            <div className="mt-5 space-y-3">
              {filtered.length > 0 ? filtered.map((topic) => (
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
              )) : <DataStatePanel state="UNAVAILABLE" title="No help topic matches" message="Try a different search or category." />}
            </div>
          </Panel>

          <Panel>
            <PanelHeading title="Help topic detail" description="Account-specific resolution will appear when available." />
            <article className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#48C0CC]">{selectedTopic.category}</p>
              <h2 className="mt-3 text-lg font-semibold">{selectedTopic.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#C3BBD0]">{selectedTopic.copy}</p>
            </article>
          </Panel>

          <Panel>
            <PanelHeading title="Recent tickets" description="Read-back from the support authority." />
            <div className="space-y-2">
              {ticketsState === 'LOADING' ? <DataStatePanel state="LOADING" title="Loading tickets" /> : ticketsState === 'ERROR' ? <><DataStatePanel state="ERROR" title="Tickets unavailable" message="Verify your wallet and try again. Ticket history could not be loaded." /><PrimaryButton onClick={() => void loadTickets().catch(() => undefined)}>Retry tickets</PrimaryButton></> : tickets.length ? tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  aria-pressed={selectedTicketId === ticket.id}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#2B2037] bg-[#171022] p-3 text-left"
                >
                  <span className="truncate pr-3 text-sm">{ticket.subject}</span>
                  <span className="text-xs font-semibold text-[#48C0CC]">{ticket.status}</span>
                </button>
              )) : <DataStatePanel state="EMPTY" title="No recent tickets" message="Submitted tickets will appear here after they are saved." />}
            </div>
          </Panel>

          {selectedTicket ? (
            <Panel>
              <PanelHeading title="Ticket timeline" description={selectedTicket.subject + ' · ' + selectedTicket.status} />
              <div className="space-y-3" aria-live="polite">
                {(selectedTicket.replies ?? []).length ? (selectedTicket.replies ?? []).map((item) => (
                  <article key={item.id} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
                    <div className="flex flex-wrap gap-2 text-xs text-[#8C8299]">
                      <span>{item.authorId}</span>
                      <span><LocalDateTime value={item.createdAt} dateStyle="medium" timeStyle="short" /></span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#C3BBD0]">{item.body}</p>
                  </article>
                )) : <DataStatePanel state="EMPTY" title="No replies yet" message="Replies will appear here after they are saved." />}
              </div>
              <form className="mt-4 space-y-3" onSubmit={submitReply}>
                <Field label="Reply">
                  <textarea className={inputClass + ' min-h-28 py-3'} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Add a reply to this ticket" aria-label="Ticket reply" />
                </Field>
                <PrimaryButton type="submit">Send reply</PrimaryButton>
              </form>
            </Panel>
          ) : null}
        </div>

        <aside>
          <Panel>
            <PanelHeading title="Create a ticket" description="Submit a support ticket." />
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Describe the issue" aria-label="Ticket subject" /></Field>
              <Field label="Message"><textarea className={inputClass + ' min-h-32 py-3'} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Include a request, transaction, or session identifier when available." aria-label="Ticket message" /></Field>
              <p className="text-xs text-[#8C8299]">Add attachment controls appear when the support channel provides an upload path.</p>
              {feedback && <p className="text-sm text-[#C8FCFF]" role="status">{feedback}</p>}
              <PrimaryButton type="submit">Submit ticket</PrimaryButton>
            </form>
          </Panel>
          <Panel>
            <PanelHeading title="Ticket state" />
            <div className="flex items-start gap-3 text-sm text-[#C3BBD0]">
              <Ticket size={17} className="mt-0.5 text-[#48C0CC]" />
              <span>OPEN · PENDING_USER · RESOLVED · ESCALATED are backend-owned states.</span>
            </div>
          </Panel>
        </aside>
      </main>
    </PageShell>
  );
}
