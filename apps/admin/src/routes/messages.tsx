import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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

  if (messages.loading || moderation.loading) {
    return <RouteGuard permission="messages.view"><LoadingSkeleton rows={6} /></RouteGuard>;
  }
  if (messages.error || moderation.error) {
    const error = messages.error ?? moderation.error;
    return <RouteGuard permission="messages.view"><ErrorState title="Could not load messages" description={error?.message ?? "Unknown error"} /></RouteGuard>;
  }

  const messageColumns: DataTableColumn<AdminMessage>[] = [
    { key: "created", header: "Created", sortValue: (m) => m.createdAt, cell: (m) => new Date(m.createdAt).toLocaleString() },
    { key: "conversation", header: "Conversation", cell: (m) => <span className="mono text-xs">{m.conversationId ?? "legacy/unassigned"}</span> },
    { key: "sender", header: "Sender", sortValue: (m) => m.senderId, cell: (m) => <span className="mono text-xs">{m.senderId}</span> },
    { key: "recipient", header: "Recipient", sortValue: (m) => m.recipientId, cell: (m) => <span className="mono text-xs">{m.recipientId}</span> },
    { key: "state", header: "Delivery", cell: (m) => <StatusBadge tone="info">{m.deliveryState}</StatusBadge> },
    { key: "body", header: "Message", cell: (m) => <span className="line-clamp-2">{m.body}</span> },
  ];

  const moderationColumns: DataTableColumn<MessageModerationCase>[] = [
    { key: "created", header: "Created", sortValue: (m) => m.createdAt, cell: (m) => new Date(m.createdAt).toLocaleString() },
    { key: "conversation", header: "Conversation", cell: (m) => <span className="mono text-xs">{m.conversationId}</span> },
    { key: "reporter", header: "Reporter", cell: (m) => <span className="mono text-xs">{m.reporterId}</span> },
    { key: "reason", header: "Reason", cell: (m) => <span className="line-clamp-2">{m.reason}</span> },
    { key: "state", header: "Status", cell: (m) => <StatusBadge tone={m.status === "RESOLVED" ? "success" : "warning"}>{m.status}</StatusBadge> },
    { key: "conversationState", header: "Conversation state", cell: (m) => m.conversation?.state ?? "ACTIVE" },
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
        {feedback && <p role="status" className="text-sm text-muted-foreground">{feedback}</p>}
        <DataTable
          data={moderation.data ?? []}
          columns={moderationColumns}
          rowKey={(item) => item.id}
          searchable={(item) => `${item.conversationId} ${item.reporterId} ${item.reason} ${item.status}`}
          searchPlaceholder="Search moderation cases…"
          rowActions={(item) => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide(item, "OPEN", "RESTRICTED")}>Restrict</Button>
              <Button size="sm" disabled={busy} onClick={() => void decide(item, "RESOLVED", "ACTIVE")}>Resolve + restore</Button>
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
