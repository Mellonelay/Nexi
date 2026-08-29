import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { FormDrawer } from "@/admin/components/FormDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  AdminUser,
  ReconciliationItem,
  ReconciliationMismatchType,
  ReconciliationSeverity,
  ReconciliationStatus,
} from "@/admin/types";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RotateCcw, UserCog, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/reconciliation")({ component: Page });

type PendingStatus = { row: ReconciliationItem; next: ReconciliationStatus };

function Page() {
  return (
    <RouteGuard permission="reconciliation.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listReconciliation());
  const adminsQ = useAdminQuery((p) => p.listAdmins());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assign, setAssign] = useState<ReconciliationItem | null>(null);
  const [note, setNote] = useState<ReconciliationItem | null>(null);
  const [pending, setPending] = useState<PendingStatus | null>(null);

  const rows = useMemo(() => q.data ?? [], [q.data]);
  const admins = adminsQ.data ?? [];
  const selected = useMemo(
    () => (selectedId ? (rows.find((r) => r.id === selectedId) ?? null) : null),
    [rows, selectedId],
  );

  if (q.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (q.error)
    return (
      <Shell>
        <ErrorState title="Could not load reconciliation queue" description={q.error.message} />
      </Shell>
    );

  const canResolve = session.can("reconciliation.resolve");
  const open = rows.filter((r) => r.status === "open" || r.status === "reopened").length;
  const critical = rows.filter(
    (r) => r.severity === "critical" && r.status !== "resolved" && r.status !== "dismissed",
  ).length;

  const columns: DataTableColumn<ReconciliationItem>[] = [
    {
      key: "id",
      header: "Item",
      sortValue: (r) => r.id,
      cell: (r) => <span className="mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "type",
      header: "Mismatch",
      cell: (r) => <span className="mono text-[11px]">{formatType(r.mismatchType)}</span>,
    },
    {
      key: "asset",
      header: "Asset",
      cell: (r) => <span className="mono text-sm font-medium text-primary">{r.asset}</span>,
    },
    {
      key: "account",
      header: "Account / ref",
      cell: (r) => (
        <div className="flex flex-col leading-tight">
          <span className="mono text-xs">{r.accountRef}</span>
          {r.userId ? (
            <span className="mono text-[10px] text-muted-foreground">{r.userId}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "expected",
      header: "Expected",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.expected}</span>,
    },
    {
      key: "observed",
      header: "Observed",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.observed}</span>,
    },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      sortValue: (r) => Number(r.variance),
      cell: (r) => <span className={varClass(r.variance)}>{r.variance}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (r) => r.severity,
      cell: (r) => <StatusBadge tone={sevTone(r.severity)}>{r.severity}</StatusBadge>,
    },
    {
      key: "owner",
      header: "Owner",
      cell: (r) =>
        r.owner ? (
          <span className="text-sm">{r.owner}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">unassigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge>,
    },
    {
      key: "created",
      header: "Created",
      sortValue: (r) => r.createdAt,
      cell: (r) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      sortValue: (r) => r.updatedAt,
      cell: (r) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(r.updatedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  const filters: DataTableFilter<ReconciliationItem>[] = [
    {
      key: "status",
      label: "status",
      options: (
        ["open", "investigating", "resolved", "dismissed", "reopened"] as ReconciliationStatus[]
      ).map((s) => ({ value: s, label: s })),
      match: (r, v) => r.status === v,
    },
    {
      key: "severity",
      label: "severity",
      options: (["info", "warning", "critical"] as ReconciliationSeverity[]).map((s) => ({
        value: s,
        label: s,
      })),
      match: (r, v) => r.severity === v,
    },
    {
      key: "type",
      label: "mismatch",
      options: Array.from(new Set(rows.map((r) => r.mismatchType))).map((t) => ({
        value: t as string,
        label: formatType(t as ReconciliationMismatchType),
      })),
      match: (r, v) => r.mismatchType === v,
    },
    {
      key: "asset",
      label: "asset",
      options: Array.from(new Set(rows.map((r) => r.asset))).map((a) => ({ value: a, label: a })),
      match: (r, v) => r.asset === v,
    },
    {
      key: "owner",
      label: "assignment",
      options: [
        { value: "assigned", label: "Assigned" },
        { value: "unassigned", label: "Unassigned" },
      ],
      match: (r, v) => (v === "assigned" ? !!r.owner : !r.owner),
    },
  ];

  return (
    <Shell total={rows.length} open={open} critical={critical}>
      <p className="text-xs text-muted-foreground">
        <span className="mono text-warning">Rule:</span> no arbitrary balance rewrite. Corrections
        are posted as ledger adjustments via governed workflows.
      </p>
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(r) => `${r.id} ${r.asset} ${r.accountRef} ${r.userId ?? ""} ${r.mismatchType}`}
        searchPlaceholder="Search item, asset, account, mismatch…"
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        rowActions={(r) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`rec-inspect-${r.id}`}
            onClick={() => setSelectedId(r.id)}
          >
            Investigate
          </Button>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.id}</span> : ""}
        subtitle={
          selected
            ? `${formatType(selected.mismatchType)} · ${selected.asset} · ${selected.accountRef}`
            : undefined
        }
        badges={
          selected ? (
            <>
              <StatusBadge tone={sevTone(selected.severity)}>{selected.severity}</StatusBadge>
              <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "detail",
                  title: "Mismatch",
                  fields: [
                    { label: "Item ID", value: selected.id, mono: true },
                    { label: "Type", value: formatType(selected.mismatchType), mono: true },
                    { label: "Asset", value: selected.asset, mono: true },
                    { label: "Account / ref", value: selected.accountRef, mono: true },
                    { label: "User", value: selected.userId ?? "—", mono: true },
                    { label: "Expected", value: selected.expected, mono: true },
                    { label: "Observed", value: selected.observed, mono: true },
                    { label: "Variance", value: selected.variance, mono: true },
                    { label: "Severity", value: selected.severity, mono: true },
                    { label: "Status", value: selected.status, mono: true },
                    { label: "Owner", value: selected.owner ?? "—" },
                    {
                      label: "Created",
                      value: new Date(selected.createdAt).toLocaleString(),
                      mono: true,
                    },
                    {
                      label: "Updated",
                      value: new Date(selected.updatedAt).toLocaleString(),
                      mono: true,
                    },
                  ],
                },
                {
                  id: "refs",
                  title: "Linked references",
                  content:
                    selected.linkedRefs.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">No linked references.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.linkedRefs.map((ref) => (
                          <span
                            key={ref}
                            className="mono rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] text-primary"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    ),
                },
                {
                  id: "notes",
                  title: "Investigation notes",
                  content:
                    selected.notes.length === 0 ? (
                      <p className="text-xs italic text-muted-foreground">No notes yet.</p>
                    ) : (
                      <ol className="flex flex-col gap-1.5">
                        {selected.notes.map((n) => (
                          <li
                            key={n.id}
                            className="rounded-md border border-border/60 bg-background/40 p-3 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{n.actor}</span>
                              <span className="mono text-[10px] text-muted-foreground">
                                {new Date(n.ts).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-foreground/90">{n.body}</p>
                          </li>
                        ))}
                      </ol>
                    ),
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={20} />,
                },
              ]
            : []
        }
        actions={
          selected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                data-testid="rec-assign"
                disabled={!canResolve}
                onClick={() => setAssign(selected)}
              >
                <UserCog className="mr-1 h-3.5 w-3.5" /> {selected.owner ? "Reassign" : "Assign"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="rec-add-note"
                disabled={!canResolve}
                onClick={() => setNote(selected)}
              >
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Add note
              </Button>
              {selected.status !== "resolved" ? (
                <Button
                  size="sm"
                  data-testid="rec-resolve"
                  disabled={!canResolve}
                  onClick={() => setPending({ row: selected, next: "resolved" })}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve
                </Button>
              ) : null}
              {selected.status !== "dismissed" && selected.status !== "resolved" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  data-testid="rec-dismiss"
                  disabled={!canResolve}
                  onClick={() => setPending({ row: selected, next: "dismissed" })}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Dismiss
                </Button>
              ) : null}
              {selected.status === "resolved" || selected.status === "dismissed" ? (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="rec-reopen"
                  disabled={!canResolve}
                  onClick={() => setPending({ row: selected, next: "reopened" })}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reopen
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <AssignForm
        item={assign}
        admins={admins}
        onClose={() => setAssign(null)}
        onSubmit={async (owner, reason) => {
          if (!assign) return;
          const r = await provider.assignReconciliationOwner(assign.id, owner, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
          if (r.ok) toast.success("Owner assigned", { description: owner });
          else toast.error("Assignment failed");
        }}
      />

      <NoteForm
        item={note}
        onClose={() => setNote(null)}
        onSubmit={async (body, reason) => {
          if (!note) return;
          const r = await provider.addReconciliationNote(note.id, body, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
          if (r.ok) toast.success("Note added");
          else toast.error("Failed to add note");
        }}
      />

      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={
            pending.next === "resolved"
              ? "Resolve mismatch"
              : pending.next === "dismissed"
                ? "Dismiss mismatch"
                : "Reopen mismatch"
          }
          description={
            pending.next === "resolved"
              ? "Marks the mismatch as resolved. Preserved in history; corrections are posted as ledger adjustments outside this route."
              : pending.next === "dismissed"
                ? "Records that no action is required. Preserved in history for audit."
                : "Reopens a previously closed mismatch for further investigation."
          }
          target={
            <span>
              {pending.row.asset} · {pending.row.accountRef}
            </span>
          }
          targetId={pending.row.id}
          action={`reconciliation.set_status:${pending.next}`}
          permission="reconciliation.resolve"
          currentState={
            <StatusBadge tone={statusTone(pending.row.status)}>{pending.row.status}</StatusBadge>
          }
          proposedState={<StatusBadge tone={statusTone(pending.next)}>{pending.next}</StatusBadge>}
          destructive={pending.next === "dismissed"}
          submitLabel={
            pending.next === "resolved"
              ? "Resolve"
              : pending.next === "dismissed"
                ? "Dismiss"
                : "Reopen"
          }
          successMessage="Reconciliation updated"
          onConfirm={(reason) =>
            provider.setReconciliationStatus(pending.row.id, pending.next, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  total,
  open,
  critical,
}: {
  children: React.ReactNode;
  total?: number;
  open?: number;
  critical?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reconciliation"
        description="Mismatch queue with severity, ownership, investigation notes, and governed resolution."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} items
              </StatusBadge>
            ) : null}
            {open ? (
              <StatusBadge tone="warning" dot={false}>
                {open} open
              </StatusBadge>
            ) : null}
            {critical ? (
              <StatusBadge tone="destructive" dot={false}>
                {critical} critical
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function AssignForm({
  item,
  admins,
  onClose,
  onSubmit,
}: {
  item: ReconciliationItem | null;
  admins: AdminUser[];
  onClose: () => void;
  onSubmit: (owner: string, reason: string) => Promise<void>;
}) {
  const [owner, setOwner] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (item) {
      setOwner(item.owner ?? "");
      setReason("");
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok =
    owner.trim().length > 0 && reason.trim().length >= 6 && owner.trim() !== (item?.owner ?? "");
  const candidates = admins.filter(
    (a) =>
      a.role === "finance_operator" || a.role === "security_auditor" || a.role === "super_admin",
  );

  return (
    <FormDrawer
      open={!!item}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={item ? `Assign owner — ${item.id}` : ""}
      description="Assigns responsibility for investigation. Existing notes remain."
      submitLabel="Assign"
      submitDisabled={!ok}
      onSubmit={async () => {
        await onSubmit(owner.trim(), reason.trim());
        onClose();
      }}
      testId="rec-assign-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Owner</Label>
        <select
          data-testid="rec-owner-select"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="">— select owner —</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.displayName}>
              {c.displayName} ({c.role})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          data-testid="rec-assign-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
    </FormDrawer>
  );
}

function NoteForm({
  item,
  onClose,
  onSubmit,
}: {
  item: ReconciliationItem | null;
  onClose: () => void;
  onSubmit: (body: string, reason: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (item) {
      setBody("");
      setReason("");
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = body.trim().length >= 4 && reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!item}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={item ? `Add note — ${item.id}` : ""}
      description="Investigation notes are visible on the record and preserved in the audit trail."
      submitLabel="Add note"
      submitDisabled={!ok}
      onSubmit={async () => {
        await onSubmit(body.trim(), reason.trim());
        onClose();
      }}
      testId="rec-note-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Note</Label>
        <textarea
          data-testid="rec-note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Observation, correlated events, or next steps."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          data-testid="rec-note-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
    </FormDrawer>
  );
}

function statusTone(s: ReconciliationStatus) {
  switch (s) {
    case "open":
      return "warning" as const;
    case "investigating":
      return "info" as const;
    case "resolved":
      return "success" as const;
    case "dismissed":
      return "neutral" as const;
    case "reopened":
      return "destructive" as const;
  }
}
function sevTone(s: ReconciliationSeverity) {
  switch (s) {
    case "critical":
      return "destructive" as const;
    case "warning":
      return "warning" as const;
    case "info":
      return "info" as const;
  }
}
function varClass(v: string) {
  const n = Number(v);
  if (Number.isNaN(n) || n === 0) return "mono text-xs text-muted-foreground";
  return n < 0 ? "mono text-xs text-destructive" : "mono text-xs text-success";
}
function formatType(t: ReconciliationMismatchType) {
  return t.replace(/_/g, " ");
}
