import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type {
  AdminNotification,
  AdminOperatorAlert,
  AdminOperatorAlertCategory,
} from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/notifications")({ component: Page });

function Page() {
  const session = useAdminSession();
  if (!session.can("operator_alerts.view") && !session.can("notifications.view"))
    return <p role="alert">You do not have access to notifications.</p>;
  return (
    <div className="flex flex-col gap-6">
      {session.can("operator_alerts.view") && <OperatorAlerts />}
      {session.can("notifications.view") && <CustomerNotifications />}
    </div>
  );
}

function CustomerNotifications() {
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
          title="Customer notifications"
          description="Send customer notifications and inspect delivery/read state."
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

function OperatorAlerts() {
  const provider = useAdminData();
  const q = useAdminQuery((p) =>
    p.listOperatorAlerts
      ? p.listOperatorAlerts()
      : Promise.reject(new Error("Operator alerts are unavailable")),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshAlerts = q.refresh;

  useEffect(() => provider.subscribeToOperatorAlerts?.(refreshAlerts), [provider, refreshAlerts]);

  const categories = q.data?.categories ?? [];
  const disabled = q.data?.disabledCategories ?? [];

  const toggle = async (category: AdminOperatorAlertCategory) => {
    if (!provider.updateOperatorAlertPreferences) return;
    setSaving(true);
    setError(null);
    try {
      const nextDisabled = disabled.includes(category)
        ? disabled.filter((item) => item !== category)
        : [...disabled, category];
      await provider.updateOperatorAlertPreferences(nextDisabled);
      q.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save alert preferences");
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (alert: AdminOperatorAlert) => {
    if (!provider.markOperatorAlertRead) return;
    setError(null);
    try {
      await provider.markOperatorAlertRead(alert.id);
      q.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update alert");
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-label="Operator alerts">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Operator alerts
            <span
              aria-label={
                q.data?.unreadCount ? q.data.unreadCount + " unread alerts" : "No unread alerts"
              }
              className="rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {q.data?.unreadCount ?? 0}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">Durable platform events</p>
        </div>
        <Button variant="outline" onClick={q.refresh}>
          Refresh
        </Button>
      </div>

      <div className="my-4 flex flex-wrap gap-2" aria-label="Alert category preferences">
        {categories.map((category) => (
          <label
            key={category}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={!disabled.includes(category)}
              disabled={saving}
              onChange={() => void toggle(category)}
            />
            {category.toLowerCase()}
          </label>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {q.loading && <LoadingSkeleton rows={3} />}
      {q.error && (
        <div className="flex items-center gap-3">
          <ErrorState title="Could not load operator alerts" description={q.error.message} />
          <Button variant="outline" onClick={q.refresh}>
            Retry
          </Button>
        </div>
      )}
      {!q.loading && !q.error && !q.data?.items.length && (
        <p className="py-6 text-center text-sm text-muted-foreground">No operator alerts.</p>
      )}

      <ul className="divide-y divide-border">
        {q.data?.items.map((alert) => (
          <li key={alert.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={alert.readAt ? "neutral" : "warning"}>
                  {alert.readAt ? "read" : alert.severity.toLowerCase()}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {alert.category.toLowerCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 font-medium">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.summary}</p>
              <a
                href={alert.href}
                className="mt-1 inline-block text-sm underline underline-offset-4"
              >
                Open related record
              </a>
            </div>
            {!alert.readAt && (
              <Button variant="outline" size="sm" onClick={() => void markRead(alert)}>
                Mark read
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
