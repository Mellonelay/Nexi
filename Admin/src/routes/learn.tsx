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
import type { AdminLearnArticle } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/learn")({ component: Page });

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listLearnArticles());
  const categoriesQ = useAdminQuery((p) => p.listLearnCategories());
  const [editId, setEditId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [localizations, setLocalizations] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [categoryId, setCategoryId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canPublish = session.can("learn.publish");
  const ctx = () => ({
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason: reason.trim(),
  });

  const reset = () => {
    setEditId(null);
    setSlug("");
    setTitle("");
    setBody("");
    setSummary("");
    setLocalizations("");
    setStatus("DRAFT");
    setCategoryId("");
    setScheduledAt("");
    setTags("");
    setMedia("");
  };

  const articlePayload = () => {
    const parsedMedia = media.trim() ? JSON.parse(media) : [];
    if (!Array.isArray(parsedMedia)) throw new Error("Media must be a JSON array.");
    const localizationValue = localizations.trim() ? JSON.parse(localizations) : undefined;
    return {
      title: title.trim(),
      body: body.trim(),
      ...(summary.trim() ? { summary: summary.trim() } : {}),
      ...(localizationValue !== undefined ? { localizations: localizationValue } : {}),
      status,
      ...(categoryId ? { categoryId } : {}),
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
      media: parsedMedia as Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }>,
    };
  };

  const save = async () => {
    if (!canPublish || !title.trim() || !body.trim() || !reason.trim() || (!editId && !slug.trim())) {
      setFeedback("Slug (for new content), title, body, permission, and audit reason are required.");
      return;
    }
    if (status === "SCHEDULED" && !scheduledAt) {
      setFeedback("Scheduled Learn content requires a schedule time.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const payload = articlePayload();
      if (editId) {
        await provider.updateLearnArticle(editId, payload, ctx());
      } else {
        await provider.createLearnArticle({ slug: slug.trim(), ...payload }, ctx());
      }
      reset();
      q.refresh();
      setFeedback(editId ? "Learn article updated." : "Draft Learn article created.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Learn mutation failed.");
    } finally {
      setBusy(false);
    }
  };

  const createCategory = async () => {
    if (!canPublish || !categorySlug.trim() || !categoryName.trim() || !reason.trim()) {
      setFeedback("Category slug, name, permission, and audit reason are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await provider.createLearnCategory({
        slug: categorySlug.trim(),
        name: categoryName.trim(),
        ...(categoryDescription.trim() ? { description: categoryDescription.trim() } : {}),
        status: "ACTIVE",
      }, ctx());
      setCategorySlug("");
      setCategoryName("");
      setCategoryDescription("");
      categoriesQ.refresh();
      setFeedback("Learn category created.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Learn category creation failed.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async (article: AdminLearnArticle) => {
    if (!canPublish || !reason.trim()) {
      setFeedback("Publish permission and audit reason are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await provider.publishLearnArticle(article.id, ctx());
      q.refresh();
      setFeedback("Learn article published.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Learn publish failed.");
    } finally {
      setBusy(false);
    }
  };

  if (q.loading || categoriesQ.loading) {
    return <RouteGuard permission="learn.view"><LoadingSkeleton rows={6} /></RouteGuard>;
  }
  if (q.error || categoriesQ.error) {
    const error = q.error ?? categoriesQ.error;
    return <RouteGuard permission="learn.view"><ErrorState title="Could not load Learn content" description={error?.message ?? "Unknown error"} /></RouteGuard>;
  }

  const columns: DataTableColumn<AdminLearnArticle>[] = [
    {
      key: "title",
      header: "Title",
      sortValue: (a) => a.title,
      cell: (a) => <div><div>{a.title}</div><span className="mono text-xs text-muted-foreground">{a.slug}</span></div>,
    },
    {
      key: "category",
      header: "Category",
      cell: (a) => a.category?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status,
      cell: (a) => <StatusBadge tone={a.status === "PUBLISHED" ? "success" : "warning"}>{a.status}</StatusBadge>,
    },
    {
      key: "relations",
      header: "Tags / Media / Revisions",
      cell: (a) => `${a.tags.length} / ${a.media.length} / ${a.revisions.length}`,
    },
    {
      key: "updated",
      header: "Updated",
      sortValue: (a) => a.updatedAt,
      cell: (a) => new Date(a.updatedAt).toLocaleString(),
    },
  ];

  return (
    <RouteGuard permission="learn.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Learn Content"
          description="Manage categories, article metadata, scheduling, tags, media, revisions, and publication."
          badges={<ProviderBadge />}
        />

        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2" aria-label="Learn lifecycle controls">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" disabled={!canPublish || busy || !!editId} />
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Audit reason" disabled={!canPublish || busy} />
          <Input className="md:col-span-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" disabled={!canPublish || busy} />
          <Textarea className="md:col-span-2" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" disabled={!canPublish || busy} />
          <Textarea className="md:col-span-2" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Article body" disabled={!canPublish || busy} />
          <Textarea className="md:col-span-2" value={localizations} onChange={(e) => setLocalizations(e.target.value)} placeholder='Localized content JSON, e.g. {"my":{"title":"…","body":"…","summary":"…"}}' disabled={!canPublish || busy} />
          <select className="min-h-10 rounded-md border border-border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} disabled={!canPublish || busy} aria-label="Learn status">
            {["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="min-h-10 rounded-md border border-border bg-background px-3 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!canPublish || busy} aria-label="Learn category">
            <option value="">No category</option>
            {(categoriesQ.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} disabled={!canPublish || busy} aria-label="Learn scheduled at" />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" disabled={!canPublish || busy} />
          <Textarea className="md:col-span-2" value={media} onChange={(e) => setMedia(e.target.value)} placeholder='Media JSON array, e.g. [{"url":"https://…","altText":"…"}]' disabled={!canPublish || busy} />
          <div className="flex gap-2 md:col-span-2">
            <Button onClick={() => void save()} disabled={!canPublish || busy}>{editId ? "Save update" : "Create article"}</Button>
            {editId && <Button variant="outline" onClick={reset} disabled={busy}>Cancel edit</Button>}
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3" aria-label="Learn category controls">
          <Input value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} placeholder="Category slug" disabled={!canPublish || busy} />
          <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" disabled={!canPublish || busy} />
          <Input value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} placeholder="Category description" disabled={!canPublish || busy} />
          <div className="md:col-span-3"><Button variant="outline" onClick={() => void createCategory()} disabled={!canPublish || busy}>Create category</Button></div>
        </section>

        {feedback && <p className="text-sm text-muted-foreground" role="status">{feedback}</p>}

        <DataTable
          data={q.data ?? []}
          columns={columns}
          rowKey={(a) => a.id}
          searchable={(a) => `${a.title} ${a.slug} ${a.status} ${a.category?.name ?? ""}`}
          searchPlaceholder="Search Learn content…"
          rowActions={(a) => (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPublish || busy}
                onClick={() => {
                  setEditId(a.id);
                  setSlug(a.slug);
                  setTitle(a.title);
                  setBody(a.body);
                  setSummary(a.summary ?? "");
                  setLocalizations(a.localizations ? JSON.stringify(a.localizations, null, 2) : "");
                  setStatus(a.status || "DRAFT");
                  setCategoryId(a.categoryId ?? "");
                  setScheduledAt(a.scheduledAt ? a.scheduledAt.slice(0, 16) : "");
                  setTags(a.tags.map((item) => item.tag?.name).filter(Boolean).join(", "));
                  setMedia(a.media.length ? JSON.stringify(a.media.map(({ url, altText, provider, metadata }) => ({ url, altText, provider, metadata })), null, 2) : "");
                }}
              >
                Edit
              </Button>
              {a.status !== "PUBLISHED" && <Button size="sm" disabled={!canPublish || busy} onClick={() => void publish(a)}>Publish</Button>}
            </div>
          )}
        />
      </div>
    </RouteGuard>
  );
}
