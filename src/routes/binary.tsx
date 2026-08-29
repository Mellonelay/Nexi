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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { BinaryPair, BinaryPosition, BinaryDuration } from "@/admin/types";
import { BINARY_DURATIONS, mapBinaryInternal } from "@/admin/types";
import { Pause, Play } from "lucide-react";

export const Route = createFileRoute("/binary")({ component: Page });

type PendingSettle = {
  pos: BinaryPosition;
  outcome: "won" | "lost" | "draw_refund" | "cancelled";
};

function Page() {
  return (
    <RouteGuard permission="binary.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const pairsQ = useAdminQuery((p) => p.listBinaryPairs());
  const posQ = useAdminQuery((p) => p.listBinaryPositions());

  if (pairsQ.loading || posQ.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (pairsQ.error)
    return (
      <Shell>
        <ErrorState title="Could not load binary" description={pairsQ.error.message} />
      </Shell>
    );

  const pairs = pairsQ.data ?? [];
  const positions = posQ.data ?? [];
  const open = positions.filter((p) => p.status === "open").length;
  const maintenance = pairs.filter((p) => p.maintenance).length;

  return (
    <Shell total={pairs.length} maintenance={maintenance} open={open}>
      <div className="rounded-md border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
        <span className="mono text-primary">Public labels</span> are{" "}
        <span className="text-foreground">Long</span> and{" "}
        <span className="text-foreground">Short</span>; internally mapped to
        <span className="mono text-warning"> UP</span> and{" "}
        <span className="mono text-warning">DOWN</span>. Canonical durations:
        <span className="mono"> {BINARY_DURATIONS.join(" · ")} seconds</span>.
      </div>

      <Tabs defaultValue="pairs">
        <TabsList className="mb-4">
          <TabsTrigger value="pairs" data-testid="bin-tab-pairs">
            Pairs ({pairs.length})
          </TabsTrigger>
          <TabsTrigger value="positions" data-testid="bin-tab-positions">
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="bin-tab-audit">
            Audit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pairs">
          <PairsPanel pairs={pairs} />
        </TabsContent>
        <TabsContent value="positions">
          <PositionsPanel positions={positions} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTimeline actionPrefix="binary." limit={40} />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({
  children,
  total,
  maintenance,
  open,
}: {
  children: React.ReactNode;
  total?: number;
  maintenance?: number;
  open?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Binary Administration"
        description="Payout matrix, stake and exposure limits, price-source rules, settlement delay, draw policy, and position inspection."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} pairs
              </StatusBadge>
            ) : null}
            {maintenance ? (
              <StatusBadge tone="warning" dot={false}>
                {maintenance} maintenance
              </StatusBadge>
            ) : null}
            {open ? (
              <StatusBadge tone="primary" dot={false}>
                {open} open positions
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function PairsPanel({ pairs }: { pairs: BinaryPair[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("binary.edit");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<BinaryPair | null>(null);
  const [pausing, setPausing] = useState<BinaryPair | null>(null);

  const selected = useMemo(
    () => (selectedId ? (pairs.find((p) => p.id === selectedId) ?? null) : null),
    [pairs, selectedId],
  );

  const columns: DataTableColumn<BinaryPair>[] = [
    {
      key: "symbol",
      header: "Pair",
      sortValue: (p) => p.symbol,
      cell: (p) => <span className="mono text-sm font-medium text-primary">{p.symbol}</span>,
    },
    {
      key: "state",
      header: "State",
      cell: (p) => (
        <StatusBadge tone={p.maintenance ? "warning" : p.enabled ? "success" : "neutral"}>
          {p.maintenance ? "maintenance" : p.enabled ? "enabled" : "disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "durations",
      header: "Durations",
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {BINARY_DURATIONS.map((d) => (
            <StatusBadge key={d} tone="info" dot={false}>
              {d}s · {(p.payoutBps[d] / 100).toFixed(2)}%
            </StatusBadge>
          ))}
        </div>
      ),
    },
    {
      key: "stakes",
      header: "Stakes",
      align: "right",
      cell: (p) => (
        <span className="mono text-xs">
          {p.minStake} – {p.maxStake}
        </span>
      ),
    },
    {
      key: "exposure",
      header: "Exposure",
      align: "right",
      cell: (p) => (
        <div className="flex flex-col text-right leading-tight">
          <span className="mono text-xs">
            {p.exposureUsed} / {p.exposureCap}
          </span>
          <span className="mono text-[10px] text-muted-foreground">
            {Math.round((Number(p.exposureUsed) / Number(p.exposureCap)) * 100)}%
          </span>
        </div>
      ),
    },
    {
      key: "draw",
      header: "Draw policy",
      cell: (p) => (
        <StatusBadge tone="neutral" dot={false}>
          {p.drawPolicy}
        </StatusBadge>
      ),
    },
  ];

  const filters: DataTableFilter<BinaryPair>[] = [
    {
      key: "state",
      label: "state",
      options: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
        { value: "maintenance", label: "Maintenance" },
      ],
      match: (p, v) => {
        if (v === "enabled") return p.enabled && !p.maintenance;
        if (v === "disabled") return !p.enabled;
        return p.maintenance;
      },
    },
  ];

  return (
    <>
      <DataTable
        data={pairs}
        columns={columns}
        filters={filters}
        searchable={(p) => `${p.symbol}`}
        searchPlaceholder="Search pair…"
        rowKey={(p) => p.id}
        onRowClick={(p) => setSelectedId(p.id)}
        rowActions={(p) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`bin-inspect-${p.id}`}
              onClick={() => setSelectedId(p.id)}
            >
              Inspect
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid={`bin-edit-${p.id}`}
              disabled={!canEdit}
              onClick={() => setEditing(p)}
            >
              Edit
            </Button>
            <Button
              variant={p.maintenance ? "default" : "destructive"}
              size="sm"
              disabled={!canEdit}
              data-testid={`bin-pause-${p.id}`}
              onClick={() => setPausing(p)}
            >
              {p.maintenance ? (
                <>
                  <Play className="mr-1 h-3.5 w-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                </>
              )}
            </Button>
          </div>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.symbol}</span> : ""}
        subtitle={selected ? selected.id : undefined}
        badges={
          selected ? (
            <>
              <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
                {selected.enabled ? "enabled" : "disabled"}
              </StatusBadge>
              {selected.maintenance ? <StatusBadge tone="warning">maintenance</StatusBadge> : null}
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "pair",
                  title: "Pair",
                  fields: [
                    { label: "Symbol", value: selected.symbol, mono: true },
                    { label: "Min stake", value: selected.minStake, mono: true },
                    { label: "Max stake", value: selected.maxStake, mono: true },
                    { label: "Exposure used", value: selected.exposureUsed, mono: true },
                    { label: "Exposure cap", value: selected.exposureCap, mono: true },
                    {
                      label: "Settlement delay",
                      value: `${selected.settlementDelayMs} ms`,
                      mono: true,
                    },
                    { label: "Draw policy", value: selected.drawPolicy, mono: true },
                    {
                      label: "Price source rule",
                      value:
                        "Median of primary + fallback feeds; last-quote fallback if stale > 3s.",
                    },
                  ],
                },
                {
                  id: "payout",
                  title: "Payout matrix",
                  content: (
                    <div className="grid grid-cols-5 gap-2">
                      {BINARY_DURATIONS.map((d) => (
                        <div
                          key={d}
                          className="rounded-md border border-border/60 bg-background/40 p-2 text-center"
                        >
                          <div className="mono text-[10px] uppercase text-muted-foreground">
                            {d}s
                          </div>
                          <div className="mono text-sm text-foreground">
                            {(selected.payoutBps[d] / 100).toFixed(2)}%
                          </div>
                        </div>
                      ))}
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
            <>
              <Button
                variant="outline"
                size="sm"
                data-testid="bin-detail-edit"
                disabled={!canEdit}
                onClick={() => setEditing(selected)}
              >
                Edit
              </Button>
              <Button
                variant={selected.maintenance ? "default" : "destructive"}
                size="sm"
                disabled={!canEdit}
                data-testid="bin-detail-pause"
                onClick={() => setPausing(selected)}
              >
                {selected.maintenance ? "Resume" : "Pause"}
              </Button>
            </>
          ) : null
        }
      />

      <BinaryPairEditForm
        pair={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateBinaryPair(editing.id, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {pausing ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPausing(null);
          }}
          title={pausing.maintenance ? "Resume pair" : "Pause pair (maintenance)"}
          description="Paused pairs reject new positions. Existing positions continue toward strike."
          target={<span className="mono">{pausing.symbol}</span>}
          targetId={pausing.id}
          action={pausing.maintenance ? "binary.resume_pair" : "binary.pause_pair"}
          permission="binary.edit"
          currentState={
            <StatusBadge tone={pausing.maintenance ? "warning" : "success"}>
              {pausing.maintenance ? "maintenance" : "enabled"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pausing.maintenance ? "success" : "warning"}>
              {pausing.maintenance ? "enabled" : "maintenance"}
            </StatusBadge>
          }
          destructive={!pausing.maintenance}
          submitLabel={pausing.maintenance ? "Resume" : "Pause"}
          successMessage="Pair state updated"
          onConfirm={(reason) =>
            provider.pauseBinaryPair(pausing.id, !pausing.maintenance, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPausing(null)}
        />
      ) : null}
    </>
  );
}

function PositionsPanel({ positions }: { positions: BinaryPosition[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canSettle = session.can("binary.settle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingSettle | null>(null);
  const selected = useMemo(
    () => (selectedId ? (positions.find((p) => p.id === selectedId) ?? null) : null),
    [positions, selectedId],
  );

  const columns: DataTableColumn<BinaryPosition>[] = [
    {
      key: "id",
      header: "Position",
      cell: (p) => <span className="mono text-xs text-muted-foreground">{p.id}</span>,
    },
    { key: "user", header: "User", cell: (p) => <span className="mono text-xs">{p.userId}</span> },
    { key: "pair", header: "Pair", cell: (p) => <span className="mono text-sm">{p.pair}</span> },
    {
      key: "direction",
      header: "Direction",
      cell: (p) => (
        <div className="flex flex-col text-xs leading-tight">
          <StatusBadge tone={p.direction === "long" ? "success" : "destructive"} dot={false}>
            {p.direction}
          </StatusBadge>
          <span className="mono text-[10px] text-muted-foreground">
            → {mapBinaryInternal(p.direction)}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      cell: (p) => <span className="mono text-xs">{p.duration}s</span>,
    },
    {
      key: "stake",
      header: "Stake",
      align: "right",
      cell: (p) => <span className="mono text-xs">{p.stake}</span>,
    },
    {
      key: "open",
      header: "Open",
      align: "right",
      cell: (p) => <span className="mono text-xs">{p.openPrice}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <StatusBadge tone={posTone(p.status)}>{p.status}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<BinaryPosition>[] = [
    {
      key: "status",
      label: "status",
      options: [
        { value: "open", label: "Open" },
        { value: "won", label: "Won" },
        { value: "lost", label: "Lost" },
        { value: "draw_refund", label: "Draw / refund" },
        { value: "cancelled", label: "Cancelled" },
      ],
      match: (p, v) => p.status === v,
    },
  ];

  return (
    <>
      <DataTable
        data={positions}
        columns={columns}
        filters={filters}
        searchable={(p) => `${p.id} ${p.userId} ${p.pair}`}
        searchPlaceholder="Search position, user, pair…"
        rowKey={(p) => p.id}
        onRowClick={(p) => setSelectedId(p.id)}
        rowActions={(p) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`bpos-inspect-${p.id}`}
              onClick={() => setSelectedId(p.id)}
            >
              Inspect
            </Button>
            {p.status === "open" ? (
              <Button
                variant="destructive"
                size="sm"
                data-testid={`bpos-cancel-${p.id}`}
                disabled={!canSettle}
                onClick={() => setPending({ pos: p, outcome: "cancelled" })}
              >
                Cancel
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
            ? `${selected.pair} · ${selected.direction} → ${mapBinaryInternal(selected.direction)} · ${selected.duration}s`
            : undefined
        }
        badges={
          selected ? (
            <StatusBadge tone={posTone(selected.status)}>{selected.status}</StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "pos",
                  title: "Position",
                  fields: [
                    { label: "User", value: selected.userId, mono: true },
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
                    { label: "Strike at", value: selected.strikeAt, mono: true },
                    { label: "Payout", value: selected.payout ?? "—", mono: true },
                  ],
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
          selected && selected.status === "open" ? (
            <>
              <Button
                size="sm"
                data-testid="bpos-detail-won"
                disabled={!canSettle}
                onClick={() => setPending({ pos: selected, outcome: "won" })}
              >
                Mark won
              </Button>
              <Button
                variant="destructive"
                size="sm"
                data-testid="bpos-detail-lost"
                disabled={!canSettle}
                onClick={() => setPending({ pos: selected, outcome: "lost" })}
              >
                Mark lost
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="bpos-detail-refund"
                disabled={!canSettle}
                onClick={() => setPending({ pos: selected, outcome: "draw_refund" })}
              >
                Draw / refund
              </Button>
              <Button
                variant="destructive"
                size="sm"
                data-testid="bpos-detail-cancel"
                disabled={!canSettle}
                onClick={() => setPending({ pos: selected, outcome: "cancelled" })}
              >
                Cancel
              </Button>
            </>
          ) : null
        }
      />

      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={`Settle position — ${pending.outcome}`}
          description="Settles the open position with the chosen outcome. This is auditable and cannot be undone from this route (see Settlements for corrections)."
          target={
            <span className="mono">
              {pending.pos.id} · {pending.pos.pair}
            </span>
          }
          targetId={pending.pos.id}
          action={`binary.settle_position:${pending.outcome}`}
          permission="binary.settle"
          currentState={<StatusBadge tone="info">open</StatusBadge>}
          proposedState={
            <StatusBadge tone={posTone(pending.outcome)}>{pending.outcome}</StatusBadge>
          }
          destructive={pending.outcome === "lost" || pending.outcome === "cancelled"}
          submitLabel="Settle"
          successMessage="Position settled"
          onConfirm={(reason) =>
            provider.settleBinaryPosition(pending.pos.id, pending.outcome, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}
    </>
  );
}

function BinaryPairEditForm({
  pair,
  onClose,
  onSubmit,
}: {
  pair: BinaryPair | null;
  onClose: () => void;
  onSubmit: (
    patch: Partial<
      Pick<
        BinaryPair,
        "enabled" | "minStake" | "maxStake" | "exposureCap" | "settlementDelayMs" | "drawPolicy"
      >
    > & { payoutBps?: Partial<Record<BinaryDuration, number>> },
    reason: string,
  ) => Promise<void>;
}) {
  const [state, setState] = useState({
    enabled: true,
    minStake: "1",
    maxStake: "1000",
    exposureCap: "50000",
    settlementDelayMs: 500,
    drawPolicy: "refund" as "refund" | "cancel" | "loss",
    payoutBps: {} as Record<BinaryDuration, number>,
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (pair) {
      setState({
        enabled: pair.enabled,
        minStake: pair.minStake,
        maxStake: pair.maxStake,
        exposureCap: pair.exposureCap,
        settlementDelayMs: pair.settlementDelayMs,
        drawPolicy: pair.drawPolicy,
        payoutBps: { ...pair.payoutBps },
      });
      setReason("");
    }
  }, [pair?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!pair}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={pair ? `Edit — ${pair.symbol}` : ""}
      description="Update stakes, exposure cap, settlement delay, draw policy, and the payout matrix."
      submitLabel="Save pair"
      submitDisabled={!reasonOk}
      onSubmit={async () => {
        await onSubmit(
          {
            enabled: state.enabled,
            minStake: state.minStake,
            maxStake: state.maxStake,
            exposureCap: state.exposureCap,
            settlementDelayMs: state.settlementDelayMs,
            drawPolicy: state.drawPolicy,
            payoutBps: state.payoutBps,
          },
          reason.trim(),
        );
        onClose();
      }}
      testId="bin-edit-drawer"
    >
      <label
        htmlFor="bin-enabled"
        className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2"
      >
        <span className="text-sm">Enabled</span>
        <Switch
          id="bin-enabled"
          data-testid="bin-enabled"
          checked={state.enabled}
          onCheckedChange={(v) => setState((s) => ({ ...s, enabled: !!v }))}
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Min stake">
          <Input
            data-testid="bin-min"
            value={state.minStake}
            onChange={(e) => setState((s) => ({ ...s, minStake: e.target.value }))}
          />
        </Field>
        <Field label="Max stake">
          <Input
            data-testid="bin-max"
            value={state.maxStake}
            onChange={(e) => setState((s) => ({ ...s, maxStake: e.target.value }))}
          />
        </Field>
        <Field label="Exposure cap">
          <Input
            data-testid="bin-cap"
            value={state.exposureCap}
            onChange={(e) => setState((s) => ({ ...s, exposureCap: e.target.value }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Settlement delay (ms)">
          <Input
            data-testid="bin-delay"
            type="number"
            value={state.settlementDelayMs}
            onChange={(e) => setState((s) => ({ ...s, settlementDelayMs: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Draw policy">
          <select
            data-testid="bin-draw"
            value={state.drawPolicy}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                drawPolicy: e.target.value as "refund" | "cancel" | "loss",
              }))
            }
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            <option value="refund">refund</option>
            <option value="cancel">cancel</option>
            <option value="loss">loss</option>
          </select>
        </Field>
      </div>
      <Field label="Payout matrix (bps)">
        <div className="grid grid-cols-5 gap-2">
          {BINARY_DURATIONS.map((d) => (
            <div key={d} className="flex flex-col gap-1">
              <span className="mono text-[10px] text-muted-foreground">{d}s</span>
              <Input
                data-testid={`bin-payout-${d}`}
                type="number"
                value={state.payoutBps[d] ?? 0}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    payoutBps: { ...s.payoutBps, [d]: Number(e.target.value) },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </Field>
      <Field label="Reason (auditable, ≥ 6 chars)">
        <textarea
          data-testid="bin-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </Field>
    </FormDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function posTone(s: BinaryPosition["status"] | "won" | "lost" | "draw_refund" | "cancelled") {
  switch (s) {
    case "open":
      return "info" as const;
    case "won":
      return "success" as const;
    case "lost":
      return "destructive" as const;
    case "draw_refund":
      return "warning" as const;
    case "cancelled":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}
