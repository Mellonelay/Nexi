import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { MetricCard } from "@/admin/components/MetricCard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { useAdminQuery } from "@/admin/data/context";
import { LoadingSkeleton } from "@/admin/components/states";
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
  const users = useAdminQuery((p) => p.listUsers());
  const sessions = useAdminQuery((p) => p.listSessions());
  const withdrawals = useAdminQuery((p) => p.listWithdrawals());
  const tickets = useAdminQuery((p) => p.listTickets());
  const feeds = useAdminQuery((p) => p.listFeeds());
  const binary = useAdminQuery((p) => p.listBinaryPositions());
  const audit = useAdminQuery((p) => p.listAudit());
  const health = useAdminQuery((p) => p.listHealth());

  const loading = users.loading || sessions.loading || withdrawals.loading || tickets.loading;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Operations Overview"
        description="Live mock snapshot of platform activity, health, and pending work."
        badges={<StatusBadge tone="warning">Mock data</StatusBadge>}
      />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Users"
            value={users.data?.length ?? 0}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            label="Active sessions"
            value={sessions.data?.filter((s) => s.active).length ?? 0}
            icon={<Activity className="h-4 w-4" />}
            tone="info"
          />
          <MetricCard
            label="Pending withdrawals"
            value={withdrawals.data?.filter((w) => w.status === "pending").length ?? 0}
            icon={<Wallet className="h-4 w-4" />}
            tone="warning"
          />
          <MetricCard
            label="Open tickets"
            value={
              tickets.data?.filter((t) => t.status === "open" || t.status === "escalated").length ??
              0
            }
            icon={<LifeBuoy className="h-4 w-4" />}
            tone="destructive"
          />
          <MetricCard
            label="Live feeds"
            value={`${feeds.data?.filter((f) => f.status === "LIVE").length ?? 0}/${feeds.data?.length ?? 0}`}
            icon={<Radio className="h-4 w-4" />}
            tone="success"
          />
          <MetricCard
            label="Open binary positions"
            value={binary.data?.filter((b) => b.status === "open").length ?? 0}
            icon={<Timer className="h-4 w-4" />}
            tone="primary"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="surface-1 rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">System health</h2>
            <StatusBadge tone="info">Mock</StatusBadge>
          </div>
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
        </div>

        <div className="surface-1 rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent admin actions</h2>
            <StatusBadge tone="info">Mock audit</StatusBadge>
          </div>
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
        </div>
      </div>
    </div>
  );
}
