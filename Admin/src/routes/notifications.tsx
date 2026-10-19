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
import type { AdminNotification } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/notifications")({ component: Page });

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listNotifications());
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("info");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canSend = session.can("notifications.send");
  const send = async () => {
    if (!canSend || !userId.trim() || !title.trim() || !body.trim() || !reason.trim()) {
      setFeedback("User ID, title, body, permission, and audit reason are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await provider.sendNotification(
        {
          userId: userId.trim(),
          type: type.trim() || "info",
          title: title.trim(),
          body: body.trim(),
        },
        {
          actor: session.actorName,
          role: session.roleId,
          environment: session.environment,
          reason: reason.trim(),
        },
      );
      setTitle("");
      setBody("");
      q.refresh();
      setFeedback("Notification durably submitted.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Notification send failed.");
    } finally {
      setBusy(false);
    }
  };

  if (q.loading)
    return (
      <RouteGuard permission="notifications.view">
        <LoadingSkeleton rows={6} />
      </RouteGuard>
    );
  if (q.error)
    return (
      <RouteGuard permission="notifications.view">
        <ErrorState title="Could not load notifications" description={q.error.message} />
      </RouteGuard>
    );
  const columns: DataTableColumn<AdminNotification>[] = [
    {
      key: "created",
      header: "Created",
      sortValue: (n) => n.createdAt,
      cell: (n) => new Date(n.createdAt).toLocaleString(),
    },
    {
      key: "user",
      header: "User",
      sortValue: (n) => n.userId,
      cell: (n) => <span className="mono text-xs">{n.userId}</span>,
    },
    { key: "type", header: "Type", cell: (n) => <StatusBadge tone="info">{n.type}</StatusBadge> },
    {
      key: "title",
      header: "Title",
      sortValue: (n) => n.title,
      cell: (n) => (
        <div>
          <div>{n.title}</div>
          <span className="text-xs text-muted-foreground">{n.body}</span>
        </div>
      ),
    },
    {
      key: "read",
      header: "State",
      cell: (n) => (
        <StatusBadge tone={n.readAt ? "neutral" : "warning"}>
          {n.readAt ? "read" : "unread"}
        </StatusBadge>
      ),
    },
  ];
  return (
    <RouteGuard permission="notifications.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Notifications"
          description="Send targeted notifications and inspect delivery/read state."
          badges={<ProviderBadge />}
        />
        <section
          className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
          aria-label="Notification send controls"
        >
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Recipient user UUID"
            disabled={!canSend || busy}
          />
          <Input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Type"
            disabled={!canSend || busy}
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            disabled={!canSend || busy}
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Audit reason"
            disabled={!canSend || busy}
          />
          <Textarea
            className="md:col-span-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification body"
            disabled={!canSend || busy}
          />
          <div className="md:col-span-2">
            <Button onClick={() => void send()} disabled={!canSend || busy}>
              Send notification
            </Button>
          </div>
          {feedback && (
            <p className="text-sm text-muted-foreground md:col-span-2" role="status">
              {feedback}
            </p>
          )}
        </section>
        <DataTable
          data={q.data ?? []}
          columns={columns}
          rowKey={(n) => n.id}
          searchable={(n) => `${n.userId} ${n.type} ${n.title} ${n.body}`}
          searchPlaceholder="Search notifications…"
        />
      </div>
    </RouteGuard>
  );
}
