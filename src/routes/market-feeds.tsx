import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
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
import type { MarketFeed, FeedStatus } from "@/admin/types";
import { Zap, ZapOff, Radio, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/market-feeds")({ component: Page });

type PendingAction =
  | { kind: "status"; row: MarketFeed; next: FeedStatus }
  | { kind: "failover"; row: MarketFeed };

function Page() {
  return (
    <RouteGuard permission="feeds.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listFeeds());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const feeds = useMemo(() => q.data ?? [], [q.data]);
  const selected = useMemo(
    () => (selectedId ? (feeds.find((f) => f.id === selectedId) ?? null) : null),
    [feeds, selectedId],
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
        <ErrorState title="Could not load feeds" description={q.error.message} />
      </Shell>
    );

  const canEdit = session.can("feeds.edit");
  const liveCount = feeds.filter((f) => f.status === "LIVE").length;
  const staleCount = feeds.filter((f) => f.status === "STALE").length;
  const downCount = feeds.filter((f) => f.status === "UNAVAILABLE").length;

  const columns: DataTableColumn<MarketFeed>[] = [
    {
      key: "pair",
      header: "Pair",
      sortValue: (f) => f.pair,
      cell: (f) => <span className="mono text-sm font-medium">{f.pair}</span>,
    },
    {
      key: "provider",
      header: "Primary",
      sortValue: (f) => f.provider,
      cell: (f) => <span className="mono text-xs">{f.provider}</span>,
    },
    {
      key: "fallback",
      header: "Fallback",
      cell: (f) =>
        f.fallback ? (
          <span className="mono text-xs text-muted-foreground">{f.fallback}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "latency",
      header: "Latency",
      align: "right",
      sortValue: (f) => f.latencyMs,
      cell: (f) => <span className={latencyClass(f.latencyMs, f.status)}>{f.latencyMs} ms</span>,
    },
    {
      key: "age",
      header: "Age",
      align: "right",
      sortValue: (f) => f.ageMs,
      cell: (f) => <span className={ageClass(f.ageMs, f.status)}>{formatAge(f.ageMs)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (f) => f.status,
      cell: (f) => <StatusBadge tone={feedTone(f.status)}>{f.status}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<MarketFeed>[] = [
    {
      key: "status",
      label: "status",
      options: (["LIVE", "STALE", "UNAVAILABLE", "DISABLED"] as FeedStatus[]).map((s) => ({
        value: s,
        label: s,
      })),
      match: (f, v) => f.status === v,
    },
  ];

  return (
    <Shell live={liveCount} stale={staleCount} down={downCount} total={feeds.length}>
      <DataTable
        data={feeds}
        columns={columns}
        filters={filters}
        searchable={(f) => `${f.pair} ${f.provider} ${f.fallback ?? ""}`}
        searchPlaceholder="Search pair or provider…"
        rowKey={(f) => f.id}
        onRowClick={(f) => setSelectedId(f.id)}
        rowActions={(f) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`feed-inspect-${f.id}`}
              onClick={() => setSelectedId(f.id)}
            >
              Inspect
            </Button>
            {f.status !== "DISABLED" ? (
              <>
                {f.fallback ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`feed-failover-${f.id}`}
                    disabled={!canEdit}
                    onClick={() => setPending({ kind: "failover", row: f })}
                  >
                    <Radio className="mr-1 h-3.5 w-3.5" /> Failover
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  data-testid={`feed-disable-${f.id}`}
                  disabled={!canEdit}
                  onClick={() => setPending({ kind: "status", row: f, next: "DISABLED" })}
                >
                  <ZapOff className="mr-1 h-3.5 w-3.5" /> Disable
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                data-testid={`feed-enable-${f.id}`}
                disabled={!canEdit}
                onClick={() => setPending({ kind: "status", row: f, next: "LIVE" })}
              >
                <Zap className="mr-1 h-3.5 w-3.5" /> Re-enable
              </Button>
            )}
          </div>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono">{selected.pair}</span> : ""}
        subtitle={selected ? `${selected.id} · ${selected.provider}` : undefined}
        badges={
          selected ? (
            <StatusBadge tone={feedTone(selected.status)}>{selected.status}</StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "feed",
                  title: "Feed",
                  fields: [
                    { label: "Pair", value: selected.pair, mono: true },
                    { label: "Primary provider", value: selected.provider, mono: true },
                    { label: "Fallback provider", value: selected.fallback ?? "—", mono: true },
                    { label: "Latency", value: `${selected.latencyMs} ms`, mono: true },
                    { label: "Sample age", value: formatAge(selected.ageMs), mono: true },
                    { label: "Status", value: selected.status, mono: true },
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
            <>
              {selected.fallback && selected.status !== "DISABLED" ? (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="feed-detail-failover"
                  disabled={!canEdit}
                  onClick={() => setPending({ kind: "failover", row: selected })}
                >
                  <Radio className="mr-1 h-3.5 w-3.5" /> Failover
                </Button>
              ) : null}
              {selected.status === "DISABLED" ? (
                <Button
                  size="sm"
                  data-testid="feed-detail-enable"
                  disabled={!canEdit}
                  onClick={() => setPending({ kind: "status", row: selected, next: "LIVE" })}
                >
                  <Zap className="mr-1 h-3.5 w-3.5" /> Re-enable
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  data-testid="feed-detail-disable"
                  disabled={!canEdit}
                  onClick={() => setPending({ kind: "status", row: selected, next: "DISABLED" })}
                >
                  <ShieldOff className="mr-1 h-3.5 w-3.5" /> Disable
                </Button>
              )}
            </>
          ) : null
        }
      />

      {pending?.kind === "status" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={pending.next === "DISABLED" ? "Disable market feed" : "Re-enable market feed"}
          description="Disabled feeds do not power public quotes or order routing on this pair."
          target={<span className="mono">{pending.row.pair}</span>}
          targetId={pending.row.id}
          action={`feeds.set_status:${pending.next}`}
          permission="feeds.edit"
          currentState={
            <StatusBadge tone={feedTone(pending.row.status)}>{pending.row.status}</StatusBadge>
          }
          proposedState={<StatusBadge tone={feedTone(pending.next)}>{pending.next}</StatusBadge>}
          destructive={pending.next === "DISABLED"}
          submitLabel={pending.next === "DISABLED" ? "Disable" : "Re-enable"}
          successMessage="Feed status updated"
          onConfirm={(reason) =>
            provider.setFeedStatus(pending.row.id, pending.next, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "failover" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Failover to fallback provider"
          description="Promotes the fallback to primary. The current primary becomes the fallback."
          target={<span className="mono">{pending.row.pair}</span>}
          targetId={pending.row.id}
          action="feeds.failover"
          permission="feeds.edit"
          currentState={
            <span className="mono text-xs">
              {pending.row.provider} →{" "}
              <span className="text-muted-foreground">{pending.row.fallback}</span>
            </span>
          }
          proposedState={
            <span className="mono text-xs">
              {pending.row.fallback} →{" "}
              <span className="text-muted-foreground">{pending.row.provider}</span>
            </span>
          }
          submitLabel="Failover"
          successMessage="Failover executed"
          onConfirm={(reason) =>
            provider.failoverFeed(pending.row.id, {
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
  live,
  stale,
  down,
}: {
  children: React.ReactNode;
  total?: number;
  live?: number;
  stale?: number;
  down?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Market Feeds"
        description="Provider mapping, latency, freshness, and manual failover/maintenance controls."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} feeds
              </StatusBadge>
            ) : null}
            {live !== undefined ? (
              <StatusBadge tone="success" dot={false}>
                {live} live
              </StatusBadge>
            ) : null}
            {stale ? (
              <StatusBadge tone="warning" dot={false}>
                {stale} stale
              </StatusBadge>
            ) : null}
            {down ? (
              <StatusBadge tone="destructive" dot={false}>
                {down} down
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function feedTone(s: FeedStatus) {
  switch (s) {
    case "LIVE":
      return "success" as const;
    case "STALE":
      return "warning" as const;
    case "UNAVAILABLE":
      return "destructive" as const;
    case "DISABLED":
      return "neutral" as const;
  }
}
function formatAge(ms: number) {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}
function latencyClass(ms: number, status: FeedStatus) {
  if (status === "UNAVAILABLE" || status === "DISABLED")
    return "mono text-xs text-muted-foreground";
  if (ms > 150) return "mono text-xs text-warning";
  return "mono text-xs";
}
function ageClass(ms: number, status: FeedStatus) {
  if (status === "UNAVAILABLE" || status === "DISABLED")
    return "mono text-xs text-muted-foreground";
  if (ms > 3000) return "mono text-xs text-warning";
  return "mono text-xs";
}
