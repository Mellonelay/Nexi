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
import type { Deposit, DepositStatus } from "@/admin/types";
import { ArrowDownToLine, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/deposits")({ component: Page });

type PendingAction =
  | { kind: "confirm"; row: Deposit }
  | { kind: "credit"; row: Deposit }
  | { kind: "fail"; row: Deposit };

function Page() {
  return (
    <RouteGuard permission="deposits.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listDeposits());
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
        <ErrorState title="Could not load deposits" description={q.error.message} />
      </Shell>
    );

  const canConfirm = session.can("deposits.confirm");
  const counts = {
    detected: rows.filter((r) => r.status === "detected").length,
    confirming: rows.filter((r) => r.status === "confirming").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    credited: rows.filter((r) => r.status === "credited").length,
    failed: rows.filter((r) => r.status === "failed" || r.status === "orphaned").length,
  };

  const columns: DataTableColumn<Deposit>[] = [
    {
      key: "id",
      header: "Deposit",
      sortValue: (d) => d.id,
      cell: (d) => <span className="mono text-xs text-muted-foreground">{d.id}</span>,
    },
    { key: "user", header: "User", cell: (d) => <span className="mono text-xs">{d.userId}</span> },
    {
      key: "asset",
      header: "Asset",
      cell: (d) => <span className="mono text-sm font-medium text-primary">{d.asset}</span>,
    },
    {
      key: "network",
      header: "Network",
      cell: (d) => <span className="mono text-xs">{d.network}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (d) => Number(d.amount),
      cell: (d) => <span className="mono text-xs">{d.amount}</span>,
    },
    {
      key: "conf",
      header: "Confs",
      align: "right",
      cell: (d) => (
        <span className={confClass(d)}>
          {d.confirmations}/{d.requiredConfirmations}
        </span>
      ),
    },
    {
      key: "detected",
      header: "Detected",
      sortValue: (d) => d.detectedAt ?? d.createdAt,
      cell: (d) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(d.detectedAt ?? d.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "credited",
      header: "Credited",
      sortValue: (d) => d.creditedAt ?? "",
      cell: (d) =>
        d.creditedAt ? (
          <span className="mono text-[11px] text-muted-foreground">
            {new Date(d.creditedAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "tx",
      header: "Tx hash",
      cell: (d) => (
        <span className="mono text-[11px] text-muted-foreground">{shortHash(d.txHash)}</span>
      ),
    },
    {
      key: "status",
      header: "State",
      sortValue: (d) => d.status,
      cell: (d) => <StatusBadge tone={depTone(d.status)}>{d.status.toUpperCase()}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<Deposit>[] = [
    {
      key: "status",
      label: "state",
      options: (
        ["detected", "confirming", "confirmed", "credited", "failed", "orphaned"] as DepositStatus[]
      ).map((s) => ({ value: s, label: s.toUpperCase() })),
      match: (d, v) => d.status === v,
    },
    {
      key: "asset",
      label: "asset",
      options: Array.from(new Set(rows.map((r) => r.asset))).map((a) => ({ value: a, label: a })),
      match: (d, v) => d.asset === v,
    },
    {
      key: "network",
      label: "network",
      options: Array.from(new Set(rows.map((r) => r.network))).map((n) => ({ value: n, label: n })),
      match: (d, v) => d.network === v,
    },
  ];

  return (
    <Shell counts={counts} total={rows.length}>
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(d) => `${d.id} ${d.userId} ${d.asset} ${d.network} ${d.txHash}`}
        searchPlaceholder="Search deposit, user, asset, tx…"
        rowKey={(d) => d.id}
        onRowClick={(d) => setSelectedId(d.id)}
        rowActions={(d) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`dep-inspect-${d.id}`}
              onClick={() => setSelectedId(d.id)}
            >
              Inspect
            </Button>
            {d.status === "detected" || d.status === "confirming" ? (
              <Button
                size="sm"
                variant="outline"
                data-testid={`dep-confirm-${d.id}`}
                disabled={!canConfirm}
                onClick={() => setPending({ kind: "confirm", row: d })}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
              </Button>
            ) : null}
            {d.status === "confirmed" ? (
              <Button
                size="sm"
                data-testid={`dep-credit-${d.id}`}
                disabled={!canConfirm}
                onClick={() => setPending({ kind: "credit", row: d })}
              >
                <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Credit
              </Button>
            ) : null}
          </div>
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
            <StatusBadge tone={depTone(selected.status)}>
              {selected.status.toUpperCase()}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? ([
                {
                  id: "deposit",
                  title: "Deposit",
                  fields: [
                    { label: "Deposit ID", value: selected.id, mono: true },
                    { label: "User", value: selected.userId, mono: true },
                    { label: "Asset", value: selected.asset, mono: true },
                    { label: "Network", value: selected.network, mono: true },
                    { label: "Amount", value: selected.amount, mono: true },
                    { label: "Tx hash", value: selected.txHash, mono: true },
                    {
                      label: "Confirmations",
                      value: `${selected.confirmations} / ${selected.requiredConfirmations}`,
                      mono: true,
                    },
                    {
                      label: "Detected",
                      value: new Date(selected.detectedAt ?? selected.createdAt).toLocaleString(),
                      mono: true,
                    },
                    {
                      label: "Credited",
                      value: selected.creditedAt
                        ? new Date(selected.creditedAt).toLocaleString()
                        : "—",
                      mono: true,
                    },
                    { label: "State", value: selected.status, mono: true },
                  ],
                },
                selected.failureReason
                  ? {
                      id: "failure",
                      title: "Failure detail",
                      content: (
                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                          {selected.failureReason}
                        </div>
                      ),
                    }
                  : null,
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={15} />,
                },
              ].filter(Boolean) as never)
            : []
        }
        actions={
          selected ? (
            <>
              {selected.status === "detected" || selected.status === "confirming" ? (
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="dep-detail-confirm"
                  disabled={!canConfirm}
                  onClick={() => setPending({ kind: "confirm", row: selected })}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm
                </Button>
              ) : null}
              {selected.status === "confirmed" ? (
                <Button
                  size="sm"
                  data-testid="dep-detail-credit"
                  disabled={!canConfirm}
                  onClick={() => setPending({ kind: "credit", row: selected })}
                >
                  <ArrowDownToLine className="mr-1 h-3.5 w-3.5" /> Credit
                </Button>
              ) : null}
              {selected.status === "detected" ||
              selected.status === "confirming" ||
              selected.status === "confirmed" ? (
                <Button
                  size="sm"
                  variant="destructive"
                  data-testid="dep-detail-fail"
                  disabled={!canConfirm}
                  onClick={() => setPending({ kind: "fail", row: selected })}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Mark failed
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      {pending?.kind === "confirm" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Confirm deposit"
          description="Marks the deposit as CONFIRMED. Credit posting is a separate, subsequent step."
          target={
            <span>
              {pending.row.amount} {pending.row.asset} · {pending.row.network}
            </span>
          }
          targetId={pending.row.id}
          action="deposits.confirm"
          permission="deposits.confirm"
          currentState={
            <StatusBadge tone={depTone(pending.row.status)}>
              {pending.row.status.toUpperCase()}
            </StatusBadge>
          }
          proposedState={<StatusBadge tone="info">CONFIRMED</StatusBadge>}
          submitLabel="Confirm"
          successMessage="Deposit confirmed"
          onConfirm={(reason) =>
            provider.confirmDeposit(pending.row.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "credit" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Credit deposit to wallet"
          description="Posts a ledger credit for this deposit and marks it CREDITED. This is auditable and cannot be reversed from here."
          target={
            <span>
              {pending.row.amount} {pending.row.asset} → {pending.row.userId}
            </span>
          }
          targetId={pending.row.id}
          action="deposits.credit"
          permission="deposits.confirm"
          currentState={<StatusBadge tone="info">CONFIRMED</StatusBadge>}
          proposedState={<StatusBadge tone="success">CREDITED</StatusBadge>}
          submitLabel="Credit to wallet"
          successMessage="Deposit credited"
          onConfirm={(reason) =>
            provider.creditDeposit(pending.row.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "fail" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Mark deposit failed"
          description="Records that the deposit will not be credited. The reason you provide is stored on the record and in the audit trail."
          target={
            <span>
              {pending.row.amount} {pending.row.asset} · {pending.row.network}
            </span>
          }
          targetId={pending.row.id}
          action="deposits.fail"
          permission="deposits.confirm"
          currentState={
            <StatusBadge tone={depTone(pending.row.status)}>
              {pending.row.status.toUpperCase()}
            </StatusBadge>
          }
          proposedState={<StatusBadge tone="destructive">FAILED</StatusBadge>}
          destructive
          submitLabel="Mark failed"
          successMessage="Deposit marked failed"
          onConfirm={(reason) =>
            provider.failDeposit(pending.row.id, reason, {
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
  counts,
}: {
  children: React.ReactNode;
  total?: number;
  counts?: {
    detected: number;
    confirming: number;
    confirmed: number;
    credited: number;
    failed: number;
  };
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deposits"
        description="Detected → Confirming → Confirmed → Credited pipeline with governed actions."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} rows
              </StatusBadge>
            ) : null}
            {counts?.detected ? (
              <StatusBadge tone="warning" dot={false}>
                {counts.detected} detected
              </StatusBadge>
            ) : null}
            {counts?.confirming ? (
              <StatusBadge tone="info" dot={false}>
                {counts.confirming} confirming
              </StatusBadge>
            ) : null}
            {counts?.confirmed ? (
              <StatusBadge tone="primary" dot={false}>
                {counts.confirmed} confirmed
              </StatusBadge>
            ) : null}
            {counts?.credited ? (
              <StatusBadge tone="success" dot={false}>
                {counts.credited} credited
              </StatusBadge>
            ) : null}
            {counts?.failed ? (
              <StatusBadge tone="destructive" dot={false}>
                {counts.failed} failed
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function depTone(s: DepositStatus) {
  switch (s) {
    case "detected":
      return "warning" as const;
    case "confirming":
      return "info" as const;
    case "confirmed":
      return "primary" as const;
    case "credited":
      return "success" as const;
    case "failed":
      return "destructive" as const;
    case "orphaned":
      return "destructive" as const;
  }
}
function confClass(d: Deposit) {
  const pct = d.confirmations / Math.max(1, d.requiredConfirmations);
  if (pct >= 1) return "mono text-xs text-success";
  if (pct >= 0.5) return "mono text-xs text-warning";
  return "mono text-xs text-muted-foreground";
}
function shortHash(hash: string) {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
