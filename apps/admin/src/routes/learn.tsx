import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { AdminLearnArticle } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/learn")({ component: Page });

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listLearnArticles());
  const [editId, setEditId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canPublish = session.can("learn.publish");
  const ctx = () => ({ actor: session.actorName, role: session.roleId, environment: session.environment, reason: reason.trim() });
  const reset = () => { setEditId(null); setSlug(""); setTitle(""); setBody(""); };
  const save = async () => {
    if (!canPublish || !title.trim() || !body.trim() || !reason.trim() || (!editId && !slug.trim())) { setFeedback("Slug (for new content), title, body, permission, and audit reason are required."); return; }
    setBusy(true); setFeedback(null);
    try {
      if (editId) await provider.updateLearnArticle(editId, { title: title.trim(), body: body.trim() }, ctx());
      else await provider.createLearnArticle({ slug: slug.trim(), title: title.trim(), body: body.trim(), status: "DRAFT" }, ctx());
      reset(); q.refresh(); setFeedback(editId ? "Learn article updated." : "Draft Learn article created.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Learn mutation failed."); }
    finally { setBusy(false); }
  };
  const publish = async (article: AdminLearnArticle) => {
    if (!canPublish || !reason.trim()) { setFeedback("Publish permission and audit reason are required."); return; }
    setBusy(true); setFeedback(null);
    try { await provider.publishLearnArticle(article.id, ctx()); q.refresh(); setFeedback("Learn article published."); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Learn publish failed."); }
    finally { setBusy(false); }
  };

  if (q.loading) return <RouteGuard permission="learn.view"><LoadingSkeleton rows={6} /></RouteGuard>;
  if (q.error) return <RouteGuard permission="learn.view"><ErrorState title="Could not load Learn articles" description={q.error.message} /></RouteGuard>;
  const columns: DataTableColumn<AdminLearnArticle>[] = [
    { key: "title", header: "Title", sortValue: (a) => a.title, cell: (a) => <div><div>{a.title}</div><span className="mono text-xs text-muted-foreground">{a.slug}</span></div> },
    { key: "status", header: "Status", sortValue: (a) => a.status, cell: (a) => <StatusBadge tone={a.status === "PUBLISHED" ? "success" : "warning"}>{a.status}</StatusBadge> },
    { key: "updated", header: "Updated", sortValue: (a) => a.updatedAt, cell: (a) => new Date(a.updatedAt).toLocaleString() },
  ];
  return (
    <RouteGuard permission="learn.view">
      <div className="flex flex-col gap-6">
        <PageHeader title="Learn Content" description="Create, update, and publish durable Learn content." badges={<StatusBadge tone="success">Live API</StatusBadge>} />
        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2" aria-label="Learn lifecycle controls">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" disabled={!canPublish || busy || !!editId} />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Audit reason" disabled={!canPublish || busy} />
          <Input className="md:col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" disabled={!canPublish || busy} />
          <Textarea className="md:col-span-2" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Article body" disabled={!canPublish || busy} />
          <div className="flex gap-2 md:col-span-2"><Button onClick={() => void save()} disabled={!canPublish || busy}>{editId ? "Save update" : "Create draft"}</Button>{editId && <Button variant="outline" onClick={reset} disabled={busy}>Cancel edit</Button>}</div>
          {feedback && <p className="text-sm text-muted-foreground md:col-span-2" role="status">{feedback}</p>}
        </section>
        <DataTable data={q.data ?? []} columns={columns} rowKey={(a) => a.id} searchable={(a) => `${a.title} ${a.slug} ${a.status}`} searchPlaceholder="Search Learn content…" rowActions={(a) => <div className="flex gap-2"><Button variant="outline" size="sm" disabled={!canPublish || busy} onClick={() => { setEditId(a.id); setSlug(a.slug); setTitle(a.title); setBody(a.body); }}>Edit</Button>{a.status !== "PUBLISHED" && <Button size="sm" disabled={!canPublish || busy} onClick={() => void publish(a)}>Publish</Button>}</div>} />
      </div>
    </RouteGuard>
  );
}
