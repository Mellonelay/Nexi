import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { GovernanceShell, JsonState } from "@/admin/components/GovernancePrimitives";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminQuery } from "@/admin/data/context";
import type { AuditEvent } from "@/admin/types";

export const Route = createFileRoute("/audit")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="audit.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const q = useAdminQuery((p) => p.listAudit());
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  if (q.loading)
    return (
      <GovernanceShell
        title="Audit Logs"
        description="Immutable mock record of governed operations."
      >
        <LoadingSkeleton rows={8} />
      </GovernanceShell>
    );
  if (q.error)
    return (
      <GovernanceShell
        title="Audit Logs"
        description="Immutable mock record of governed operations."
      >
        <ErrorState title="Could not load audit logs" description={q.error.message} />
      </GovernanceShell>
    );
  const cols: DataTableColumn<AuditEvent>[] = [
    {
      key: "time",
      header: "Timestamp",
      sortValue: (e) => e.ts,
      cell: (e) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(e.ts).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      sortValue: (e) => e.actor,
      cell: (e) => (
        <div>
          <div>{e.actor}</div>
          <span className="mono text-[10px] text-muted-foreground">{e.role}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortValue: (e) => e.action,
      cell: (e) => <span className="mono text-xs text-primary">{e.action}</span>,
    },
    {
      key: "target",
      header: "Target",
      sortValue: (e) => e.target,
      cell: (e) => <span className="mono text-xs">{e.target}</span>,
    },
    {
      key: "env",
      header: "Environment",
      sortValue: (e) => e.environment,
      cell: (e) => (
        <StatusBadge
          tone={
            e.environment === "PRODUCTION"
              ? "destructive"
              : e.environment === "SANDBOX"
                ? "warning"
                : "info"
          }
        >
          {e.environment}
        </StatusBadge>
      ),
    },
    {
      key: "result",
      header: "Result",
      sortValue: (e) => e.result,
      cell: (e) => (
        <StatusBadge tone={e.result === "ok" ? "success" : "destructive"}>{e.result}</StatusBadge>
      ),
    },
  ];
  return (
    <GovernanceShell
      title="Audit Logs"
      description="Searchable actor, action, target, environment, result, correlation, and before/after evidence."
    >
      <DataTable
        data={q.data ?? []}
        columns={cols}
        searchable={(e) =>
          `${e.actor} ${e.role} ${e.action} ${e.target} ${e.environment} ${e.result} ${e.correlationId} ${e.reason}`
        }
        searchPlaceholder="Search actor, action, target, correlation…"
        rowKey={(e) => e.id}
        onRowClick={setSelected}
      />
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.action ?? ""}
        subtitle={selected?.target}
        badges={
          selected ? (
            <StatusBadge tone={selected.result === "ok" ? "success" : "destructive"}>
              {selected.result}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "event",
                  title: "Event",
                  fields: [
                    { label: "Actor", value: `${selected.actor} · ${selected.role}` },
                    { label: "Environment", value: selected.environment },
                    { label: "Timestamp", value: new Date(selected.ts).toLocaleString() },
                    { label: "Correlation", value: selected.correlationId, mono: true },
                    { label: "Reason", value: selected.reason, className: "sm:col-span-2" },
                  ],
                },
                {
                  id: "evidence",
                  title: "Before and after evidence",
                  content: (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <JsonState value={selected.before} />
                      <JsonState value={selected.after} />
                    </div>
                  ),
                },
                {
                  id: "links",
                  title: "Related records",
                  fields: [
                    { label: "Audit ID", value: selected.id, mono: true },
                    { label: "Approval or mutation link", value: selected.target },
                  ],
                },
              ]
            : []
        }
      />
    </GovernanceShell>
  );
}
