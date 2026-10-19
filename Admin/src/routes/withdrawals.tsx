import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import type {
  Withdrawal,
  WithdrawalApprovalState,
  WithdrawalProcessingState,
  WithdrawalRiskState,
} from "@/admin/types";
import { ShieldCheck, ShieldX, Send, CheckCircle2, XCircle, Search } from "lucide-react";

export const Route = createFileRoute("/withdrawals")({ component: Page });

type PendingAction =
  | { kind: "approve"; row: Withdrawal }
  | { kind: "reject"; row: Withdrawal }
  | { kind: "review"; row: Withdrawal }
  | { kind: "processing"; row: Withdrawal }
  | { kind: "completed"; row: Withdrawal }
  | { kind: "failed"; row: Withdrawal };

function Page() {
  return (
    <RouteGuard permission="withdrawals.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listWithdrawals());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const rows = useMemo(() => q.data ?? [], [q.data]);
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
        <ErrorState title="Could not load withdrawals" description={q.error.message} />
      </Shell>
    );

  const canApprove = session.can("withdrawals.approve");
  const queueCount = rows.filter(
    (r) => r.approvalState !== "approved" && r.approvalState !== "rejected",
  ).length;
  const processingCount = rows.filter(
    (r) => r.processingState === "processing" || r.processingState === "broadcast",
  ).length;

  const columns: DataTableColumn<Withdrawal>[] = [
    {
      key: "id",
      header: "Request",
      sortValue: (w) => w.id,
      cell: (w) => <span className="mono text-xs text-muted-foreground">{w.id}</span>,
    },
    { key: "user", header: "User", cell: (w) => <span className="mono text-xs">{w.userId}</span> },
    {
      key: "asset",
      header: "Asset",
      cell: (w) => <span className="mono text-sm font-medium text-primary">{w.asset}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (w) => Number(w.amount),
      cell: (w) => <span className="mono text-xs">{w.amount}</span>,
    },
    {
      key: "fee",
      header: "Fee",
      align: "right",
      cell: (w) => <span className="mono text-xs">{w.fee ?? "—"}</span>,
    },
    {
      key: "destination",
      header: "Destination",
      cell: (w) => (
        <span className="mono text-[11px] text-muted-foreground">{shortAddr(w.destination)}</span>
      ),
    },
    {
      key: "network",
      header: "Network",
      cell: (w) => <span className="mono text-xs">{w.network}</span>,
    },
    {
      key: "risk",
      header: "Risk",
      cell: (w) =>
        w.riskState ? (
          <StatusBadge tone={riskTone(w.riskState)}>{w.riskState}</StatusBadge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "approval",
      header: "Approval",
      cell: (w) =>
        w.approvalState ? (
          <StatusBadge tone={approvalTone(w.approvalState)}>
            {w.approvalState.replace("_", " ")}
          </StatusBadge>
        ) : (
          <StatusBadge tone={approvalTone(mapLegacyApproval(w.status))}>
            {mapLegacyApproval(w.status).replace("_", " ")}
          </StatusBadge>
        ),
    },
    {
      key: "processing",
      header: "Processing",
      cell: (w) =>
        w.processingState ? (
          <StatusBadge tone={processingTone(w.processingState)}>{w.processingState}</StatusBadge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "requested",
      header: "Requested",
      sortValue: (w) => w.createdAt,
      cell: (w) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(w.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "tx",
      header: "Tx",
      cell: (w) =>
        w.txHash ? (
          <span className="mono text-[11px] text-muted-foreground">{shortHash(w.txHash)}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">—</span>
        ),
    },
  ];

  const filters: DataTableFilter<Withdrawal>[] = [
    {
      key: "approval",
      label: "approval",
      options: (
        ["pending_review", "additional_review", "approved", "rejected"] as WithdrawalApprovalState[]
      ).map((s) => ({ value: s, label: s.replace("_", " ") })),
      match: (w, v) => (w.approvalState ?? mapLegacyApproval(w.status)) === v,
    },
    {
      key: "processing",
      label: "processing",
      options: (
        [
          "queued",
          "processing",
          "broadcast",
          "completed",
          "failed",
          "cancelled",
        ] as WithdrawalProcessingState[]
      ).map((s) => ({ value: s, label: s })),
      match: (w, v) => w.processingState === v,
    },
    {
      key: "risk",
      label: "risk",
      options: (["clean", "review", "flagged", "blocked"] as WithdrawalRiskState[]).map((s) => ({
        value: s,
        label: s,
      })),
      match: (w, v) => w.riskState === v,
    },
    {
      key: "asset",
      label: "asset",
      options: Array.from(new Set(rows.map((r) => r.asset))).map((a) => ({ value: a, label: a })),
      match: (w, v) => w.asset === v,
    },
    {
      key: "network",
      label: "network",
      options: Array.from(new Set(rows.map((r) => r.network))).map((n) => ({ value: n, label: n })),
      match: (w, v) => w.network === v,
    },
  ];

  return (
    <Shell total={rows.length} queue={queueCount} processing={processingCount}>
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(w) =>
          `${w.id} ${w.userId} ${w.asset} ${w.destination} ${w.network} ${w.txHash ?? ""}`
        }
        searchPlaceholder="Search request, user, address, tx…"
        rowKey={(w) => w.id}
        onRowClick={(w) => setSelectedId(w.id)}
        rowActions={(w) => (
          <RowActions
            row={w}
            onAct={(a) => setPending(a)}
            onInspect={() => setSelectedId(w.id)}
            canApprove={canApprove}
          />
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono">{selected.id}</span> : ""}
        subtitle={
          selected
            ? `${selected.userId} · ${selected.amount} ${selected.asset} · ${selected.network}`
            : undefined
        }
        badges={
          selected ? (
            <>
              {selected.riskState ? (
                <StatusBadge tone={riskTone(selected.riskState)}>
                  risk · {selected.riskState}
                </StatusBadge>
              ) : null}
              <StatusBadge
                tone={approvalTone(selected.approvalState ?? mapLegacyApproval(selected.status))}
              >
                approval ·{" "}
                {(selected.approvalState ?? mapLegacyApproval(selected.status)).replace("_", " ")}
              </StatusBadge>
              {selected.processingState ? (
                <StatusBadge tone={processingTone(selected.processingState)}>
                  processing · {selected.processingState}
                </StatusBadge>
              ) : null}
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "request",
                  title: "Request",
                  fields: [
                    { label: "Request ID", value: selected.id, mono: true },
                    { label: "User", value: selected.userId, mono: true },
                    { label: "Asset", value: selected.asset, mono: true },
                    { label: "Network", value: selected.network, mono: true },
                    { label: "Amount", value: selected.amount, mono: true },
                    { label: "Fee", value: selected.fee ?? "—", mono: true },
                    { label: "Destination", value: selected.destination, mono: true },
                    {
                      label: "Requested at",
                      value: new Date(selected.createdAt).toLocaleString(),
                      mono: true,
                    },
                    { label: "Approver", value: selected.approver ?? "—" },
                    { label: "Tx hash", value: selected.txHash ?? "—", mono: true },
                  ],
                },
                {
                  id: "review",
                  title: "Review notes",
                  content: (
                    <div className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">
                      {selected.reviewNote ? (
                        <p className="whitespace-pre-wrap text-foreground/90">
                          {selected.reviewNote}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          No review notes recorded.
                        </p>
                      )}
                    </div>
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
            <DetailActions row={selected} onAct={(a) => setPending(a)} canApprove={canApprove} />
          ) : null
        }
      />

      {pending ? (
        <ActionDialog
          action={pending}
          onClose={() => setPending(null)}
          provider={provider}
          session={session}
        />
      ) : null}
    </Shell>
  );
}

function RowActions({
  row,
  onAct,
  onInspect,
  canApprove,
}: {
  row: Withdrawal;
  onAct: (a: PendingAction) => void;
  onInspect: () => void;
  canApprove: boolean;
}) {
  const approval = row.approvalState ?? mapLegacyApproval(row.status);
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" data-testid={`wd-inspect-${row.id}`} onClick={onInspect}>
        Inspect
      </Button>
      {approval === "pending_review" || approval === "additional_review" ? (
        <>
          <Button
            size="sm"
            data-testid={`wd-approve-${row.id}`}
            disabled={!canApprove}
            onClick={() => onAct({ kind: "approve", row })}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            data-testid={`wd-reject-${row.id}`}
            disabled={!canApprove}
            onClick={() => onAct({ kind: "reject", row })}
          >
            <ShieldX className="mr-1 h-3.5 w-3.5" /> Reject
          </Button>
        </>
      ) : null}
    </div>
  );
}

function DetailActions({
  row,
  onAct,
  canApprove,
}: {
  row: Withdrawal;
  onAct: (a: PendingAction) => void;
  canApprove: boolean;
}) {
  const approval = row.approvalState ?? mapLegacyApproval(row.status);
  const processing = row.processingState;
  const canReview =
    canApprove && (approval === "pending_review" || approval === "additional_review");
  const canDecide =
    canApprove && (approval === "pending_review" || approval === "additional_review");
  const canProcess =
    canApprove &&
    approval === "approved" &&
    processing !== "completed" &&
    processing !== "failed" &&
    processing !== "cancelled";

  return (
    <>
      {canReview ? (
        <Button
          variant="outline"
          size="sm"
          data-testid="wd-detail-review"
          onClick={() => onAct({ kind: "review", row })}
        >
          <Search className="mr-1 h-3.5 w-3.5" /> Request additional review
        </Button>
      ) : null}
      {canDecide ? (
        <>
          <Button
            variant="destructive"
            size="sm"
            data-testid="wd-detail-reject"
            onClick={() => onAct({ kind: "reject", row })}
          >
            <ShieldX className="mr-1 h-3.5 w-3.5" /> Reject
          </Button>
          <Button
            size="sm"
            data-testid="wd-detail-approve"
            onClick={() => onAct({ kind: "approve", row })}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Approve
          </Button>
        </>
      ) : null}
      {canProcess ? (
        <>
          {processing !== "processing" && processing !== "broadcast" ? (
            <Button
              variant="outline"
              size="sm"
              data-testid="wd-detail-processing"
              onClick={() => onAct({ kind: "processing", row })}
            >
              <Send className="mr-1 h-3.5 w-3.5" /> Mark processing
            </Button>
          ) : null}
          <Button
            size="sm"
            data-testid="wd-detail-completed"
            onClick={() => onAct({ kind: "completed", row })}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark completed
          </Button>
          <Button
            variant="destructive"
            size="sm"
            data-testid="wd-detail-failed"
            onClick={() => onAct({ kind: "failed", row })}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" /> Mark failed
          </Button>
        </>
      ) : null}
    </>
  );
}

function ActionDialog({
  action,
  onClose,
  provider,
  session,
}: {
  action: PendingAction;
  onClose: () => void;
  provider: ReturnType<typeof useAdminData>;
  session: ReturnType<typeof useAdminSession>;
}) {
  const row = action.row;
  const currentApproval = row.approvalState ?? mapLegacyApproval(row.status);

  const configs: Record<
    PendingAction["kind"],
    {
      title: string;
      description: string;
      actionName: string;
      submitLabel: string;
      successMessage: string;
      destructive?: boolean;
      current: React.ReactNode;
      proposed: React.ReactNode;
      onConfirm: (reason: string) => Promise<import("@/admin/data/provider").MutationResult>;
    }
  > = {
    approve: {
      title: "Approve withdrawal",
      description: "Approves the request and hands it to the processor.",
      actionName: "withdrawals.approve",
      submitLabel: "Approve",
      successMessage: "Withdrawal approved",
      current: (
        <StatusBadge tone={approvalTone(currentApproval)}>
          {currentApproval.replace("_", " ")}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="success">approved</StatusBadge>,
      onConfirm: (reason) => provider.decideWithdrawal(row.id, "approved", ctx(session, reason)),
    },
    reject: {
      title: "Reject withdrawal",
      description: "Denies the request and cancels processing. Funds remain in the user's wallet.",
      actionName: "withdrawals.reject",
      submitLabel: "Reject",
      successMessage: "Withdrawal rejected",
      destructive: true,
      current: (
        <StatusBadge tone={approvalTone(currentApproval)}>
          {currentApproval.replace("_", " ")}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="destructive">rejected</StatusBadge>,
      onConfirm: (reason) => provider.decideWithdrawal(row.id, "rejected", ctx(session, reason)),
    },
    review: {
      title: "Request additional review",
      description:
        "Sends the request into deeper compliance review. Approver actions are gated until returned.",
      actionName: "withdrawals.request_review",
      submitLabel: "Request review",
      successMessage: "Review requested",
      current: (
        <StatusBadge tone={approvalTone(currentApproval)}>
          {currentApproval.replace("_", " ")}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="warning">additional review</StatusBadge>,
      onConfirm: (reason) => provider.requestWithdrawalReview(row.id, ctx(session, reason)),
    },
    processing: {
      title: "Mark as processing",
      description: "Transitions the approved withdrawal to processing (pre-broadcast).",
      actionName: "withdrawals.mark_processing",
      submitLabel: "Mark processing",
      successMessage: "Marked processing",
      current: (
        <StatusBadge tone={processingTone(row.processingState)}>
          {row.processingState ?? "—"}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="info">processing</StatusBadge>,
      onConfirm: (reason) =>
        provider.setWithdrawalProcessing(row.id, "processing", ctx(session, reason)),
    },
    completed: {
      title: "Mark as completed",
      description:
        "Records the provider-reported completed state after broadcast and confirmation.",
      actionName: "withdrawals.mark_completed",
      submitLabel: "Mark completed",
      successMessage: "Marked completed",
      current: (
        <StatusBadge tone={processingTone(row.processingState)}>
          {row.processingState ?? "—"}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="success">completed</StatusBadge>,
      onConfirm: (reason) =>
        provider.setWithdrawalProcessing(row.id, "completed", ctx(session, reason)),
    },
    failed: {
      title: "Mark as failed",
      description: "Records broadcast failure. Funds should be returned via reconciliation.",
      actionName: "withdrawals.mark_failed",
      submitLabel: "Mark failed",
      successMessage: "Marked failed",
      destructive: true,
      current: (
        <StatusBadge tone={processingTone(row.processingState)}>
          {row.processingState ?? "—"}
        </StatusBadge>
      ),
      proposed: <StatusBadge tone="destructive">failed</StatusBadge>,
      onConfirm: (reason) =>
        provider.setWithdrawalProcessing(row.id, "failed", ctx(session, reason)),
    },
  };

  const c = configs[action.kind];

  return (
    <ConsequentialActionDialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={c.title}
      description={c.description}
      target={
        <span>
          {row.amount} {row.asset} · {shortAddr(row.destination)}
        </span>
      }
      targetId={row.id}
      action={c.actionName}
      permission="withdrawals.approve"
      currentState={c.current}
      proposedState={c.proposed}
      destructive={c.destructive}
      submitLabel={c.submitLabel}
      successMessage={c.successMessage}
      onConfirm={c.onConfirm}
      onSuccess={onClose}
    />
  );
}

function ctx(session: ReturnType<typeof useAdminSession>, reason: string) {
  return {
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason,
  };
}

function Shell({
  children,
  total,
  queue,
  processing,
}: {
  children: React.ReactNode;
  total?: number;
  queue?: number;
  processing?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Withdrawals"
        description="Governed review, approval, and processing queue with linked audit history."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} total
              </StatusBadge>
            ) : null}
            {queue ? (
              <StatusBadge tone="warning" dot={false}>
                {queue} in queue
              </StatusBadge>
            ) : null}
            {processing ? (
              <StatusBadge tone="primary" dot={false}>
                {processing} processing
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function riskTone(r: WithdrawalRiskState) {
  switch (r) {
    case "clean":
      return "success" as const;
    case "review":
      return "warning" as const;
    case "flagged":
      return "destructive" as const;
    case "blocked":
      return "destructive" as const;
  }
}
function approvalTone(a: WithdrawalApprovalState) {
  switch (a) {
    case "pending_review":
      return "warning" as const;
    case "additional_review":
      return "warning" as const;
    case "approved":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
  }
}
function processingTone(p: WithdrawalProcessingState | undefined) {
  switch (p) {
    case "queued":
      return "neutral" as const;
    case "processing":
      return "info" as const;
    case "broadcast":
      return "primary" as const;
    case "completed":
      return "success" as const;
    case "failed":
      return "destructive" as const;
    case "cancelled":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}
function mapLegacyApproval(status: Withdrawal["status"]): WithdrawalApprovalState {
  switch (status) {
    case "pending":
      return "pending_review";
    case "approved":
    case "broadcast":
    case "confirmed":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
  }
}
function shortAddr(a: string) {
  if (a.length <= 16) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}
function shortHash(h: string) {
  if (h.length <= 16) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}
