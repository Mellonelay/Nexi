import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { AdminMessage, MessageModerationCase } from "@/admin/types";
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
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [draft, setDraft] = useState("");
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
      (message) =>
        session.actorId &&
        recipientId &&
        ((message.senderId === session.actorId && message.recipientId === recipientId) ||
          (message.recipientId === session.actorId && message.senderId === recipientId)),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const openThread = async (id: string) => {
    setRecipientId(id);
    if (!session.actorId || !id) return;
    const unread = (messages.data ?? []).filter(
      (message) =>
        message.recipientId === session.actorId && message.senderId === id && !message.readAt,
    );
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((message) => provider.markAdminMessageRead(message.id)));
      messages.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not mark messages as read.");
    }
  };

  const sendMessage = async () => {
    if (!session.can("messages.send") || !recipientId || !draft.trim() || !reason.trim()) {
      setFeedback("Choose a client, enter a message, and provide an audit reason.");
      return;
    }
    setSending(true);
    setFeedback(null);
    try {
      await provider.sendAdminMessage({ recipientId, body: draft.trim() }, ctx());
      setDraft("");
      messages.refresh();
      setFeedback("Message sent.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
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
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Audit / moderation reason"
          aria-label="Message moderation reason"
          disabled={busy}
        />
        {feedback && (
          <p role="status" className="text-sm text-muted-foreground">
            {feedback}
          </p>
        )}
        <section className="rounded-lg border border-border/60 p-4" aria-label="Admin conversation">
          <h2 className="mb-3 text-sm font-semibold">Admin and client messages</h2>
          <div className="grid gap-3 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.3fr)]">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Client
              <select
                aria-label="Message client"
                value={recipientId}
                onChange={(event) => void openThread(event.target.value)}
                disabled={!session.can("messages.send") || users.error !== undefined}
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
            <div
              className="max-h-56 space-y-2 overflow-auto rounded-md bg-muted/30 p-3"
              aria-live="polite"
            >
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
                  className="rounded-md border border-border/50 bg-background p-2 text-sm"
                >
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    {message.senderId === session.actorId ? "You" : "Client"} ·{" "}
                    {new Date(message.createdAt).toLocaleString()}
                    {message.recipientId === session.actorId && !message.readAt ? " · Unread" : ""}
                  </p>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <textarea
              aria-label="Message to client"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={10000}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Write a message"
              disabled={!session.can("messages.send") || sending}
            />
            <Button
              className="self-start"
              disabled={
                !session.can("messages.send") ||
                !recipientId ||
                !draft.trim() ||
                !reason.trim() ||
                sending
              }
              onClick={() => void sendMessage()}
            >
              {sending ? "Sending…" : "Send message"}
            </Button>
            {users.error ? (
              <p className="text-xs text-destructive">
                Client list unavailable: {users.error.message}
              </p>
            ) : null}
          </div>
        </section>
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
                disabled={busy}
                onClick={() => void decide(item, "OPEN", "RESTRICTED")}
              >
                Restrict
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void decide(item, "RESOLVED", "ACTIVE")}
              >
                Resolve + restore
              </Button>
            </div>
          )}
        />
        <DataTable
          data={messages.data ?? []}
          columns={messageColumns}
          rowKey={(m) => m.id}
          searchable={(m) => `${m.conversationId ?? ""} ${m.senderId} ${m.recipientId} ${m.body}`}
          searchPlaceholder="Search messages…"
        />
      </div>
    </RouteGuard>
  );
}
