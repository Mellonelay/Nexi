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
import type { SettlementRecord, SettlementState } from "@/admin/types";
import { mapBinaryInternal } from "@/admin/types";

export const Route = createFileRoute("/settlements")({ component: Page });

const CORRECTABLE_STATES: SettlementState[] = ["win", "loss", "draw", "refund", "cancelled"];

function Page() {
  return (
    <RouteGuard permission="settlements.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listSettlements());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correction, setCorrection] = useState<{
    row: SettlementRecord;
    next: SettlementState;
  } | null>(null);

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
        <ErrorState title="Could not load settlements" description={q.error.message} />
      </Shell>
    );

  const canCorrect = session.can("binary.settle");

  const counts = {
    open: rows.filter((r) => r.state === "open").length,
    settling: rows.filter((r) => r.state === "settling").length,
    failed: rows.filter((r) => r.state === "failed").length,
  };

  const columns: DataTableColumn<SettlementRecord>[] = [
    {
      key: "id",
      header: "Settlement",
      cell: (r) => <span className="mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "position",
      header: "Position",
      cell: (r) => <span className="mono text-xs">{r.positionId}</span>,
    },
    { key: "user", header: "User", cell: (r) => <span className="mono text-xs">{r.userId}</span> },
    { key: "pair", header: "Pair", cell: (r) => <span className="mono text-sm">{r.pair}</span> },
    {
      key: "dir",
      header: "Dir",
      cell: (r) => (
        <div className="flex flex-col text-xs leading-tight">
          <StatusBadge tone={r.direction === "long" ? "success" : "destructive"} dot={false}>
            {r.direction}
          </StatusBadge>
          <span className="mono text-[10px] text-muted-foreground">
            {mapBinaryInternal(r.direction)}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Dur",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.duration}s</span>,
    },
    {
      key: "stake",
      header: "Stake",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.stake}</span>,
    },
    {
      key: "open",
      header: "Open",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.openPrice}</span>,
    },
    {
      key: "settle",
      header: "Settle",
      align: "right",
      cell: (r) => <span className="mono text-xs">{r.settlePrice ?? "—"}</span>,
    },
    {
      key: "state",
      header: "State",
      sortValue: (r) => r.state,
      cell: (r) => <StatusBadge tone={stateTone(r.state)}>{r.state}</StatusBadge>,
    },
    {
      key: "when",
      header: "Settled at",
      sortValue: (r) => r.settledAt ?? "",
      cell: (r) =>
        r.settledAt ? (
          <span className="mono text-[11px] text-muted-foreground">
            {new Date(r.settledAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">—</span>
        ),
    },
  ];

  const filters: DataTableFilter<SettlementRecord>[] = [
    {
      key: "state",
      label: "state",
      options: (
        [
          "open",
          "settling",
          "win",
          "loss",
          "draw",
          "refund",
          "failed",
          "cancelled",
        ] as SettlementState[]
      ).map((s) => ({ value: s, label: s })),
      match: (r, v) => r.state === v,
    },
  ];

  return (
    <Shell counts={counts} total={rows.length}>
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(r) => `${r.id} ${r.positionId} ${r.userId} ${r.pair}`}
        searchPlaceholder="Search settlement, position, user, pair…"
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        rowActions={(r) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`stl-inspect-${r.id}`}
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
        title={selected ? <span className="mono">{selected.id}</span> : ""}
        subtitle={
          selected
            ? `${selected.pair} · ${selected.direction} → ${mapBinaryInternal(selected.direction)} · ${selected.duration}s`
            : undefined
        }
        badges={
          selected ? (
            <StatusBadge tone={stateTone(selected.state)}>{selected.state}</StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "settle",
                  title: "Settlement",
                  fields: [
                    { label: "Settlement ID", value: selected.id, mono: true },
                    { label: "Position ID", value: selected.positionId, mono: true },
                    { label: "User ID", value: selected.userId, mono: true },
                    { label: "Pair", value: selected.pair, mono: true },
                    { label: "Direction (public)", value: selected.direction, mono: true },
                    {
                      label: "Direction (internal)",
                      value: mapBinaryInternal(selected.direction),
                      mono: true,
                    },
                    { label: "Duration", value: `${selected.duration}s`, mono: true },
                    { label: "Stake", value: selected.stake, mono: true },
                    { label: "Open price", value: selected.openPrice, mono: true },
                    { label: "Settle price", value: selected.settlePrice ?? "—", mono: true },
                    { label: "Payout", value: selected.payout ?? "—", mono: true },
                    {
                      label: "Settled at",
                      value: selected.settledAt
                        ? new Date(selected.settledAt).toLocaleString()
                        : "—",
                      mono: true,
                    },
                  ],
                },
                {
                  id: "notes",
                  title: "Investigation notes",
                  content: (
                    <div className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">
                      {selected.notes ? (
                        <p className="whitespace-pre-wrap text-foreground/90">{selected.notes}</p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">No notes recorded.</p>
                      )}
                    </div>
                  ),
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={15} />,
                },
              ]
            : []
        }
        actions={
          selected ? (
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground">Correct to:</span>
              {CORRECTABLE_STATES.filter((s) => s !== selected.state).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={
                    s === "loss" || s === "cancelled"
                      ? "destructive"
                      : s === "win"
                        ? "default"
                        : "outline"
                  }
                  disabled={!canCorrect}
                  data-testid={`stl-correct-${s}`}
                  onClick={() => setCorrection({ row: selected, next: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : null
        }
      />

      {correction ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setCorrection(null);
          }}
          title="Correct settlement"
          description="Governed correction of a settled record. Requires a reason and, in PRODUCTION, typed confirmation."
          target={
            <span className="mono">
              {correction.row.id} · {correction.row.pair}
            </span>
          }
          targetId={correction.row.id}
          action={`settlements.correct:${correction.next}`}
          permission="binary.settle"
          currentState={
            <StatusBadge tone={stateTone(correction.row.state)}>{correction.row.state}</StatusBadge>
          }
          proposedState={
            <StatusBadge tone={stateTone(correction.next)}>{correction.next}</StatusBadge>
          }
          destructive={
            correction.next === "loss" ||
            correction.next === "cancelled" ||
            correction.next === "failed"
          }
          submitLabel="Apply correction"
          successMessage="Settlement corrected"
          onConfirm={(reason) =>
            provider.correctSettlement(correction.row.id, correction.next, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setCorrection(null)}
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
  counts?: { open: number; settling: number; failed: number };
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settlements"
        description="Binary settlement history and investigation queue. Corrections are governed and audited."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} records
              </StatusBadge>
            ) : null}
            {counts?.open ? (
              <StatusBadge tone="info" dot={false}>
                {counts.open} open
              </StatusBadge>
            ) : null}
            {counts?.settling ? (
              <StatusBadge tone="warning" dot={false}>
                {counts.settling} settling
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

function stateTone(s: SettlementState) {
  switch (s) {
    case "open":
      return "info" as const;
    case "settling":
      return "warning" as const;
    case "win":
      return "success" as const;
    case "loss":
      return "destructive" as const;
    case "draw":
      return "neutral" as const;
    case "refund":
      return "warning" as const;
    case "failed":
      return "destructive" as const;
    case "cancelled":
      return "neutral" as const;
  }
}
