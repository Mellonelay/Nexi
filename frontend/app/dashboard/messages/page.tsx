'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, CheckCheck, FileText, Image as ImageIcon, LoaderCircle, Paperclip, Send, Smile, X } from 'lucide-react';
import { io } from 'socket.io-client';
import Image from 'next/image';
import api, { apiBaseUrl } from '../../lib/api';
import { getAccessToken } from '../../lib/auth-session';
import { sessionPrincipalId } from '../../lib/wallet-auth';
import LocalDateTime from '../../components/LocalDateTime';
import ModalSurface from '../../components/ModalSurface';
import { NexiLogoMark } from '../components/QuotesHubVisuals';

type LoadState = 'LOADING' | 'READY' | 'ERROR' | 'SIGNED_OUT';
type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'SIGNED_OUT';
type SupportAttachment = { id: string; name: string; mimeType: string; size: number };
type SupportMessage = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  readAt?: string | null;
  deliveryState?: string | null;
  attachments?: SupportAttachment[];
};
type SupportThreadPage = { conversationId: string; messages: SupportMessage[] };

const PAGE_SIZE = 100;
const EMOJI = ['🙂', '😊', '👋', '🙏', '👍', '❤️', '🎉', '🤔'];
const messageKey = (message: SupportMessage) => message.id || `${message.createdAt}:${message.senderId}:${message.body}`;

function readReceipt(value: unknown, messageId: string): string {
  if (!value || typeof value !== 'object') throw new Error('Invalid message read response');
  const message = value as { id?: unknown; readAt?: unknown };
  if (message.id !== messageId || typeof message.readAt !== 'string' || !message.readAt) {
    throw new Error('Invalid message read response');
  }
  return message.readAt;
}

function threadPage(value: unknown): SupportThreadPage {
  if (!value || typeof value !== 'object') throw new Error('Invalid support thread response');
  const page = value as Partial<SupportThreadPage>;
  if (typeof page.conversationId !== 'string' || !page.conversationId || !Array.isArray(page.messages)) {
    throw new Error('Invalid support thread response');
  }
  return { conversationId: page.conversationId, messages: page.messages };
}

function attachmentReference(value: unknown): SupportAttachment {
  if (!value || typeof value !== 'object') throw new Error('Invalid attachment response');
  const item = value as Partial<SupportAttachment>;
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name
    || typeof item.mimeType !== 'string' || !item.mimeType || typeof item.size !== 'number'
    || !Number.isSafeInteger(item.size) || item.size < 0) {
    throw new Error('Invalid attachment response');
  }
  return { id: item.id, name: item.name, mimeType: item.mimeType, size: item.size };
}

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const loadGeneration = useRef(0);
  const sessionController = useRef<AbortController | null>(null);
  const readInFlight = useRef(new Set<string>());
  const conversationIdRef = useRef<string | null>(null);
  const draftRef = useRef('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [state, setState] = useState<LoadState>('LOADING');
  const [connection, setConnection] = useState<ConnectionState>('CONNECTING');
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingMessageKey, setPendingMessageKey] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nextUserId = sessionPrincipalId();
      if (userIdRef.current !== nextUserId) {
        sessionController.current?.abort();
        sessionController.current = nextUserId ? new AbortController() : null;
        userIdRef.current = nextUserId;
        loadGeneration.current += 1;
        conversationIdRef.current = null;
        draftRef.current = '';
        setConversationId(null);
        setMessages([]);
        setDraft('');
        setAttachments([]);
        setUploading(false);
        setSending(false);
        setPendingMessageKey(null);
        setFeedback(null);
        setHistoryOpen(false);
        setState(nextUserId ? 'LOADING' : 'SIGNED_OUT');
        setConnection(nextUserId ? 'CONNECTING' : 'SIGNED_OUT');
      }
      setUserId(nextUserId);
      setSessionChecked(true);
    };
    sync();
    window.addEventListener('nexi:wallet-session', sync);
    return () => window.removeEventListener('nexi:wallet-session', sync);
  }, []);

  const load = useCallback(async () => {
    if (!sessionChecked) return;
    if (!userId) {
      setMessages([]);
      setConversationId(null);
      return;
    }
    const requestUserId = userId;
    const requestController = sessionController.current;
    if (!requestController || requestController.signal.aborted) return;
    const { signal } = requestController;
    const generation = ++loadGeneration.current;
    try {
      const loaded: SupportMessage[] = [];
      const seenIds = new Set<string>();
      let stableConversationId: string | null = null;
      for (let pageNumber = 1; ; pageNumber += 1) {
        const response = await api.get<unknown>('/communications/support/thread', { params: { page: pageNumber, limit: PAGE_SIZE }, signal });
        if (generation !== loadGeneration.current || requestUserId !== userIdRef.current) return;
        const page = threadPage(response.data);
        if (stableConversationId && stableConversationId !== page.conversationId) throw new Error('Support conversation changed between pages');
        stableConversationId = page.conversationId;
        const unseen = page.messages.filter((message) => Boolean(message.id) && !seenIds.has(message.id));
        for (const message of unseen) {
          seenIds.add(message.id);
          loaded.push(message);
        }
        if (page.messages.length < PAGE_SIZE || unseen.length === 0) break;
      }
      if (generation !== loadGeneration.current || requestUserId !== userIdRef.current) return;
      for (const message of loaded) {
        if (message.senderId === requestUserId || message.readAt) continue;
        const readKey = `${requestUserId}:${message.id}`;
        if (readInFlight.current.has(readKey)) continue;
        if (signal.aborted || generation !== loadGeneration.current || requestUserId !== userIdRef.current) return;
        readInFlight.current.add(readKey);
        try {
          const response = await api.post<unknown>(`/communications/messages/${encodeURIComponent(message.id)}/read`, {}, { signal });
          if (signal.aborted || requestUserId !== userIdRef.current) return;
          const readAt = readReceipt(response.data, message.id);
          const index = loaded.findIndex((item) => item.id === message.id);
          if (index >= 0) loaded[index] = { ...loaded[index], readAt };
          setMessages((current) => requestUserId === userIdRef.current
            ? current.map((item) => item.id === message.id ? { ...item, readAt } : item)
            : current);
        } catch {
          if (!signal.aborted && generation === loadGeneration.current && requestUserId === userIdRef.current) {
            setFeedback('Some support messages may still be unread.');
          }
        } finally {
          readInFlight.current.delete(readKey);
        }
        if (signal.aborted || generation !== loadGeneration.current || requestUserId !== userIdRef.current) return;
      }
      conversationIdRef.current = stableConversationId;
      setConversationId(stableConversationId);
      setMessages(loaded.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)));
      setState('READY');
    } catch {
      if (generation !== loadGeneration.current || requestUserId !== userIdRef.current) return;
      setState('ERROR');
    }
  }, [sessionChecked, userId]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => active ? load() : undefined);
    return () => { active = false; loadGeneration.current += 1; };
  }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !userId) return;
    const socket = io(`${apiBaseUrl}/communications`, {
      auth: (callback) => callback({ token: getAccessToken() }),
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8_000,
    });
    let connectedOnce = false;
    const onConnect = () => {
      setConnection('CONNECTED');
      if (connectedOnce) void load();
      connectedOnce = true;
    };
    const onDisconnect = () => setConnection('DISCONNECTED');
    const onConnectError = () => setConnection('DISCONNECTED');
    const onEvent = (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const event = (payload as { event?: { type?: unknown } }).event;
      if (event?.type === 'MESSAGE_SENT' || event?.type === 'MESSAGE_READ') void load();
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('communications.event', onEvent);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('communications.event', onEvent);
      socket.disconnect();
    };
  }, [load, userId]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list && !historyOpen) list.scrollTop = list.scrollHeight;
  }, [messages, historyOpen]);

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const requestUserId = userId;
    if (!files.length || !requestUserId) return;
    setUploading(true);
    setFeedback(null);
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        const response = await api.post<unknown>('/communications/support/attachments', data);
        if (requestUserId !== userIdRef.current) return;
        const uploaded = attachmentReference(response.data);
        setAttachments((current) => [...current, uploaded]);
        setPendingMessageKey(null);
      }
    } catch {
      if (requestUserId === userIdRef.current) setFeedback('An attachment could not be uploaded. Try again with a supported file.');
    } finally {
      if (requestUserId === userIdRef.current) setUploading(false);
    }
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if ((!body && attachments.length === 0) || !userId || !conversationId || sending || uploading) return;
    const requestUserId = userId;
    const requestConversationId = conversationId;
    const requestAttachments = attachments;
    const idempotencyKey = pendingMessageKey ?? globalThis.crypto?.randomUUID?.() ?? `support-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPendingMessageKey(idempotencyKey);
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/communications/support/messages', {
        body,
        idempotencyKey,
        ...(requestAttachments.length ? { attachmentIds: requestAttachments.map((item) => item.id) } : {}),
      });
      if (requestUserId !== userIdRef.current || requestConversationId !== conversationIdRef.current) return;
      if (draftRef.current.trim() === body) {
        draftRef.current = '';
        setDraft('');
        setAttachments((current) => current.filter((item) => !requestAttachments.some((uploaded) => uploaded.id === item.id)));
        setPendingMessageKey(null);
        setFeedback('Message sent.');
      }
      await load();
    } catch {
      if (requestUserId === userIdRef.current && requestConversationId === conversationIdRef.current) setFeedback('Your message could not be sent. Your draft is still here so you can retry.');
    } finally {
      if (requestUserId === userIdRef.current) setSending(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? draft.length;
    const end = input?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${emoji}${draft.slice(end)}`;
    draftRef.current = next;
    setDraft(next);
    setPendingMessageKey(null);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const jumpToMessage = (id: string) => {
    setHistoryOpen(false);
    requestAnimationFrame(() => document.querySelector(`[data-message-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const connectionLabel = connection === 'CONNECTED' ? 'Connected' : connection === 'CONNECTING' ? 'Connecting' : connection === 'SIGNED_OUT' ? 'Sign in required' : 'Offline · retrying';
  const canSend = Boolean(userId && conversationId && state === 'READY' && !sending && !uploading && (draft.trim() || attachments.length));

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--nexi-border-raised)] bg-[var(--nexi-surface-deep)] shadow-[var(--nexi-shadow-panel)]">
      <header className="flex min-h-16 items-center gap-3 border-b border-[#2B2037] px-4 py-3">
        <button type="button" onClick={() => setHistoryOpen(true)} aria-label="Open message history" aria-haspopup="dialog" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><NexiLogoMark compact /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-[#F5F7FB]">Nexi Customer Service</h1>
          <p className="mt-0.5 text-xs text-[var(--nexi-text-secondary)]" role="status" aria-live="polite">{connectionLabel}</p>
        </div>
        {state === 'ERROR' && <button type="button" onClick={() => { setState('LOADING'); void load(); }} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[var(--nexi-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">Retry</button>}
      </header>

      <div ref={messageListRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" aria-label="Support conversation">
        {state === 'LOADING' && <p className="py-8 text-center text-sm text-[#93A4BD]">Loading your conversation…</p>}
        {state === 'ERROR' && <p className="py-8 text-center text-sm text-rose-200" role="alert">Conversation could not be loaded. Retry to reconnect.</p>}
        {state === 'SIGNED_OUT' && <p className="py-8 text-center text-sm text-[#C3BBD0]" role="status">Sign in to view and send support messages.</p>}
        {state === 'READY' && messages.length === 0 && <div className="mx-auto max-w-sm rounded-2xl border border-[#49335E] bg-[#171022] px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A995FF]">Local welcome · not sent by support</p>
          <p className="mt-2 text-sm leading-6 text-[#C3BBD0]">Write a message below to start a conversation with NEXI Support.</p>
        </div>}
        {messages.map((message) => <MessageBubble key={messageKey(message)} message={message} own={message.senderId === userId} />)}
        <div aria-hidden="true" className="h-1" />
      </div>

      <form onSubmit={(event) => void send(event)} className="border-t border-[var(--nexi-foundation-border-divider)] bg-[var(--nexi-foundation-main-surface)] px-3 py-3 sm:px-4">
        {attachments.length > 0 && <ul className="mb-3 flex flex-wrap gap-2" aria-label="Attachments ready to send">
          {attachments.map((item) => <li key={item.id} className="flex max-w-full items-center gap-2 rounded-lg border border-[#49335E] bg-[#171022] px-3 py-2 text-xs text-[#C3BBD0]">
            {item.mimeType.startsWith('image/') ? <ImageIcon size={15} aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />}
            <span className="max-w-48 truncate">{item.name}</span>
            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => { setAttachments((current) => current.filter((attachment) => attachment.id !== item.id)); setPendingMessageKey(null); }} className="grid h-7 w-7 place-items-center rounded hover:bg-white/5"><X size={14} /></button>
          </li>)}
        </ul>}
        {feedback && <p className="mb-2 px-1 text-xs text-[#C9B7FF]" role="status">{feedback}</p>}
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={(event) => void onFiles(event)} aria-label="Choose message attachments" />
          <button type="button" aria-label="Attach a file or image" onClick={() => fileInputRef.current?.click()} disabled={!userId || uploading || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#C3BBD0] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] disabled:opacity-40"><Paperclip size={19} /></button>
          <div className="relative grid h-11 w-11 shrink-0 place-items-center">
            <button type="button" aria-label="Insert emoji" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((value) => !value)} disabled={!userId || sending} className="grid h-11 w-11 place-items-center rounded-xl text-[#C3BBD0] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] disabled:opacity-40"><Smile size={19} /></button>
            {emojiOpen && <div className="absolute bottom-12 left-0 z-10 grid grid-cols-4 gap-1 rounded-xl border border-[#49335E] bg-[#171022] p-2 shadow-xl" role="group" aria-label="Emoji picker">{EMOJI.map((emoji) => <button type="button" key={emoji} aria-label={`Insert ${emoji}`} onClick={() => insertEmoji(emoji)} className="grid h-10 w-10 place-items-center rounded-lg text-xl hover:bg-white/5">{emoji}</button>)}</div>}
          </div>
          <textarea ref={inputRef} value={draft} onChange={(event) => { draftRef.current = event.target.value; setDraft(event.target.value); setPendingMessageKey(null); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} disabled={!userId || state !== 'READY' || sending} rows={1} aria-label="Write a message" placeholder={userId ? 'Write a message…' : 'Sign in to message support'} className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-[#49335E] bg-[#171022] px-3 py-3 text-sm text-[#F5F7FB] placeholder:text-[#8C8299] focus:border-violet-300/60 focus:outline-none focus:ring-1 focus:ring-violet-300/30 disabled:opacity-50" />
          <button type="submit" aria-label="Send message" disabled={!canSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-300/40 bg-violet-300/15 text-violet-100 hover:bg-violet-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] disabled:cursor-not-allowed disabled:opacity-40">{sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}</button>
        </div>
        <p className="mt-2 pl-1 text-[11px] text-[#8C8299]">Enter to send · Shift+Enter for a new line</p>
      </form>

      <ModalSurface open={historyOpen} onClose={() => setHistoryOpen(false)} title="Message history" align="left">
        <aside className="flex w-[min(21rem,88vw)] flex-col rounded-2xl border border-[#49335E] bg-[#100B18] p-4 text-[#F5F7FB]">
          <div className="flex items-center justify-between border-b border-[#2B2037] pb-3">
            <h2 className="text-base font-semibold">Message history</h2>
            <button type="button" aria-label="Close message history" onClick={() => setHistoryOpen(false)} className="grid h-11 w-11 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]"><X size={18} /></button>
          </div>
          <p className="py-3 text-xs text-[#93A4BD]">One conversation with NEXI Support</p>
          {messages.length ? <ol className="min-h-0 space-y-1 overflow-y-auto">
            {messages.map((message) => <li key={messageKey(message)}><button type="button" onClick={() => jumpToMessage(message.id)} className="w-full rounded-lg px-3 py-3 text-left hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF]">
              <span className="block text-xs font-semibold text-[#C9B7FF]">{message.senderId === userId ? 'You' : 'NEXI Support'}</span>
              <span className="mt-1 block truncate text-sm text-[#C3BBD0]">{message.body || 'Attachment'}</span>
              <span className="mt-1 block text-[11px] text-[#8C8299]"><LocalDateTime value={message.createdAt} dateStyle="medium" timeStyle="short" /></span>
            </button></li>)}
          </ol> : <p className="py-6 text-sm text-[#8C8299]">Saved messages will appear here.</p>}
        </aside>
      </ModalSurface>
    </main>
  );
}

function MessageBubble({ message, own }: { message: SupportMessage; own: boolean }) {
  return <article data-message-id={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${own ? 'rounded-br-md border border-violet-300/30 bg-[#38245A]' : 'rounded-bl-md border border-[#2B2037] bg-[#171022]'}`}>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#F5F7FB]">{message.body}</p>
      {Array.isArray(message.attachments) && message.attachments.map((attachment) => <AttachmentLink key={attachment.id} attachment={attachment} />)}
      <div className={`mt-2 flex items-center gap-2 text-[11px] ${own ? 'justify-end text-[#D8CCF4]' : 'text-[#93A4BD]'}`}>
        <span><LocalDateTime value={message.createdAt} timeStyle="short" /></span>
        {own && <span className="inline-flex items-center gap-1" aria-label={message.readAt ? 'Read' : 'Sent'}>{message.readAt ? <CheckCheck size={13} /> : <Check size={13} />}{message.readAt ? 'Read' : message.deliveryState || 'Sent'}</span>}
      </div>
    </div>
  </article>;
}

function AttachmentLink({ attachment }: { attachment: SupportAttachment }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = attachment.mimeType.startsWith('image/');

  useEffect(() => {
    if (!isImage || !previewOpen) return;
    let active = true;
    let url: string | null = null;
    const controller = new AbortController();
    void api.get<Blob>(`/communications/support/attachments/${encodeURIComponent(attachment.id)}`, {
      responseType: 'blob',
      signal: controller.signal,
    }).then(({ data }) => {
      if (!active) return;
      url = URL.createObjectURL(data);
      setPreviewUrl(url);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [attachment.id, isImage, previewOpen]);

  const download = async () => {
    setDownloading(true);
    setError(false);
    try {
      const response = await api.get<Blob>(`/communications/support/attachments/${encodeURIComponent(attachment.id)}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setError(true);
    } finally {
      setDownloading(false);
    }
  };
  return <div className="mt-2">
    <div className="flex flex-wrap items-center gap-2">
      {isImage && <button type="button" aria-expanded={previewOpen} onClick={() => { setError(false); setPreviewUrl(null); setPreviewOpen((open) => !open); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 text-xs text-[var(--nexi-text)] hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)]">{previewOpen ? 'Hide preview' : 'Preview image'}</button>}
      <button type="button" onClick={() => void download()} disabled={downloading} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 text-xs text-[#E9E2F5] hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A995FF] disabled:opacity-50">
        {isImage ? <ImageIcon size={15} /> : <FileText size={15} />}<span className="truncate">{downloading ? 'Opening…' : attachment.name}</span>
      </button>
    </div>
    {previewOpen && <div className="mt-2 max-w-full overflow-hidden rounded-lg border border-white/10 bg-black/10 p-2">
      {previewUrl ? <Image src={previewUrl} alt={attachment.name} width={640} height={480} unoptimized className="max-h-64 max-w-full rounded object-contain" /> : !error && <p className="text-xs text-[#93A4BD]" role="status">Loading image preview…</p>}
    </div>}
    {error && <span className="ml-2 text-xs text-rose-200" role="status">Attachment unavailable</span>}
  </div>;
}
