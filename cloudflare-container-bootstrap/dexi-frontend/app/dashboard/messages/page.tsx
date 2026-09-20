'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  CheckCheck,
  Inbox,
  MessageSquare,
  Search,
  Send,
} from 'lucide-react';
import api, { apiBaseUrl } from '../../lib/api';
import { getAccessToken } from '../../lib/auth-session';
import {
  authoritativeValue,
  normalizeMessageDeliveryState,
  normalizeMessageThreadState,
} from '../../lib/product-states';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import {
  DataStatePanel,
  inputClass,
  Metric,
  PageHeader,
  PageShell,
  Panel,
  PanelHeading,
  PrimaryButton,
  StatusBadge,
  TabButton,
} from '../wallet/components/ProductPrimitives';
import SafeBackButton from '../../components/SafeBackButton';

type LoadState = 'LOADING' | 'LIVE' | 'UNAVAILABLE' | 'ERROR';
type Filter = 'ALL' | 'UNREAD';
type MessageRecord = {
  id?: unknown;
  body?: unknown;
  text?: unknown;
  sender?: unknown;
  senderId?: unknown;
  recipientId?: unknown;
  sequence?: unknown;
  createdAt?: unknown;
  readAt?: unknown;
  deliveryState?: unknown;
};

type MessageThread = {
  id?: unknown;
  title?: unknown;
  subject?: unknown;
  readState?: unknown;
  deliveryState?: unknown;
  updatedAt?: unknown;
  counterpartId?: string;
  messages?: MessageRecord[];
};

const filters: Filter[] = ['ALL', 'UNREAD'];
const threadTitle = (thread: MessageThread) => authoritativeValue(thread.title ?? thread.subject);
const threadState = (thread: MessageThread) => normalizeMessageThreadState(thread.readState);

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function groupMessages(records: MessageRecord[], currentUserId: string | null): MessageThread[] {
  const grouped = new Map<string, MessageThread>();
  for (const record of records) {
    const senderId = textValue(record.senderId);
    const recipientId = textValue(record.recipientId);
    const participants = [senderId, recipientId].filter((value): value is string => Boolean(value)).sort();
    const key = participants.join(':') || textValue(record.id) || `message-${grouped.size}`;
    const existing = grouped.get(key);
    const counterpartId = currentUserId
      ? senderId === currentUserId ? recipientId : recipientId === currentUserId ? senderId : existing?.counterpartId
      : existing?.counterpartId;
    const next: MessageThread = existing ?? {
      id: key,
      title: counterpartId ? `Conversation ${counterpartId.slice(0, 8)}` : 'Conversation',
      counterpartId,
      messages: [],
    };
    next.counterpartId = counterpartId ?? next.counterpartId;
    next.messages = [...(next.messages ?? []), record];
    if (currentUserId && recipientId === currentUserId && !textValue(record.readAt)) {
      next.readState = 'UNREAD';
    } else if (next.readState !== 'UNREAD') {
      next.readState = 'READ';
    }
    const createdAt = textValue(record.createdAt);
    if (createdAt) next.updatedAt = createdAt;
    next.deliveryState = record.deliveryState;
    grouped.set(key, next);
  }
  return Array.from(grouped.values()).sort((left, right) => String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? '')));
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [state, setState] = useState<LoadState>('LOADING');
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<MessageThread | null>(null);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messageEndpoint = process.env.NEXT_PUBLIC_MESSAGES_ENDPOINT?.trim() || '/communications/messages';

  useEffect(() => {
    const sync = () => { setUserId(sessionPrincipalId()); setSessionChecked(true); };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const load = useCallback(async () => {
    if (!sessionChecked) return;
    if (!messageEndpoint || !userId) {
      setThreads([]);
      setState('UNAVAILABLE');
      return;
    }
    setState('LOADING');
    try {
      const response = await api.get(messageEndpoint);
      const records = Array.isArray(response.data) ? response.data as MessageRecord[] : [];
      setThreads(groupMessages(records, userId));
      setState('LIVE');
    } catch {
      setThreads([]);
      setState('ERROR');
    }
  }, [messageEndpoint, sessionChecked, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !userId) return;
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
    const refresh = () => { void load(); };
    const onConnect = () => {
      if (connectedOnce) refresh();
      connectedOnce = true;
    };
    const onEvent = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const event = (payload as { event?: unknown }).event;
      if (!event || typeof event !== 'object') return;
      const type = String((event as { type?: unknown }).type ?? '');
      if (type === 'MESSAGE_SENT' || type === 'MESSAGE_READ') refresh();
    };
    socket.on('connect', onConnect);
    socket.on('communications.event', onEvent);
    return () => {
      socket.off('connect', onConnect);
      socket.off('communications.event', onEvent);
      socket.disconnect();
    };
  }, [load, userId]);

  const openThread = async (thread: MessageThread) => {
    setSelected(thread);
    if (!userId || threadState(thread) !== 'UNREAD') return;
    const unreadIds = (thread.messages ?? [])
      .filter((record) => textValue(record.recipientId) === userId && !textValue(record.readAt))
      .map((record) => textValue(record.id))
      .filter((id): id is string => Boolean(id));
    if (unreadIds.length === 0) return;
    try {
      await Promise.all(unreadIds.map((id) => api.post(`${messageEndpoint}/${encodeURIComponent(id)}/read`)));
      const readThread: MessageThread = {
        ...thread,
        readState: 'READ',
        messages: (thread.messages ?? []).map((record) =>
          textValue(record.recipientId) === userId && unreadIds.includes(textValue(record.id) ?? '')
            ? { ...record, readAt: new Date().toISOString() }
            : record,
        ),
      };
      setSelected(readThread);
      setThreads((current) => current.map((item) => item.id === thread.id ? readThread : item));
    } catch {
      setFeedback('The message service could not mark this conversation as read.');
    }
  };

  const sendReply = async () => {
    const body = draft.trim();
    if (!body || !selected?.counterpartId || !userId) {
      setFeedback('Reply is unavailable until an authenticated conversation counterpart is available.');
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/communications/messages', {
        recipientId: selected.counterpartId,
        body,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `message-${Date.now()}`,
      });
      setDraft('');
      setFeedback('Message sent.');
      await load();
    } catch {
      setFeedback('The message service rejected this reply.');
    } finally {
      setSending(false);
    }
  };

  const filtered = useMemo(() => threads.filter((thread) => {
    const searchMatch = `${threadTitle(thread)} ${authoritativeValue(thread.subject)}`.toLowerCase().includes(query.toLowerCase());
    const stateValue = threadState(thread);
    const filterMatch = filter === 'ALL'
      || (filter === 'UNREAD' && stateValue === 'UNREAD');
    return searchMatch && filterMatch;
  }), [filter, query, threads]);

  const unreadCount = state === 'LIVE'
    ? threads.filter((thread) => threadState(thread) === 'UNREAD').length
    : null;
  const conversationListClass = selected ? 'hidden lg:block' : 'block';
  return (
    <PageShell>
      <PageHeader
        eyebrow="Communications"
        title="Messages"
        description="Read conversations, track delivery, and reply when messaging is available."
      />

      <main className="mx-auto max-w-7xl space-y-5">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Message summary">
          <Metric label="Conversations" value={state === 'LIVE' ? authoritativeValue(threads.length) : '—'} hint="Available conversations" />
          <Metric label="Unread" value={unreadCount === null ? '—' : authoritativeValue(unreadCount)} hint="Current unread state" />
          <Metric label="Delivery service" value={messageEndpoint && userId ? 'Available' : 'Unavailable'} hint="Message delivery status" />
          <Metric label="Attachments" value="—" hint="Unavailable" />
        </section>
        <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] lg:items-start">
          <Panel className={conversationListClass}>
            <PanelHeading title="Conversations" action={<Inbox size={18} className="text-[#48C0CC]" />} />
            <div className="relative">
              <Search size={17} className="absolute left-3 top-3 text-[#8C8299]" />
              <input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Conversation filters">
              {filters.map((item) => <TabButton key={item} active={filter === item} onClick={() => setFilter(item)}>{item[0] + item.slice(1).toLowerCase()}</TabButton>)}
            </div>

            <div className="mt-4 space-y-2">
              {state === 'LOADING' && <DataStatePanel state="LOADING" title="Loading conversations" />}
              {state === 'UNAVAILABLE' && <DataStatePanel state="UNAVAILABLE" title={!userId ? 'Sign in to view conversations' : 'Messages unavailable'} message={!userId ? undefined : 'Conversation history is not available right now.'} />}
              {state === 'ERROR' && <DataStatePanel state="ERROR" title="Message service error" />}
              {state === 'LIVE' && filtered.length === 0 && <DataStatePanel state="UNAVAILABLE" title="No conversations returned" />}
              {state === 'LIVE' && filtered.map((thread, index) => (
                <ThreadButton key={String(thread.id ?? index)} thread={thread} active={selected?.id === thread.id} onClick={() => void openThread(thread)} />
              ))}
            </div>
          </Panel>
          <Panel className="min-h-[520px]">
            <PanelHeading title="Conversation detail" action={<CheckCheck size={18} className="text-[#8C8299]" />} />
            {selected && <SafeBackButton onBack={() => setSelected(null)} label="Back to conversations" showLabel className="mb-3 border-transparent px-2 text-sm font-semibold text-[#A995FF]" />}
             {!selected && <DataStatePanel state="UNAVAILABLE" title="Choose a conversation" message="Select a conversation to view its messages." />}
            {selected && (
              <div className="flex min-h-[430px] flex-col">
                <div className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                     <div className="min-w-0"><h2 className="break-words font-semibold">{threadTitle(selected)}</h2><p className="mt-1 text-xs text-[#8C8299]">Conversation messages and delivery status.</p></div>
                    <div className="flex flex-wrap gap-2"><StatusBadge state={normalizeMessageThreadState(selected.readState)} /><StatusBadge state={normalizeMessageDeliveryState(selected.deliveryState)} /></div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 py-4">
                  <AuthoritativeMessageList thread={selected} />
                </div>


                {feedback && <p role="status" className="mb-4 rounded-xl border border-[#49335E] bg-[#171022] p-3 text-xs leading-5 text-[#C3BBD0]">{feedback}</p>}
                <div className="mt-auto border-t border-[#2B2037] pt-4">
                  <label className="block text-sm font-semibold text-[#F2ECFA]" htmlFor="message-reply">Reply</label>
                  <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <input
                      id="message-reply"
                      className={inputClass}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={selected.counterpartId ? 'Write a reply' : 'Reply unavailable'}
                      disabled={!selected.counterpartId || !userId || sending}
                    />
                    <PrimaryButton onClick={() => void sendReply()} disabled={!selected.counterpartId || !userId || sending || !draft.trim()}>Send reply</PrimaryButton>
                  </div>
                   <p className="mt-2 text-xs leading-5 text-[#8C8299]">Replies are available when messaging is connected.</p>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </main>
    </PageShell>
  );
}
function ThreadButton({ thread, active, onClick }: { thread: MessageThread; active: boolean; onClick: () => void }) {
  const readState = threadState(thread);
  const deliveryState = normalizeMessageDeliveryState(thread.deliveryState);
  return (
    <button
      type="button"
      onClick={onClick}
       className={`w-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] sm:p-4 ${active ? 'border-[#8B5CF6] bg-[#2A1742]' : 'border-[#2B2037] bg-[#171022]'}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <MessageSquare size={17} className="mt-0.5 shrink-0 text-[#48C0CC]" />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{threadTitle(thread)}</p>
          <p className="mt-1 text-xs text-[#8C8299]">Updated {authoritativeValue(thread.updatedAt)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><StatusBadge state={readState} /><StatusBadge state={deliveryState} /></div>
    </button>
  );
}

function AuthoritativeMessageList({ thread }: { thread: MessageThread }) {
  const records = Array.isArray(thread.messages) ? thread.messages : [];
  if (records.length === 0) {
    return <DataStatePanel state="UNAVAILABLE" title="Message history unavailable" message="Thread messages and attachments are unavailable." />;
  }

  return (
    <div className="space-y-3">
      {records.map((record, index) => {
        const delivery = normalizeMessageDeliveryState(record.deliveryState);
        return (
          <article key={String(record.id ?? index)} className="rounded-xl border border-[#2B2037] bg-[#171022] p-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <p className="min-w-0 break-words text-sm leading-6 text-[#F2ECFA]">{authoritativeValue(record.body ?? record.text)}</p>
              <StatusBadge state={delivery} />
            </div>
             <p className="mt-2 text-xs text-[#8C8299]">From {authoritativeValue(record.sender)} · {authoritativeValue(record.createdAt)}</p>
          </article>
        );
      })}
    </div>
  );
}
