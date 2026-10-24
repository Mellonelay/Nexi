import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { AdminMessage, MessageModerationCase } from "@/admin/types";
import { groupAdminMessageConversations } from "@/admin/data/message-conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/messages")({ component: Page });

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const messages = useAdminQuery((p) => p.listMessages());
  const moderation = useAdminQuery((p) => p.listMessageModeration());
  const users = useAdminQuery((p) => p.listUsers());
  const refreshMessages = messages.refresh;
  const refreshModeration = moderation.refresh;
  useEffect(() => provider.subscribeToCommunications?.(() => {
    refreshMessages();
    refreshModeration();
  }), [provider, refreshMessages, refreshModeration]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationStatus, setConversationStatus] = useState<"all" | "unread">("all");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; mimeType: string; size: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingMessageKey, setPendingMessageKey] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState === "visible") {
        refreshMessages();
        refreshModeration();
      }
    };
    const timer = window.setInterval(refreshVisible, 15_000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refreshMessages, refreshModeration]);
  const ctx = () => ({
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason: reason.trim(),
  });

  const decide = async (
    item: MessageModerationCase,
    status: "OPEN" | "RESOLVED",
    conversationState?: "ACTIVE" | "RESTRICTED",
  ) => {
    if (!reason.trim()) {
      setFeedback("Audit reason is required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await provider.resolveMessageModeration(
        item.id,
        {
          status,
          conversationState,
          ...(status === "RESOLVED" ? { resolution: reason.trim() } : {}),
        },
        ctx(),
      );
      moderation.refresh();
      messages.refresh();
      setFeedback("Moderation state updated.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Moderation update failed.");
    } finally {
      setBusy(false);
    }
  };

  const threadMessages = (messages.data ?? [])
    .filter(
      (message) => {
        if (!recipientId || !session.actorId) return false;
        if (selectedConversationId.startsWith("legacy:")) {
          return (
            !message.supportCustomerId &&
            (message.conversationId === null || message.conversationId === undefined) &&
            ((message.senderId === session.actorId && message.recipientId === recipientId) ||
              (message.recipientId === session.actorId && message.senderId === recipientId))
          );
        }
        if (selectedConversationId) return message.conversationId === selectedConversationId;
        return (
          (message.senderId === session.actorId && message.recipientId === recipientId) ||
          (message.recipientId === session.actorId && message.senderId === recipientId)
        );
      },
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const conversations = useMemo(
    () => groupAdminMessageConversations(messages.data ?? [], session.actorId ?? ""),
    [messages.data, session.actorId],
  );
  const selectedConversation = conversations.find((item) => item.conversationId === selectedConversationId);
  const visibleConversations = conversations.filter((conversation) => {
    if (conversationStatus === "unread" && conversation.unreadCount === 0) return false;
    const client = (users.data ?? []).find((user) => user.id === conversation.clientId);
    const query = conversationSearch.trim().toLowerCase();
    return (
      !query ||
      `${client?.displayName ?? ""} ${client?.email ?? ""} ${conversation.clientId}`
        .toLowerCase()
        .includes(query)
    );
  });
  const selectedClient = (users.data ?? []).find((user) => user.id === recipientId);
  const selectedClientLabel = selectedClient?.displayName || selectedClient?.email || recipientId;

  const openThread = useCallback(async (id: string, conversationId?: string) => {
    setRecipientId(id);
    setSelectedConversationId(conversationId ?? "");
    if (!session.actorId || !id) return;
    const conversation = conversations.find((item) => item.conversationId === conversationId);
    const unread = (messages.data ?? []).filter(
      (message) =>
        !message.readAt && (conversation?.support
          ? message.conversationId === conversation.conversationId && message.recipientId === "support:nexi"
          : message.recipientId === session.actorId && message.senderId === id),
    );
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((message) => provider.markAdminMessageRead(message.id)));
      messages.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not mark messages as read.");
    }
  }, [conversations, messages.data, messages.refresh, provider, session.actorId]);

  useEffect(() => {
    if (!recipientId && conversations.length) {
      void openThread(conversations[0].clientId, conversations[0].conversationId);
    }
  }, [conversations, openThread, recipientId]);

  const sendMessage = async () => {
    if (!session.can("messages.send") || !recipientId || (!draft.trim() && !attachments.length) || !reason.trim()) {
      setFeedback("Choose a client, enter a message, and provide an audit reason.");
      return;
    }
    setSending(true);
    setFeedback(null);
    const body = draft.trim();
    const idempotencyKey = pendingMessageKey ?? globalThis.crypto?.randomUUID?.() ?? `admin-message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setPendingMessageKey(idempotencyKey);
    try {
      await provider.sendAdminMessage({
        recipientId,
        ...(selectedConversation?.support ? { conversationId: selectedConversation.conversationId } : {}),
        body,
        ...(attachments.length ? { attachmentIds: attachments.map((item) => item.id) } : {}),
        idempotencyKey,
      }, ctx());
      setDraft("");
      setAttachments([]);
      setPendingMessageKey(null);
      messages.refresh();
      setFeedback("Message sent.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const uploadAttachments = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (!selectedConversation?.support || !recipientId) {
      setFeedback("Attachments are available in NEXI support conversations.");
      return;
    }
    if (files.length + attachments.length > 4) {
      setFeedback("A message can include up to four attachments.");
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      for (const file of files) {
        const uploaded = await provider.uploadAdminMessageAttachment(recipientId, file);
        setAttachments((current) => [...current, uploaded]);
        setPendingMessageKey(null);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Attachment upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (attachment: NonNullable<AdminMessage["attachments"]>[number]) => {
    if (!recipientId) return;
    try {
      const blob = await provider.getAdminMessageAttachment(recipientId, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Attachment could not be downloaded.");
    }
  };

  if (messages.loading || moderation.loading || users.loading) {
    return (
      <RouteGuard permission="messages.view">
        <LoadingSkeleton rows={6} />
      </RouteGuard>
    );
  }
  if (messages.error || moderation.error) {
    const error = messages.error ?? moderation.error;
    return (
      <RouteGuard permission="messages.view">
        <ErrorState
          title="Could not load messages"
          description={error?.message ?? "Unknown error"}
        />
      </RouteGuard>
    );
  }

  const messageColumns: DataTableColumn<AdminMessage>[] = [
    {
      key: "created",
      header: "Created",
      sortValue: (m) => m.createdAt,
      cell: (m) => new Date(m.createdAt).toLocaleString(),
    },
    {
      key: "conversation",
      header: "Conversation",
      cell: (m) => <span className="mono text-xs">{m.conversationId ?? "legacy/unassigned"}</span>,
    },
    {
      key: "sender",
      header: "Sender",
      sortValue: (m) => m.senderId,
      cell: (m) => <span className="mono text-xs">{m.senderId}</span>,
    },
    {
      key: "recipient",
      header: "Recipient",
      sortValue: (m) => m.recipientId,
      cell: (m) => <span className="mono text-xs">{m.recipientId}</span>,
    },
    {
      key: "state",
      header: "Delivery",
      cell: (m) => <StatusBadge tone="info">{m.deliveryState}</StatusBadge>,
    },
    { key: "body", header: "Message", cell: (m) => <span className="line-clamp-2">{m.body}</span> },
  ];

  const moderationColumns: DataTableColumn<MessageModerationCase>[] = [
    {
      key: "created",
      header: "Created",
      sortValue: (m) => m.createdAt,
      cell: (m) => new Date(m.createdAt).toLocaleString(),
    },
    {
      key: "conversation",
      header: "Conversation",
      cell: (m) => <span className="mono text-xs">{m.conversationId}</span>,
    },
    {
      key: "reporter",
      header: "Reporter",
      cell: (m) => <span className="mono text-xs">{m.reporterId}</span>,
    },
    {
      key: "reason",
      header: "Reason",
      cell: (m) => <span className="line-clamp-2">{m.reason}</span>,
    },
    {
      key: "state",
      header: "Status",
      cell: (m) => (
        <StatusBadge tone={m.status === "RESOLVED" ? "success" : "warning"}>{m.status}</StatusBadge>
      ),
    },
    {
      key: "conversationState",
      header: "Conversation state",
      cell: (m) => m.conversation?.state ?? "ACTIVE",
    },
  ];

  return (
    <RouteGuard permission="messages.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Messages"
          description="Observe durable conversations and resolve user-reported moderation cases."
          badges={<ProviderBadge />}
        />
        <label className="flex max-w-2xl flex-col gap-1 text-xs text-muted-foreground">
          Audit reason for replies or moderation actions
          <Input
            id="messages-audit-reason"
            name="messages-audit-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setPendingMessageKey(null);
            }}
            placeholder="Enter the reason for this action"
            disabled={busy || sending}
          />
        </label>
        {feedback && (
          <p role="status" className="text-sm text-muted-foreground">
            {feedback}
          </p>
        )}
        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <section
            className="min-w-0 rounded-lg border border-border/60 p-4"
            aria-label="Message conversations"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Conversations</h2>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Status
                <select
                  id="message-conversation-status"
                  name="message-conversation-status"
                  aria-label="Conversation status filter"
                  value={conversationStatus}
                  onChange={(event) =>
                    setConversationStatus(event.target.value as "all" | "unread")
                  }
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                </select>
              </label>
            </div>
            <Input
              id="message-conversation-search"
              name="message-conversation-search"
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search client or ID"
              aria-label="Search message conversations"
            />
            <div className="mt-3 max-h-[30rem] space-y-1 overflow-auto" role="list">
              {visibleConversations.map((conversation) => {
                const client = (users.data ?? []).find((user) => user.id === conversation.clientId);
                const name = client?.displayName || client?.email || conversation.clientId;
                const selected = selectedConversationId === conversation.conversationId;
                return (
                  <div key={conversation.conversationId} role="listitem">
                    <button
                      type="button"
                      aria-current={selected ? "true" : undefined}
                      onClick={() => {
                        setPendingMessageKey(null);
                        void openThread(conversation.clientId, conversation.conversationId);
                      }}
                      disabled={sending}
                      className={`flex w-full items-start justify-between gap-3 rounded-md border-b border-border/50 p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "bg-primary/10" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {conversation.support ? `NEXI Support · ${name}` : name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {conversation.latestMessage.body}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[11px] text-muted-foreground">
                          {new Date(conversation.latestMessage.createdAt).toLocaleDateString()}
                        </span>
                        {conversation.unreadCount ? (
                          <StatusBadge tone="primary">
                            {conversation.unreadCount} unread
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="success">Read</StatusBadge>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
              {!visibleConversations.length ? (
                <p className="p-3 text-sm text-muted-foreground">
                  {conversations.length
                    ? "No conversations match these filters."
                    : "No conversations yet."}
                </p>
              ) : null}
            </div>
            <label className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
              Open or start a conversation
              <select
                id="message-client"
                name="message-client"
                aria-label="Message client"
                value={recipientId}
                onChange={(event) => {
                  setPendingMessageKey(null);
                  setSelectedConversationId("");
                  void openThread(event.target.value);
                }}
                disabled={sending || !session.can("messages.send") || users.error !== undefined}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
              >
                <option value="">Choose a client</option>
                {(users.data ?? [])
                  .filter((user) => user.id !== session.actorId)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} · {user.email}
                    </option>
                  ))}
              </select>
            </label>
            {users.error ? (
              <p className="mt-2 text-xs text-destructive">
                Client list unavailable: {users.error.message}
              </p>
            ) : null}
          </section>
          <section
            className="flex min-h-80 min-w-0 flex-col rounded-lg border border-border/60 p-4"
            aria-label="Selected client conversation"
          >
            <h2 className="text-sm font-semibold">
              {recipientId ? `Conversation · ${selectedClientLabel}` : "Select a conversation"}
            </h2>
            <p className="mt-1 border-b border-border/50 pb-3 text-xs text-muted-foreground">
              Client identity · message history · delivery status
            </p>
            <div className="my-3 min-h-32 flex-1 space-y-2 overflow-y-auto" aria-live="polite">
              {!session.actorId ? (
                <p className="text-sm text-muted-foreground">Admin identity is unavailable.</p>
              ) : null}
              {session.actorId && recipientId && threadMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Start this conversation with a message.
                </p>
              ) : null}
              {threadMessages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[92%] rounded-md border border-border/50 p-3 text-sm ${message.senderId === session.actorId ? "ml-auto bg-primary/10" : "bg-muted/30"}`}
                >
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    {message.senderId === session.actorId ? "You" : message.senderId === "support:nexi" ? "NEXI Support" : "Client"} ·{" "}
                    {new Date(message.createdAt).toLocaleString()}
                    {` · ${message.deliveryState}`}
                    {(message.recipientId === session.actorId || (message.supportCustomerId && message.recipientId === "support:nexi")) && !message.readAt ? " · Unread" : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  {message.attachments?.map((attachment) => (
                    <Button key={attachment.id} type="button" variant="outline" size="sm" className="mt-2 mr-2" onClick={() => void downloadAttachment(attachment)}>
                      Download {attachment.name}
                    </Button>
                  ))}
                </article>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
              <label htmlFor="message-to-client" className="text-xs text-muted-foreground">
                Reply to client
              </label>
              {attachments.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Attachments ready to send">
                  {attachments.map((item) => (
                    <li key={item.id} className="flex max-w-full items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                      <span className="max-w-48 truncate">{item.name}</span>
                      <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${item.name}`} onClick={() => { setAttachments((current) => current.filter((attachment) => attachment.id !== item.id)); setPendingMessageKey(null); }}>Remove</Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <textarea
                id="message-to-client"
                name="message-to-client"
                aria-label="Message to client"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setPendingMessageKey(null);
                }}
                rows={3}
                maxLength={10000}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Write a message"
                disabled={!session.can("messages.send") || sending}
              />
              <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => void uploadAttachments(event)} className="sr-only" aria-label="Choose message attachments" />
              <Button type="button" variant="outline" className="self-start" disabled={!session.can("messages.send") || !selectedConversation?.support || uploading || sending} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Uploading…" : "Attach files"}
              </Button>
              <Button
                className="self-start"
                disabled={
                  !session.can("messages.send") ||
                  !recipientId ||
                  (!draft.trim() && !attachments.length) ||
                  uploading ||
                  !reason.trim() ||
                  sending
                }
                onClick={() => void sendMessage()}
              >
                {sending ? "Sending…" : "Send message"}
              </Button>
            </div>
          </section>
        </section>
        <details className="border-t border-border/60 pt-3">
          <summary className="cursor-pointer text-sm font-medium">Message moderation cases</summary>
          <div className="pt-3">
            <DataTable
              data={moderation.data ?? []}
              columns={moderationColumns}
              rowKey={(item) => item.id}
              searchable={(item) =>
                `${item.conversationId} ${item.reporterId} ${item.reason} ${item.status}`
              }
              searchPlaceholder="Search moderation cases…"
              rowActions={(item) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || !session.can("messages.send")}
                    onClick={() => void decide(item, "OPEN", "RESTRICTED")}
                  >
                    Restrict
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || !session.can("messages.send")}
                    onClick={() => void decide(item, "RESOLVED", "ACTIVE")}
                  >
                    Resolve + restore
                  </Button>
                </div>
              )}
            />
          </div>
        </details>
        <details className="border-t border-border/60 pt-3">
          <summary className="cursor-pointer text-sm font-medium">All message records</summary>
          <div className="pt-3">
            <DataTable
              data={messages.data ?? []}
              columns={messageColumns}
              rowKey={(message) => message.id}
              searchable={(message) =>
                `${message.conversationId ?? ""} ${message.senderId} ${message.recipientId} ${message.body}`
              }
              searchPlaceholder="Search messages…"
            />
          </div>
        </details>
      </div>
    </RouteGuard>
  );
}
