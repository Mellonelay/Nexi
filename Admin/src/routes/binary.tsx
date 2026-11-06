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
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BinaryPair, BinaryPosition, BinaryGlobalConfiguration } from "@/admin/types";
import { mapBinaryInternal } from "@/admin/types";
import { isOngoingBinaryPositionStatus } from "@/admin/data/binary-position-view";
import { Pause, Play, RefreshCw } from "lucide-react";
import { z } from "zod";

const binarySearchSchema = z.object({
  view: z.enum(["positions", "pairs", "audit"]).optional(),
  reference: z.string().optional(),
});

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
  const search = Route.useSearch();
  const view = search.reference ? "positions" : (search.view ?? "positions");
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
    <Shell maintenance={maintenance} open={open}>
      <div className="rounded-md border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
        <span className="mono text-primary">Public labels</span> are{" "}
        <span className="text-foreground">Long</span> and{" "}
        <span className="text-foreground">Short</span>; internally mapped to
        <span className="mono text-warning"> UP</span> and{" "}
        <span className="mono text-warning">DOWN</span>. Duration, payout and stake limits are
        configured globally across eligible pairs.
      </div>

      {view === "pairs" ? (
        <PairsPanel pairs={pairs} />
      ) : view === "audit" ? (
        <AuditTimeline actionPrefix="binary." limit={40} />
      ) : (
        <PositionsPanel
          positions={positions}
          onRefresh={posQ.refresh}
          reference={search.reference}
        />
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
  maintenance,
  open,
}: {
  children: React.ReactNode;
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
      header: "Availability",
      cell: (p) => (
        <StatusBadge tone={p.maintenance ? "warning" : p.enabled ? "success" : "neutral"}>
          {p.maintenance ? "maintenance" : p.enabled ? "available" : "unavailable"}
        </StatusBadge>
      ),
    },
  ];
  const filters: DataTableFilter<BinaryPair>[] = [
    {
      key: "state",
      label: "availability",
      options: [
        { value: "enabled", label: "Available" },
        { value: "disabled", label: "Unavailable" },
        { value: "maintenance", label: "Maintenance" },
      ],
      match: (p, v) =>
        v === "enabled"
          ? p.enabled && !p.maintenance
          : v === "disabled"
            ? !p.enabled
            : p.maintenance,
    },
  ];
  return (
    <>
      <BinaryGlobalSettings />
      <div className="rounded-md border border-border/60 p-3 text-xs text-muted-foreground">
        Pair controls below only manage availability. Payout rates and stake limits are shared
        across all eligible pairs.
      </div>
      <DataTable
        data={pairs}
        columns={columns}
        filters={filters}
        searchable={(p) => p.symbol}
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
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.symbol}</span> : ""}
        subtitle={selected ? selected.id : undefined}
        badges={
          selected ? (
            <StatusBadge
              tone={selected.maintenance ? "warning" : selected.enabled ? "success" : "neutral"}
            >
              {selected.maintenance
                ? "maintenance"
                : selected.enabled
                  ? "available"
                  : "unavailable"}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "pair",
                  title: "Pair availability",
                  fields: [
                    { label: "Symbol", value: selected.symbol, mono: true },
                    {
                      label: "Availability",
                      value: selected.maintenance
                        ? "Maintenance"
                        : selected.enabled
                          ? "Available"
                          : "Unavailable",
                    },
                    {
                      label: "Shared policy",
                      value: "Global Binary Settings controls duration, payout and stake limits.",
                    },
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
          selected ? (
            <Button
              variant={selected.maintenance ? "default" : "destructive"}
              size="sm"
              disabled={!canEdit}
              onClick={() => setPausing(selected)}
            >
              {selected.maintenance ? "Resume" : "Pause"}
            </Button>
          ) : null
        }
      />
      {pausing ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setPausing(null);
          }}
          title={pausing.maintenance ? "Resume pair" : "Pause pair (maintenance)"}
          description="Paused pairs reject new positions. Existing positions continue toward strike."
          target={<span className="mono">{pausing.symbol}</span>}
          targetId={pausing.id}
          action={pausing.maintenance ? "binary.resume_pair" : "binary.pause_pair"}
          permission="binary.edit"
          currentState={
            <StatusBadge tone={pausing.maintenance ? "warning" : "success"}>
              {pausing.maintenance ? "maintenance" : "available"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pausing.maintenance ? "success" : "warning"}>
              {pausing.maintenance ? "available" : "maintenance"}
            </StatusBadge>
          }
          destructive={!pausing.maintenance}
          submitLabel={pausing.maintenance ? "Resume" : "Pause"}
          successMessage="Pair availability updated"
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

const BINARY_DURATIONS = [30, 60, 180, 280, 420] as const;

function BinaryGlobalSettings() {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("binary.edit");
  const query = useAdminQuery((p) => p.getBinaryGlobalConfiguration());
  const [draft, setDraft] = useState<BinaryGlobalConfiguration | null>(null);
  const [payoutInputs, setPayoutInputs] = useState<Record<number, string>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (query.data) {
      setDraft(query.data);
      setPayoutInputs(
        Object.fromEntries(
          query.data.durations.map((item) => [
            item.durationSeconds,
            item.payoutRate > 0 ? String(Number((item.payoutRate * 100).toFixed(8))) : "",
          ]),
        ),
      );
    }
  }, [query.data]);

  const durations = draft?.durations ?? [];
  const valid = Boolean(
    draft &&
    BINARY_DURATIONS.every((duration) =>
      durations.some((item) => item.durationSeconds === duration),
    ) &&
    durations.length === BINARY_DURATIONS.length &&
    Number(draft.minStake) > 0 &&
    Number(draft.maxStake) >= Number(draft.minStake) &&
    durations.every(
      (item) =>
        /^(?:\d+)(?:\.\d{1,8})?$/.test(payoutInputs[item.durationSeconds] ?? "") &&
        Number.isFinite(item.payoutRate) &&
        item.payoutRate > 0,
    ),
  );
  const updateDuration = (
    durationSeconds: number,
    patch: Partial<BinaryGlobalConfiguration["durations"][number]>,
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            durations: current.durations.map((item) =>
              item.durationSeconds === durationSeconds ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || !valid || reason.trim().length < 6 || !canEdit || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await provider.updateBinaryGlobalConfiguration(
        {
          minStake: draft.minStake,
          maxStake: draft.maxStake,
          durations: draft.durations,
        },
        {
          actor: session.actorName,
          role: session.roleId,
          environment: session.environment,
          reason: reason.trim(),
        },
      );
      setMessage(result.ok ? "Global settings saved." : "Settings were not accepted.");
      setReason("");
      await query.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save global settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="space-y-4 rounded-lg border border-border/60 bg-background/40 p-4"
    >
      <div>
        <h2 className="font-semibold">Global Binary Settings</h2>
        <p className="text-xs text-muted-foreground">
          One shared payout and stake policy for every eligible pair. New settings do not change
          open-position snapshots.
        </p>
        {draft?.version === 0 && (
          <p role="status" className="mt-2 text-sm text-warning">
            No global policy is saved. Enter the stake limits and each payout, then choose which
            durations are available. Existing pair settings remain in effect until you save.
          </p>
        )}
      </div>
      {query.loading && !draft ? (
        <LoadingSkeleton rows={2} />
      ) : query.error ? (
        <ErrorState
          title="Could not load global Binary settings"
          description={query.error.message}
        />
      ) : !draft ? (
        <p className="text-sm text-muted-foreground">Global settings are not configured.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Minimum stake">
              <Input
                inputMode="decimal"
                value={draft.minStake}
                disabled={!canEdit || saving}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, minStake: e.target.value } : current,
                  )
                }
              />
            </Field>
            <Field label="Maximum stake">
              <Input
                inputMode="decimal"
                value={draft.maxStake}
                disabled={!canEdit || saving}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, maxStake: e.target.value } : current,
                  )
                }
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {BINARY_DURATIONS.map((duration) => {
              const setting = durations.find((item) => item.durationSeconds === duration);
              return (
                <div key={duration} className="space-y-3 rounded-md border border-border/60 p-3">
                  <h3 className="text-sm font-medium">{duration} seconds</h3>
                  {setting ? (
                    <>
                      <Field label="Payout (%)">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={payoutInputs[duration] ?? ""}
                          disabled={!canEdit || saving}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPayoutInputs((current) => ({ ...current, [duration]: value }));
                            updateDuration(duration, { payoutRate: Number(value) / 100 });
                          }}
                        />
                      </Field>
                      <label className="flex items-center justify-between gap-3 text-xs">
                        <span>Duration available</span>
                        <Switch
                          checked={setting.enabled}
                          disabled={!canEdit || saving}
                          onCheckedChange={(enabled) => updateDuration(duration, { enabled })}
                        />
                      </label>
                    </>
                  ) : (
                    <p className="text-xs text-destructive">Missing from backend configuration.</p>
                  )}
                </div>
              );
            })}
          </div>
          <Field label="Reason (auditable, at least 6 characters)">
            <textarea
              value={reason}
              disabled={!canEdit || saving}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!canEdit || !valid || reason.trim().length < 6 || saving}
            >
              {saving
                ? "Saving…"
                : draft.version === 0
                  ? "Initialize global settings"
                  : "Save global settings"}
            </Button>
            {draft.version > 0 ? (
              <span className="text-xs text-muted-foreground">
                Configuration version {draft.version}
              </span>
            ) : null}
            {message ? (
              <span role="status" className="text-xs text-muted-foreground">
                {message}
              </span>
            ) : null}
          </div>
        </>
      )}
    </form>
  );
}

function PositionsPanel({
  positions,
  onRefresh,
  reference,
}: {
  positions: BinaryPosition[];
  onRefresh: () => void;
  reference?: string;
}) {
  const session = useAdminSession();
  const canSettle = session.can("binary.settle");
  const canEdit = session.can("binary.edit");
  const [selectedId, setSelectedId] = useState<string | null>(
    () =>
      reference ??
      positions.find((position) => isOngoingBinaryPositionStatus(position.status))?.id ??
      null,
  );
  const [pending, setPending] = useState<PendingSettle | null>(null);
  const [researchDraft, setResearchDraft] = useState<"DEFAULT" | "NORMAL" | "WIN" | "LOSS">(
    "DEFAULT",
  );
  const [pendingResearch, setPendingResearch] = useState<BinaryPosition | null>(null);
  const selected = positions.find((position) => position.id === selectedId) ?? null;

  useEffect(() => {
    if (reference) {
      setSelectedId(reference);
      return;
    }
    if (!selectedId || !positions.some((position) => position.id === selectedId)) {
      setSelectedId(
        positions.find((position) => isOngoingBinaryPositionStatus(position.status))?.id ?? null,
      );
    }
  }, [positions, reference, selectedId]);

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
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
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
        className="surface-1 min-w-0 rounded-lg border border-border/60 p-4"
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
