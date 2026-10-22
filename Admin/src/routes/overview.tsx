import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { MetricCard } from "@/admin/components/MetricCard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { useAdminQuery } from "@/admin/data/context";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminSession } from "@/admin/session/session";
import { buildOverviewWorkItems, type OverviewWorkItem } from "@/admin/data/overview-work-items";
import { ErrorState, LoadingSkeleton } from "@/admin/components/states";
import { Users, Activity, Wallet, LifeBuoy, Radio, Timer } from "lucide-react";

export const Route = createFileRoute("/overview")({ component: OverviewPage });

function OverviewPage() {
  return (
    <RouteGuard permission="overview.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const session = useAdminSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canUsers = session.can("users.view");
  const canSessions = session.can("sessions.view");
  const canWithdrawals = session.can("withdrawals.view");
  const canSupport = session.can("support.view");
  const canFeeds = session.can("feeds.view");
  const canBinary = session.can("binary.view");
  const canKyc = session.can("kyc.view");
  const canHealth = session.can("health.view");
  const canAudit = session.can("audit.view");
  const users = useAdminQuery((p) => (canUsers ? p.listUsers() : Promise.resolve([])), [canUsers]);
  const sessions = useAdminQuery(
    (p) => (canSessions ? p.listSessions() : Promise.resolve([])),
    [canSessions],
  );
  const withdrawals = useAdminQuery(
    (p) => (canWithdrawals ? p.listWithdrawals() : Promise.resolve([])),
    [canWithdrawals],
  );
  const tickets = useAdminQuery(
    (p) => (canSupport ? p.listTickets() : Promise.resolve([])),
    [canSupport],
  );
  const feeds = useAdminQuery((p) => (canFeeds ? p.listFeeds() : Promise.resolve([])), [canFeeds]);
  const binary = useAdminQuery(
    (p) => (canBinary ? p.listBinaryPositions() : Promise.resolve([])),
    [canBinary],
  );
  const kyc = useAdminQuery((p) => (canKyc ? p.listKyc() : Promise.resolve([])), [canKyc]);
  const audit = useAdminQuery((p) => (canAudit ? p.listAudit() : Promise.resolve([])), [canAudit]);
  const health = useAdminQuery(
    (p) => (canHealth ? p.listHealth() : Promise.resolve([])),
    [canHealth],
  );

  const loading = [
    canUsers && users.loading,
    canSessions && sessions.loading,
    canWithdrawals && withdrawals.loading,
    canSupport && tickets.loading,
    canFeeds && feeds.loading,
    canBinary && binary.loading,
    canKyc && kyc.loading,
    canHealth && health.loading,
    canAudit && audit.loading,
  ].some(Boolean);
  const queueErrors = [
    canKyc && kyc.error && "KYC reviews",
    canWithdrawals && withdrawals.error && "withdrawals",
    canSupport && tickets.error && "support tickets",
    canHealth && health.error && "system health",
  ].filter(Boolean);
  const workItems = buildOverviewWorkItems({
    kyc: kyc.data ?? [],
    withdrawals: withdrawals.data ?? [],
    tickets: tickets.data ?? [],
    health: health.data ?? [],
    access: { kyc: canKyc, withdrawals: canWithdrawals, support: canSupport, health: canHealth },
  });
  const selected = workItems.find((item) => item.id === selectedId) ?? workItems[0] ?? null;
  const workColumns: DataTableColumn<OverviewWorkItem>[] = [
    {
      key: "label",
      header: "Work item",
      cell: (item) => <span className="font-medium">{item.label}</span>,
      sortValue: (item) => item.label,
    },
    {
      key: "category",
      header: "Area",
      cell: (item) => item.category,
      sortValue: (item) => item.category,
    },
    {
      key: "status",
      header: "Status",
      cell: (item) => (
        <StatusBadge
          tone={item.status === "down" || item.status === "escalated" ? "destructive" : "warning"}
        >
          {item.status}
        </StatusBadge>
      ),
      sortValue: (item) => item.status,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Operations Overview"
        description="Snapshot of platform activity, health, and pending work."
        badges={<ProviderBadge />}
      />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {canUsers && (
            <MetricCard
              label="Users"
              value={users.error ? "Unavailable" : (users.data?.length ?? 0)}
              icon={<Users className="h-4 w-4" />}
            />
          )}
          {canSessions && (
            <MetricCard
              label="Active sessions"
              value={
                sessions.error
                  ? "Unavailable"
                  : (sessions.data?.filter((s) => s.active).length ?? 0)
              }
              icon={<Activity className="h-4 w-4" />}
              tone="info"
            />
          )}
          {canWithdrawals && (
            <MetricCard
              label="Pending withdrawals"
              value={
                withdrawals.error
                  ? "Unavailable"
                  : (withdrawals.data?.filter((w) => w.status === "pending").length ?? 0)
              }
              icon={<Wallet className="h-4 w-4" />}
              tone="warning"
            />
          )}
          {canSupport && (
            <MetricCard
              label="Open tickets"
              value={
                tickets.error
                  ? "Unavailable"
                  : (tickets.data?.filter((t) => t.status === "open" || t.status === "escalated")
                      .length ?? 0)
              }
              icon={<LifeBuoy className="h-4 w-4" />}
              tone="destructive"
            />
          )}
          {canFeeds && (
            <MetricCard
              label="Live feeds"
              value={
                feeds.error
                  ? "Unavailable"
                  : `${feeds.data?.filter((f) => f.status === "LIVE").length ?? 0}/${feeds.data?.length ?? 0}`
              }
              icon={<Radio className="h-4 w-4" />}
              tone="success"
            />
          )}
          {canBinary && (
            <MetricCard
              label="Open binary positions"
              value={
                binary.error
                  ? "Unavailable"
                  : (binary.data?.filter((b) => b.status === "open").length ?? 0)
              }
              icon={<Timer className="h-4 w-4" />}
              tone="primary"
            />
          )}
        </div>
      )}

      <section
        className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]"
        aria-label="Operations queue"
      >
        <div className="surface-1 min-w-0 rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Operations queue</h2>
            <span className="mono text-xs text-muted-foreground">
              {queueErrors.length ? "—" : `${workItems.length} items`}
            </span>
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : (
            <>
              {queueErrors.length > 0 ? (
                <p role="status" className="mb-3 text-xs text-warning">
                  Some work queues are unavailable: {queueErrors.join(", ")}.
                </p>
              ) : null}
              <DataTable
                data={workItems}
                columns={workColumns}
                rowKey={(item) => item.id}
                selectedKey={selected?.id}
                onRowClick={(item) => setSelectedId(item.id)}
                searchable={(item) => `${item.label} ${item.category} ${item.status}`}
                searchPlaceholder="Search operations"
                emptyTitle={queueErrors.length ? "Queue data unavailable" : "No actionable work"}
                emptyDescription={
                  queueErrors.length
                    ? "Check the affected workspace before treating this queue as clear."
                    : "There are no pending items in the workspaces available to your role."
                }
                pageSize={6}
              />
            </>
          )}
        </div>
        <aside
          className="surface-1 rounded-lg border border-border/60 p-4"
          aria-label="Selected operation details"
        >
          <h2 className="mb-3 text-sm font-semibold text-foreground">Selected item</h2>
          {selected ? (
            <div className="flex min-h-32 flex-col items-start gap-3">
              <div>
                <p className="font-medium text-foreground">{selected.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.category} · {selected.status}
                </p>
              </div>
              <Link
                to={selected.to}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open workspace
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an item to see its workspace.</p>
          )}
        </aside>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {canHealth && (
          <div className="surface-1 rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">System health</h2>
            </div>
            {health.error ? (
              <p className="text-sm text-destructive">
                System health is unavailable. Retry the Health workspace.
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {(health.data ?? []).map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">{h.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="mono text-xs text-muted-foreground">{h.latencyMs}ms</span>
                      <StatusBadge
                        tone={
                          h.status === "ok"
                            ? "success"
                            : h.status === "degraded"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {h.status}
                      </StatusBadge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {canAudit && (
          <div className="surface-1 rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent admin actions</h2>
            </div>
            {audit.error ? (
              <p className="text-sm text-destructive">
                Recent admin actions are unavailable. Retry the Audit workspace.
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {(audit.data ?? []).slice(0, 6).map((a) => (
                  <li key={a.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="mono text-xs text-primary">{a.action}</span>
                      <span className="mono text-[10px] text-muted-foreground">
                        {new Date(a.ts).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-foreground">{a.actor}</span> · target{" "}
                      <span className="mono">{a.target}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
