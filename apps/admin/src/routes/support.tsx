import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { ErrorState, LoadingSkeleton } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { SupportTicket, TicketStatus } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/support")({ component: Page });

const statusTone = (status: TicketStatus) =>
  status === "resolved" ? "success" as const : status === "escalated" ? "destructive" as const : status === "pending_user" ? "warning" as const : "info" as const;

function Page() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listTickets());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [reason, setReason] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canReply = session.can("support.reply");
  const tickets = useMemo(() => q.data ?? [], [q.data]);
  const selected = selectedId ? tickets.find((ticket) => ticket.id === selectedId) ?? null : null;
  const ctx = () => ({ actor: session.actorName, role: session.roleId, environment: session.environment, reason: reason.trim() });

  const submitReply = async () => {
    if (!selected || !canReply || !reply.trim() || !reason.trim()) { setFeedback("Ticket, reply, permission, and audit reason are required."); return; }
    setBusy(true); setFeedback(null);
    try {
      await provider.replyTicket(selected.id, reply.trim(), internal, ctx());
      setReply(""); setInternal(false); q.refresh(); setFeedback("Support reply submitted to the live authority.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Support reply failed."); }
    finally { setBusy(false); }
  };

  const changeStatus = async (status: TicketStatus) => {
    if (!selected || !canReply || !reason.trim()) { setFeedback("Ticket, permission, and audit reason are required."); return; }
    setBusy(true); setFeedback(null);
    try { await provider.setTicketStatus(selected.id, status, ctx()); q.refresh(); setFeedback(`Ticket status changed to ${status}.`); }
    catch (error) { setFeedback(error instanceof Error ? error.message : "Ticket status change failed."); }
    finally { setBusy(false); }
  };

  if (q.loading) return <RouteGuard permission="support.view"><LoadingSkeleton rows={6} /></RouteGuard>;
  if (q.error) return <RouteGuard permission="support.view"><ErrorState title="Could not load support tickets" description={q.error.message} /></RouteGuard>;

  const columns: DataTableColumn<SupportTicket>[] = [
    { key: "subject", header: "Subject", sortValue: (ticket) => ticket.subject, cell: (ticket) => <div><div className="font-medium">{ticket.subject}</div><span className="mono text-xs text-muted-foreground">{ticket.id}</span></div> },
    { key: "user", header: "User", cell: (ticket) => <span className="mono text-xs">{ticket.userId}</span> },
    { key: "priority", header: "Priority", sortValue: (ticket) => ticket.priority, cell: (ticket) => <StatusBadge tone={ticket.priority === "urgent" ? "destructive" : ticket.priority === "high" ? "warning" : "neutral"}>{ticket.priority}</StatusBadge> },
    { key: "status", header: "Status", sortValue: (ticket) => ticket.status, cell: (ticket) => <StatusBadge tone={statusTone(ticket.status)}>{ticket.status}</StatusBadge> },
    { key: "updated", header: "Updated", sortValue: (ticket) => ticket.updatedAt, cell: (ticket) => new Date(ticket.updatedAt).toLocaleString() },
  ];

  return (
    <RouteGuard permission="support.view">
      <div className="flex flex-col gap-6">
        <PageHeader title="Support" description="Inspect authoritative ticket state, reply, and control ticket lifecycle." badges={<StatusBadge tone="success">Live API</StatusBadge>} />
        <DataTable data={tickets} columns={columns} rowKey={(ticket) => ticket.id} searchable={(ticket) => `${ticket.id} ${ticket.userId} ${ticket.subject} ${ticket.status} ${ticket.priority}`} searchPlaceholder="Search tickets…" onRowClick={(ticket) => setSelectedId(ticket.id)} rowActions={(ticket) => <Button variant="outline" size="sm" onClick={() => setSelectedId(ticket.id)}>Inspect</Button>} />
        {selected ? (
          <section className="grid gap-4 rounded-xl border border-border bg-card p-4" aria-label="Support ticket authority controls">
            <div className="flex flex-wrap items-center gap-2"><strong>{selected.subject}</strong><StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge><span className="mono text-xs text-muted-foreground">{selected.id}</span></div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">{selected.messages.length ? selected.messages.map((message) => <article key={message.id} className="rounded-md bg-muted/40 p-3"><div className="mb-1 flex gap-2 text-xs text-muted-foreground"><span className="mono">{message.author}</span><span>{new Date(message.ts).toLocaleString()}</span>{message.internal && <StatusBadge tone="warning">internal</StatusBadge>}</div><p className="whitespace-pre-wrap text-sm">{message.body}</p></article>) : <p className="text-sm text-muted-foreground">No replies yet.</p>}</div>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Audit reason" disabled={!canReply || busy} />
            <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply body" disabled={!canReply || busy} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} disabled={!canReply || busy} />Internal note</label>
            <div className="flex flex-wrap gap-2"><Button onClick={() => void submitReply()} disabled={!canReply || busy}>Send reply</Button>{(["open", "pending_user", "resolved", "escalated"] as TicketStatus[]).filter((status) => status !== selected.status).map((status) => <Button key={status} variant="outline" onClick={() => void changeStatus(status)} disabled={!canReply || busy}>Mark {status}</Button>)}</div>
            {feedback && <p className="text-sm text-muted-foreground" role="status">{feedback}</p>}
          </section>
        ) : null}
      </div>
    </RouteGuard>
  );
}
