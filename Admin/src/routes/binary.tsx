import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import type { BinaryPair, BinaryPosition, BinaryDuration } from "@/admin/types";
import { mapBinaryInternal } from "@/admin/types";
import { isOngoingBinaryPositionStatus } from "@/admin/data/binary-position-view";
import { Pause, Play, RefreshCw } from "lucide-react";
import { z } from "zod";

const binarySearchSchema = z.object({ view: z.enum(["positions", "pairs", "audit"]).optional() });

export const Route = createFileRoute("/binary")({
  validateSearch: binarySearchSchema,
  component: Page,
});

type PendingSettle = { pos: BinaryPosition };

function Page() {
  return (
    <RouteGuard permission="binary.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const { view = "positions" } = Route.useSearch();
  const pairsQ = useAdminQuery((p) => p.listBinaryPairs());
  const posQ = useAdminQuery((p) => p.listBinaryPositions());

  if (pairsQ.loading || posQ.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (pairsQ.error || posQ.error)
    return (
      <Shell>
        <ErrorState
          title="Could not load binary"
          description={(pairsQ.error ?? posQ.error)?.message ?? "Binary data is unavailable."}
        />
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
        <span className="mono text-warning">DOWN</span>. Duration, payout and stake limits are
        backend-configured per pair.
      </div>

      {view === "pairs" ? (
        <PairsPanel pairs={pairs} />
      ) : view === "audit" ? (
        <AuditTimeline actionPrefix="binary." limit={40} />
      ) : (
        <PositionsPanel positions={positions} onRefresh={posQ.refresh} />
      )}
      {view !== "audit" ? (
        <details className="border-t border-border/60 pt-3">
          <summary className="cursor-pointer text-xs font-medium">Binary audit history</summary>
          <div className="pt-3">
            <AuditTimeline actionPrefix="binary." limit={40} />
          </div>
        </details>
      ) : null}
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
        title="Binary Trading"
        description="Manage trading pairs, settings and ongoing trades."
        badges={
          <>
            <ProviderBadge />
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
          {binaryConfigs(p).map((config) => (
            <StatusBadge key={config.durationSeconds} tone="info" dot={false}>
              {config.durationSeconds}s · {(config.payoutBps / 100).toFixed(2)}%
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
      cell: (p) => {
        const used = p.exposureUsed.trim() === "" ? Number.NaN : Number(p.exposureUsed);
        const cap = p.exposureCap.trim() === "" ? Number.NaN : Number(p.exposureCap);
        const exposureAvailable = Number.isFinite(used) && Number.isFinite(cap) && cap > 0;

        return (
          <div className="flex flex-col text-right leading-tight">
            <span className="mono text-xs">
              {exposureAvailable ? `${p.exposureUsed} / ${p.exposureCap}` : "Unavailable"}
            </span>
            {exposureAvailable && (
              <span className="mono text-[10px] text-muted-foreground">
                {Math.round((used / cap) * 100)}%
              </span>
            )}
          </div>
        );
      },
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
                      {binaryConfigs(selected).map((config) => (
                        <div
                          key={config.durationSeconds}
                          className="rounded-md border border-border/60 bg-background/40 p-2 text-center"
                        >
                          <div className="mono text-[10px] uppercase text-muted-foreground">
                            {config.durationSeconds}s
                          </div>
                          <div className="mono text-sm text-foreground">
                            {(config.payoutBps / 100).toFixed(2)}%
                          </div>
                          <div className="mono text-[10px] text-muted-foreground">
                            {config.minStake}–{config.maxStake}
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

function PositionsPanel({
  positions,
  onRefresh,
}: {
  positions: BinaryPosition[];
  onRefresh: () => void;
}) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canSettle = session.can("binary.settle");
  const canEdit = session.can("binary.edit");
  const [selectedId, setSelectedId] = useState<string | null>(
    () => positions.find((position) => isOngoingBinaryPositionStatus(position.status))?.id ?? null,
  );
  const [pending, setPending] = useState<PendingSettle | null>(null);
  const [researchDraft, setResearchDraft] = useState<"DEFAULT" | "NORMAL" | "WIN" | "LOSS">(
    "DEFAULT",
  );
  const [pendingResearch, setPendingResearch] = useState<BinaryPosition | null>(null);
  const selected = positions.find((position) => position.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId || !positions.some((position) => position.id === selectedId)) {
      setSelectedId(
        positions.find((position) => isOngoingBinaryPositionStatus(position.status))?.id ?? null,
      );
    }
  }, [positions, selectedId]);

  useEffect(() => {
    setResearchDraft(selected?.researchOverride ?? "DEFAULT");
  }, [selected?.id, selected?.researchControlVersion, selected?.researchOverride]);

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
          <StatusBadge tone={directionTone(p.direction)} dot={false}>
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
      key: "expiresAt",
      header: "Expires",
      cell: (p) => <span className="mono text-xs">{formatPositionExpiry(p.expiresAt)}</span>,
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
        { value: "ongoing", label: "Ongoing" },
        { value: "open", label: "Open" },
        { value: "settling", label: "Settling" },
        { value: "won", label: "Won" },
        { value: "lost", label: "Lost" },
        { value: "error", label: "Error" },
      ],
      match: (p, v) => (v === "ongoing" ? isOngoingBinaryPositionStatus(p.status) : p.status === v),
    },
    {
      key: "user",
      label: "client",
      options: Array.from(new Set(positions.map((position) => position.userId)))
        .sort()
        .map((userId) => ({ value: userId, label: userId })),
      match: (position, userId) => position.userId === userId,
    },
    {
      key: "pair",
      label: "pair",
      options: Array.from(new Set(positions.map((position) => position.pair)))
        .sort()
        .map((pair) => ({ value: pair, label: pair })),
      match: (position, pair) => position.pair === pair,
    },
  ];

  return (
    <>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DataTable
          data={positions}
          columns={columns}
          filters={filters}
          initialFilterValues={{ status: "ongoing" }}
          selectedKey={selectedId}
          searchable={(p) => `${p.id} ${p.userId} ${p.pair}`}
          searchPlaceholder="Search position, user, pair…"
          rowKey={(p) => p.id}
          toolbarRight={
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh view
            </Button>
          }
          onRowClick={(p) => setSelectedId(p.id)}
          rowActions={(p) => (
            <div className="flex justify-end gap-2">
              <PositionSettleAction
                position={p}
                canSettle={canSettle}
                onSettle={() => setPending({ pos: p })}
                label="Settle"
              />
            </div>
          )}
        />

        <PositionInspector
          position={selected}
          researchDraft={researchDraft}
          canEdit={canEdit}
          canSettle={canSettle}
          onResearchDraftChange={setResearchDraft}
          onSaveResearch={setPendingResearch}
          onSettle={(position) => setPending({ pos: position })}
        />
      </div>

      <PositionActionDialogs
        pending={pending}
        pendingResearch={pendingResearch}
        researchDraft={researchDraft}
        onCloseSettlement={() => setPending(null)}
        onCloseResearch={() => setPendingResearch(null)}
        onRefresh={onRefresh}
      />
    </>
  );
}

function PositionActionDialogs({
  pending,
  pendingResearch,
  researchDraft,
  onCloseSettlement,
  onCloseResearch,
  onRefresh,
}: {
  pending: PendingSettle | null;
  pendingResearch: BinaryPosition | null;
  researchDraft: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
  onCloseSettlement: () => void;
  onCloseResearch: () => void;
  onRefresh: () => void;
}) {
  const provider = useAdminData();
  const session = useAdminSession();
  return (
    <>
      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={onCloseSettlement}
          title="Settle position"
          description="Requests settlement through the active provider. The Admin does not choose the trade outcome."
          target={
            <span className="mono">
              {pending.pos.id} · {pending.pos.pair}
            </span>
          }
          targetId={pending.pos.id}
          action="binary.settle_position"
          permission="binary.settle"
          currentState={<StatusBadge tone="info">open</StatusBadge>}
          proposedState={<StatusBadge tone="info">provider settlement</StatusBadge>}
          submitLabel="Settle"
          successMessage="Position settled"
          onConfirm={(reason) =>
            provider.settleBinaryPosition(pending.pos.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={onCloseSettlement}
        />
      ) : null}
      {pendingResearch ? (
        <ConsequentialActionDialog
          open
          onOpenChange={onCloseResearch}
          title="Save Binary trade setting"
          description="Available only for an open trade on an approved research account. The setting is version-checked before settlement."
          target={
            <span className="mono">
              {pendingResearch.id} · {pendingResearch.pair}
            </span>
          }
          targetId={pendingResearch.id}
          action="binary.research_position_override"
          permission="binary.edit"
          currentState={
            <StatusBadge tone="info">{pendingResearch.researchOverride ?? "Default"}</StatusBadge>
          }
          proposedState={<StatusBadge tone="warning">{researchDraft}</StatusBadge>}
          submitLabel="Save setting"
          successMessage="Binary trade setting saved"
          onConfirm={(reason) =>
            provider.setBinaryResearchPositionOverride(
              pendingResearch.id,
              researchDraft,
              pendingResearch.researchControlVersion ?? 0,
              {
                actor: session.actorName,
                role: session.roleId,
                environment: session.environment,
                reason,
              },
            )
          }
          onSuccess={() => {
            onCloseResearch();
            onRefresh();
          }}
        />
      ) : null}
    </>
  );
}

function PositionInspector({
  position,
  researchDraft,
  canEdit,
  canSettle,
  onResearchDraftChange,
  onSaveResearch,
  onSettle,
}: {
  position: BinaryPosition | null;
  researchDraft: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
  canEdit: boolean;
  canSettle: boolean;
  onResearchDraftChange: (value: "DEFAULT" | "NORMAL" | "WIN" | "LOSS") => void;
  onSaveResearch: (position: BinaryPosition) => void;
  onSettle: (position: BinaryPosition) => void;
}) {
  if (!position) {
    return (
      <aside
        aria-label="Selected position details"
        className="surface-1 rounded-lg border border-border/60 p-4"
      >
        <div className="py-8 text-sm text-muted-foreground">
          Select a position to inspect its details and available controls.
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Selected position details"
      className="surface-1 min-w-0 rounded-lg border border-border/60 p-4"
      data-testid="binary-position-inspector"
    >
      <div className="flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{position.pair} position</h2>
            <p className="mono truncate text-xs text-muted-foreground">{position.id}</p>
          </div>
          <StatusBadge tone={posTone(position.status)}>{position.status}</StatusBadge>
        </header>
        <PositionFacts position={position} />
        <PositionResearchControl
          position={position}
          draft={researchDraft}
          canEdit={canEdit}
          onDraftChange={onResearchDraftChange}
          onSave={() => onSaveResearch(position)}
        />
        <PositionSettleAction
          position={position}
          canSettle={canSettle}
          onSettle={() => onSettle(position)}
          label="Settle through market result"
        />
        <details className="border-t border-border/60 pt-3">
          <summary className="cursor-pointer text-xs font-medium">Position audit history</summary>
          <div className="pt-3">
            <AuditTimeline targetId={position.id} heading="" limit={15} />
          </div>
        </details>
      </div>
    </aside>
  );
}

function PositionFacts({ position }: { position: BinaryPosition }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <PositionFact label="Client" value={position.userId} />
      <PositionFact
        label="Direction"
        value={`${position.direction} · ${mapBinaryInternal(position.direction)}`}
      />
      <PositionFact label="Duration" value={`${position.duration}s`} />
      <PositionFact label="Stake" value={position.stake} />
      <PositionFact label="Open price" value={position.openPrice} />
      <PositionFact label="Expires" value={formatPositionExpiry(position.expiresAt)} />
      <PositionFact label="Payout" value={position.payout ?? "—"} />
    </dl>
  );
}

function PositionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="break-all text-xs text-foreground">{value}</dd>
    </div>
  );
}

function PositionResearchControl({
  position,
  draft,
  canEdit,
  onDraftChange,
  onSave,
}: {
  position: BinaryPosition;
  draft: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
  canEdit: boolean;
  onDraftChange: (value: "DEFAULT" | "NORMAL" | "WIN" | "LOSS") => void;
  onSave: () => void;
}) {
  if (position.status !== "open") {
    return (
      <ResearchControlNotice message="This position is no longer open, so its research setting cannot be changed." />
    );
  }
  if (!position.researchEligible) {
    return (
      <ResearchControlNotice message="This account is not approved for isolated Binary research controls." />
    );
  }
  return (
    <PositionResearchEditor
      position={position}
      draft={draft}
      canEdit={canEdit}
      onDraftChange={onDraftChange}
      onSave={onSave}
    />
  );
}

function ResearchControlNotice({ message }: { message: string }) {
  return (
    <section className="border-t border-border/60 pt-4">
      <h3 className="text-sm font-semibold">Binary Trading Control</h3>
      <p className="text-xs text-muted-foreground">{message}</p>
    </section>
  );
}

function PositionResearchEditor({
  position,
  draft,
  canEdit,
  onDraftChange,
  onSave,
}: {
  position: BinaryPosition;
  draft: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
  canEdit: boolean;
  onDraftChange: (value: "DEFAULT" | "NORMAL" | "WIN" | "LOSS") => void;
  onSave: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border/60 pt-4">
      <div>
        <h3 className="text-sm font-semibold">Binary Trading Control</h3>
        <p className="text-xs text-muted-foreground">
          Applies only to this eligible open test position before settlement.
        </p>
      </div>
      <PositionResearchSummary position={position} />
      <PositionResearchInput
        position={position}
        draft={draft}
        canEdit={canEdit}
        onDraftChange={onDraftChange}
        onSave={onSave}
      />
    </section>
  );
}

function PositionResearchSummary({ position }: { position: BinaryPosition }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-xs">
      <PositionFact label="Account default" value={position.researchDefault ?? "NORMAL"} />
      <PositionFact label="Position override" value={position.researchOverride ?? "Default"} />
      <PositionFact
        label="Effective mode"
        value={position.researchOverride ?? position.researchDefault ?? "NORMAL"}
      />
      <PositionFact label="Control version" value={String(position.researchControlVersion ?? 0)} />
    </dl>
  );
}

function PositionResearchInput({
  position,
  draft,
  canEdit,
  onDraftChange,
  onSave,
}: {
  position: BinaryPosition;
  draft: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
  canEdit: boolean;
  onDraftChange: (value: "DEFAULT" | "NORMAL" | "WIN" | "LOSS") => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        This position
        <select
          aria-label="Binary position control"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value as typeof draft)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="DEFAULT">Default</option>
          <option value="NORMAL">Normal</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Lose</option>
        </select>
      </label>
      <Button
        size="sm"
        disabled={!canEdit || draft === (position.researchOverride ?? "DEFAULT")}
        onClick={onSave}
      >
        Save position setting
      </Button>
    </div>
  );
}

function PositionSettleAction({
  position,
  canSettle,
  onSettle,
  label,
}: {
  position: BinaryPosition;
  canSettle: boolean;
  onSettle: () => void;
  label: string;
}) {
  if (position.status !== "open") return null;
  return (
    <Button variant="outline" disabled={!canSettle} onClick={onSettle}>
      {label}
    </Button>
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
    patch: Partial<Pick<BinaryPair, "enabled" | "exposureCap" | "settlementDelayMs">> & {
      durationConfigs?: Array<{
        sourceDurationSeconds: number;
        durationSeconds: number;
        payoutBps: number;
        minStake: string;
        maxStake: string;
        enabled: boolean;
      }>;
    },
    reason: string,
  ) => Promise<void>;
}) {
  const [state, setState] = useState({
    enabled: true,
    exposureCap: "50000",
    settlementDelayMs: 500,
    durationConfigs: [] as Array<{
      sourceDurationSeconds: number;
      durationSeconds: number;
      payoutBps: number;
      minStake: string;
      maxStake: string;
      enabled: boolean;
    }>,
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (pair) {
      setState({
        enabled: pair.enabled,
        exposureCap: pair.exposureCap,
        settlementDelayMs: pair.settlementDelayMs,
        durationConfigs: binaryConfigs(pair).map((config) => ({ ...config })),
      });
      setReason("");
    }
  }, [pair?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;
  const configsValid =
    state.durationConfigs.length === 5 &&
    new Set(state.durationConfigs.map((config) => config.durationSeconds)).size === 5 &&
    state.durationConfigs.every(
      (config) =>
        Number.isInteger(config.durationSeconds) &&
        config.durationSeconds > 0 &&
        config.durationSeconds <= 86400 &&
        config.payoutBps > 0 &&
        Number(config.minStake) > 0 &&
        Number(config.maxStake) >= Number(config.minStake),
    );

  return (
    <FormDrawer
      open={!!pair}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={pair ? `Edit — ${pair.symbol}` : ""}
      description="Edit payout, stake limits, and availability for each of the five fixed Option durations."
      submitLabel="Save pair"
      submitDisabled={!reasonOk || !configsValid}
      onSubmit={async () => {
        await onSubmit(
          {
            enabled: state.enabled,
            exposureCap: state.exposureCap,
            settlementDelayMs: state.settlementDelayMs,
            durationConfigs: state.durationConfigs,
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
      <div className="grid gap-3 md:grid-cols-5">
        {state.durationConfigs.map((config, index) => (
          <div
            key={`${config.sourceDurationSeconds}-${index}`}
            className="space-y-2 rounded-md border border-border/60 bg-background/40 p-3"
          >
            <div className="text-xs font-medium">Box {index + 1}</div>
            <Field label="Duration (seconds)">
              <Input value={config.durationSeconds} readOnly />
            </Field>
            <Field label="Payout (bps)">
              <Input
                type="number"
                min={1}
                value={config.payoutBps}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    durationConfigs: s.durationConfigs.map((item, i) =>
                      i === index ? { ...item, payoutBps: Number(e.target.value) } : item,
                    ),
                  }))
                }
              />
            </Field>
            <Field label="Min stake">
              <Input
                value={config.minStake}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    durationConfigs: s.durationConfigs.map((item, i) =>
                      i === index ? { ...item, minStake: e.target.value } : item,
                    ),
                  }))
                }
              />
            </Field>
            <Field label="Max stake">
              <Input
                value={config.maxStake}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    durationConfigs: s.durationConfigs.map((item, i) =>
                      i === index ? { ...item, maxStake: e.target.value } : item,
                    ),
                  }))
                }
              />
            </Field>
            <label className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
              <span className="text-xs">Enabled</span>
              <Switch
                data-testid={`bin-duration-enabled-${config.sourceDurationSeconds}`}
                checked={config.enabled}
                onCheckedChange={(enabled) =>
                  setState((s) => ({
                    ...s,
                    durationConfigs: s.durationConfigs.map((item, i) =>
                      i === index ? { ...item, enabled } : item,
                    ),
                  }))
                }
              />
            </label>
          </div>
        ))}
      </div>
      {!configsValid ? (
        <p className="text-xs text-destructive">
          Exactly five unique positive duration boxes are required; payout and stake limits must be
          valid.
        </p>
      ) : null}
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

function binaryConfigs(pair: BinaryPair) {
  if (pair.durationConfigs?.length) return pair.durationConfigs;
  return Object.entries(pair.payoutBps)
    .map(([duration, payoutBps]) => ({
      sourceDurationSeconds: Number(duration),
      durationSeconds: Number(duration),
      payoutBps,
      minStake: pair.minStake,
      maxStake: pair.maxStake,
      enabled: pair.enabled,
    }))
    .sort((a, b) => a.durationSeconds - b.durationSeconds);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function posTone(s: BinaryPosition["status"]) {
  switch (s) {
    case "open":
      return "info" as const;
    case "settling":
      return "warning" as const;
    case "won":
      return "success" as const;
    case "lost":
      return "destructive" as const;
    case "error":
      return "destructive" as const;
    default:
      return "neutral" as const;
  }
}

function directionTone(direction: BinaryPosition["direction"]) {
  return direction === "long" ? ("success" as const) : ("destructive" as const);
}

function formatPositionExpiry(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString();
}
