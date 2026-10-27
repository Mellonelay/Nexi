import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { GovernanceShell, ReceiptBanner, JsonState } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { ApprovalRequest } from "@/admin/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/approvals")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="approvals.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const receipt = useReceipt();
  const q = useAdminQuery((p) => p.listApprovals());
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [pending, setPending] = useState<{
    item: ApprovalRequest;
    decision: "approved" | "rejected";
  } | null>(null);
  const rows = q.data ?? [];
  const pendingCount = rows.filter((a) => a.status === "pending").length;
  if (q.loading)
    return (
      <GovernanceShell title="Approvals" description="Multi-party decision queue.">
        <LoadingSkeleton rows={6} />
      </GovernanceShell>
    );
  if (q.error)
    return (
      <GovernanceShell title="Approvals" description="Multi-party decision queue.">
        <ErrorState title="Could not load approvals" description={q.error.message} />
      </GovernanceShell>
    );
  const columns: DataTableColumn<ApprovalRequest>[] = [
    {
      key: "action",
      header: "Action",
      sortValue: (a) => a.action,
      cell: (a) => (
        <div>
          <span className="mono text-xs text-primary">{a.action}</span>
          <div className="text-xs text-muted-foreground">{a.target}</div>
        </div>
      ),
    },
    {
      key: "requester",
      header: "Requester",
      sortValue: (a) => a.requestedBy,
      cell: (a) => (
        <div>
          <div>{a.requestedBy}</div>
          <span className="mono text-[10px] text-muted-foreground">{a.requestedByRole}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Decision",
      sortValue: (a) => a.status,
      cell: (a) => (
        <StatusBadge
          tone={
            a.status === "approved"
              ? "success"
              : a.status === "rejected"
                ? "destructive"
                : a.status === "pending"
                  ? "warning"
                  : "neutral"
          }
        >
          {a.status}
        </StatusBadge>
      ),
    },
    {
      key: "created",
      header: "Created",
      sortValue: (a) => a.requestedAt,
      cell: (a) => (
        <span className="mono text-xs text-muted-foreground">
          {new Date(a.requestedAt).toLocaleString()}
        </span>
      ),
    },
  ];
  const filters: DataTableFilter<ApprovalRequest>[] = [
    {
      key: "status",
      label: "decision",
      options: ["pending", "approved", "rejected", "expired"].map((v) => ({ value: v, label: v })),
      match: (a, v) => a.status === v,
    },
  ];
  return (
    <GovernanceShell
      title="Approvals"
      description={`${pendingCount} pending request${pendingCount === 1 ? "" : "s"}; completed decisions remain immutable.`}
    >
      <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(a) => `${a.action} ${a.target} ${a.requestedBy} ${a.reason}`}
        searchPlaceholder="Search request…"
        rowKey={(a) => a.id}
        onRowClick={setSelected}
        rowActions={(a) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
              Inspect
            </Button>
            {a.status === "pending" ? (
              <>
                <Button
                  size="sm"
                  disabled={!session.can("approvals.decide")}
                  onClick={() => setPending({ item: a, decision: "approved" })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!session.can("approvals.decide")}
                  onClick={() => setPending({ item: a, decision: "rejected" })}
                >
                  Reject
                </Button>
              </>
            ) : null}
          </div>
        )}
      />
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.action ?? ""}
        subtitle={selected?.target}
        badges={
          selected ? (
            <StatusBadge
              tone={
                selected.status === "approved"
                  ? "success"
                  : selected.status === "rejected"
                    ? "destructive"
                    : "warning"
              }
            >
              {selected.status}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "request",
                  title: "Request",
                  fields: [
                    {
                      label: "Requester",
                      value: `${selected.requestedBy} · ${selected.requestedByRole}`,
                    },
                    { label: "Environment", value: session.environment },
                    { label: "Created", value: new Date(selected.requestedAt).toLocaleString() },
                    { label: "Reason", value: selected.reason, className: "sm:col-span-2" },
                  ],
                },
                {
                  id: "state",
                  title: "Exact state",
                  content: (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[10px] uppercase text-muted-foreground">
                          Before
                        </div>
                        <JsonState value={selected.before} />
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] uppercase text-muted-foreground">
                          After
                        </div>
                        <JsonState value={selected.after} />
                      </div>
                    </div>
                  ),
                },
                {
                  id: "decision",
                  title: "Decision",
                  fields: [
                    { label: "Decided by", value: selected.decidedBy ?? "Pending" },
                    { label: "Decision reason", value: selected.decisionReason ?? "—" },
                    { label: "Audit", value: selected.auditId ?? "—", mono: true },
                  ],
                },
              ]
            : []
        }
        actions={
          selected?.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                disabled={!session.can("approvals.decide")}
                onClick={() => setPending({ item: selected, decision: "approved" })}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={!session.can("approvals.decide")}
                onClick={() => setPending({ item: selected, decision: "rejected" })}
              >
                Reject
              </Button>
            </div>
          ) : null
        }
      />
      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => !o && setPending(null)}
          title={`${pending.decision === "approved" ? "Approve" : "Reject"} request`}
          description="Requester self-approval is structurally denied; completed decisions are idempotent."
          target={pending.item.target}
          targetId={pending.item.id}
          action={`approvals.decide:${pending.decision}`}
          permission="approvals.decide"
          currentState={pending.item.status}
          proposedState={pending.decision}
          destructive={pending.decision === "rejected"}
          onConfirm={async (reason) => {
            const result = await provider.decideApproval(pending.item.id, pending.decision, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            });
            receipt.record(`approvals.decide:${pending.decision}`, result);
            q.refresh();
            setSelected(null);
            return result;
          }}
        />
      ) : null}
    </GovernanceShell>
  );
}
