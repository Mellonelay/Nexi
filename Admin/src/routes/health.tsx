import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GovernanceShell } from "@/admin/components/GovernancePrimitives";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/admin/components/states";
import { useAdminQuery } from "@/admin/data/context";
import type { HealthCheck, IncidentMessage } from "@/admin/types";

export const Route = createFileRoute("/health")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="health.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const healthQ = useAdminQuery((p) => p.listHealth());
  const incidentsQ = useAdminQuery((p) => p.listIncidents());
  const [incident, setIncident] = useState<IncidentMessage | null>(null);
  if (healthQ.loading || incidentsQ.loading)
    return (
      <GovernanceShell
        title="System Health"
        description="Service status, dependency freshness, latency, and incident context."
      >
        <LoadingSkeleton rows={6} />
      </GovernanceShell>
    );
  if (healthQ.error)
    return (
      <GovernanceShell
        title="System Health"
        description="Service status, dependency freshness, latency, and incident context."
      >
        <ErrorState
          title="Could not load health"
          description={(healthQ.error ?? incidentsQ.error)?.message ?? "Unknown error"}
        />
      </GovernanceShell>
    );
  const checks = healthQ.data ?? [];
  const incidents = incidentsQ.data ?? [];
  const bad = checks.filter((c) => c.status !== "ok").length;
  return (
    <GovernanceShell
      title="System Health"
      description="Service status, dependency freshness, latency, and incident context."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Services" value={String(checks.length)} />
        <Metric label="Healthy" value={String(checks.length - bad)} />
        <Metric label="Degraded / unavailable" value={String(bad)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((c) => (
          <HealthCard key={c.id} check={c} />
        ))}
      </div>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Incidents</h2>
          <StatusBadge tone="info">{incidents.length} records</StatusBadge>
        </div>
        {incidents.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {incidents.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIncident(i)}
                className="surface-1 rounded-lg border border-border/60 p-4 text-left hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{i.title}</span>
                  <StatusBadge
                    tone={
                      i.severity === "critical"
                        ? "destructive"
                        : i.severity === "warning"
                          ? "warning"
                          : "info"
                    }
                  >
                    {i.severity}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{i.body}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active incidents"
            description="Historical incident records will appear here when available from the active provider."
          />
        )}
      </section>
      <DetailDrawer
        open={!!incident}
        onOpenChange={(o) => !o && setIncident(null)}
        title={incident?.title ?? ""}
        subtitle="Incident detail"
        sections={
          incident
            ? [
                {
                  id: "incident",
                  title: "Incident",
                  fields: [
                    { label: "Severity", value: incident.severity },
                    { label: "Posted", value: new Date(incident.postedAt).toLocaleString() },
                    { label: "State", value: incident.active ? "Active" : "Historical" },
                    { label: "Body", value: incident.body, className: "sm:col-span-2" },
                  ],
                },
                {
                  id: "ack",
                  title: "Acknowledgement",
                  content: (
                    <p className="text-xs text-muted-foreground">
                      Governed acknowledgement is unavailable in the current provider contract; no
                      mutation control is shown.
                    </p>
                  ),
                },
              ]
            : []
        }
      />
    </GovernanceShell>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-1 rounded-lg border border-border/60 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="mono text-2xl">{value}</span>
      </div>
    </div>
  );
}
function HealthCard({ check }: { check: HealthCheck }) {
  return (
    <div className="surface-1 flex items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
      <div>
        <div className="font-medium">{check.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Updated {new Date(check.updatedAt).toLocaleString()}
        </div>
      </div>
      <div className="text-right">
        <StatusBadge
          tone={
            check.status === "ok"
              ? "success"
              : check.status === "degraded"
                ? "warning"
                : "destructive"
          }
        >
          {check.status}
        </StatusBadge>
        <div className="mono mt-1 text-xs text-muted-foreground">{check.latencyMs} ms</div>
      </div>
    </div>
  );
}
