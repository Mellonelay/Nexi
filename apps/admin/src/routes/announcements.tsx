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
import type { Announcement } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/announcements")({ component: Page });

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listAnnouncements());
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [targeting, setTargeting] = useState("");
  const [localizations, setLocalizations] = useState("");
  const [pinned, setPinned] = useState(false);
  const [pinOrder, setPinOrder] = useState("0");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canPublish = session.can("announcements.publish");
  const ctx = () => ({
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason: reason.trim(),
  });

  const reset = () => {
    setEditId(null);
    setTitle("");
    setBody("");
    setStartsAt("");
    setEndsAt("");
    setTargeting("");
    setLocalizations("");
    setPinned(false);
    setPinOrder("0");
  };
  const save = async () => {
    if (!canPublish || !title.trim() || !body.trim() || !reason.trim()) {
      setFeedback("Title, body, permission, and audit reason are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const targetingValue = targeting.trim() ? JSON.parse(targeting) : undefined;
      const localizationValue = localizations.trim() ? JSON.parse(localizations) : undefined;
      const lifecycle = {
        ...(localizationValue !== undefined ? { localizations: localizationValue } : {}),
        pinned,
        pinOrder: Number(pinOrder || 0),
        ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
        ...(targetingValue !== undefined ? { targeting: targetingValue } : {}),
      };
      if (editId)
        await provider.updateAnnouncement(
          editId,
          { title: title.trim(), body: body.trim(), ...lifecycle },
          ctx(),
        );
      else
        await provider.createAnnouncement(
          { title: title.trim(), body: body.trim(), published: false, ...lifecycle },
          ctx(),
        );
      reset();
      q.refresh();
      setFeedback(editId ? "Announcement updated." : "Draft announcement created.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Announcement mutation failed.");
    } finally {
      setBusy(false);
    }
  };
  const publish = async (item: Announcement) => {
    if (!canPublish || !reason.trim()) {
      setFeedback("Publish permission and audit reason are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await provider.publishAnnouncement(item.id, ctx());
      q.refresh();
      setFeedback("Announcement published.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Announcement publish failed.");
    } finally {
      setBusy(false);
    }
  };

  if (q.loading)
    return (
      <RouteGuard permission="announcements.view">
        <LoadingSkeleton rows={6} />
      </RouteGuard>
    );
  if (q.error)
    return (
      <RouteGuard permission="announcements.view">
        <ErrorState title="Could not load announcements" description={q.error.message} />
      </RouteGuard>
    );
  const columns: DataTableColumn<Announcement>[] = [
    { key: "title", header: "Title", sortValue: (a) => a.title, cell: (a) => a.title },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status,
      cell: (a) => (
        <StatusBadge tone={a.status === "published" ? "success" : "warning"}>
          {a.status}
        </StatusBadge>
      ),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      cell: (a) => (a.scheduledAt ? new Date(a.scheduledAt).toLocaleString() : "—"),
    },
    {
      key: "published",
      header: "Published",
      cell: (a) => (a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "—"),
    },
    {
      key: "pinned",
      header: "Pinned",
      cell: (a) => a.pinned ? `Yes · ${a.pinOrder}` : "No",
    },
  ];
  return (
    <RouteGuard permission="announcements.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Announcements"
          description="Draft, update, and publish announcements."
          badges={<ProviderBadge />}
        />
        <section
          className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
          aria-label="Announcement lifecycle controls"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            disabled={!canPublish || busy}
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Audit reason"
            disabled={!canPublish || busy}
          />
          <Textarea
            className="md:col-span-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Announcement body"
            disabled={!canPublish || busy}
          />
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            aria-label="Announcement starts at"
            disabled={!canPublish || busy}
          />
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            aria-label="Announcement ends at"
            disabled={!canPublish || busy}
          />
          <Textarea
            className="md:col-span-2"
            value={targeting}
            onChange={(e) => setTargeting(e.target.value)}
            placeholder='Optional targeting JSON, for example {"roles":["VIP"]}'
            disabled={!canPublish || busy}
          />
          <Textarea
            className="md:col-span-2"
            value={localizations}
            onChange={(e) => setLocalizations(e.target.value)}
            placeholder='Localized content JSON, for example {"my":{"title":"…","body":"…"}}'
            disabled={!canPublish || busy}
          />
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} disabled={!canPublish || busy} />
            Pin announcement
          </label>
          <Input type="number" min="0" value={pinOrder} onChange={(e) => setPinOrder(e.target.value)} aria-label="Announcement pin order" disabled={!canPublish || busy} />
          <div className="flex gap-2 md:col-span-2">
            <Button onClick={() => void save()} disabled={!canPublish || busy}>
              {editId ? "Save update" : "Create draft"}
            </Button>
            {editId && (
              <Button variant="outline" onClick={reset} disabled={busy}>
                Cancel edit
              </Button>
            )}
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
          rowKey={(a) => a.id}
          searchable={(a) => `${a.title} ${a.status}`}
          searchPlaceholder="Search announcements…"
          rowActions={(a) => (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPublish || busy}
                onClick={() => {
                  setEditId(a.id);
                  setTitle(a.title);
                  setBody(a.body ?? "");
                  setStartsAt(a.scheduledAt ? a.scheduledAt.slice(0, 16) : "");
                  setEndsAt(a.endsAt ? a.endsAt.slice(0, 16) : "");
                  setTargeting(a.targeting === undefined || a.targeting === null ? "" : JSON.stringify(a.targeting));
                  setLocalizations(a.localizations ? JSON.stringify(a.localizations, null, 2) : "");
                  setPinned(a.pinned);
                  setPinOrder(String(a.pinOrder));
                }}
              >
                Edit
              </Button>
              {a.status !== "published" && (
                <Button size="sm" disabled={!canPublish || busy} onClick={() => void publish(a)}>
                  Publish
                </Button>
              )}
            </div>
          )}
        />
      </div>
    </RouteGuard>
  );
}
