import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { GovernanceShell, ReceiptBanner } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { ROLE_LIST } from "@/admin/config/roles";
import type { AdminUser, RoleId } from "@/admin/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admins")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="admins.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const canSetStatus =
    session.can("admins.edit") && provider.supports?.("setAdminStatus") !== false;
  const receipt = useReceipt();
  const adminsQ = useAdminQuery((p) => p.listAdmins());
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [pending, setPending] = useState<{
    admin: AdminUser;
    kind: "status" | "role";
    value: string;
  } | null>(null);
  const admins = adminsQ.data ?? [];
  const activeSessions = useMemo(
    () =>
      (adminsQ.data ?? []).flatMap((admin) => admin.sessions ?? []).filter((s) => s.active).length,
    [adminsQ.data],
  );
  const refresh = () => {
    adminsQ.refresh();
  };
  if (adminsQ.loading)
    return (
      <GovernanceShell title="Admin Accounts" description="Governed operator identity and access.">
        <LoadingSkeleton rows={5} />
      </GovernanceShell>
    );
  if (adminsQ.error)
    return (
      <GovernanceShell title="Admin Accounts" description="Governed operator identity and access.">
        <ErrorState title="Could not load admin accounts" description={adminsQ.error.message} />
      </GovernanceShell>
    );
  const cols: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Account",
      sortValue: (a) => a.displayName,
      cell: (a) => (
        <div>
          <div className="font-medium">{a.displayName}</div>
          <div className="text-xs text-muted-foreground">{a.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortValue: (a) => a.role,
      cell: (a) => (
        <span className="mono text-xs text-primary">
          {ROLE_LIST.find((r) => r.id === a.role)?.label ?? a.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status ?? "unknown",
      cell: (a) => (
        <StatusBadge
          tone={
            a.status === "suspended"
              ? "destructive"
              : a.status === "invited"
                ? "warning"
                : "success"
          }
        >
          {a.status ?? "unknown"}
        </StatusBadge>
      ),
    },
    {
      key: "mfa",
      header: "MFA",
      cell: (a) => (
        <StatusBadge
          tone={
            a.mfaState === "enabled" || a.mfaEnabled
              ? "success"
              : a.mfaState === "unknown"
                ? "neutral"
                : "warning"
          }
        >
          {a.mfaState ??
            (a.mfaEnabled === undefined ? "unknown" : a.mfaEnabled ? "enabled" : "not enabled")}
        </StatusBadge>
      ),
    },
    {
      key: "last",
      header: "Last active",
      sortValue: (a) => a.lastActiveAt,
      cell: (a) => (
        <span className="mono text-xs text-muted-foreground">
          {new Date(a.lastActiveAt).toLocaleString()}
        </span>
      ),
    },
  ];
  const filters: DataTableFilter<AdminUser>[] = [
    {
      key: "status",
      label: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "invited", label: "Invited" },
      ],
      match: (a, v) => (a.status ?? "unknown") === v,
    },
  ];
  return (
    <GovernanceShell
      title="Admin Accounts"
      description="Review operator status, role, MFA, and session visibility."
    >
      <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
      <DataTable
        data={admins}
        columns={cols}
        filters={filters}
        searchable={(a) => `${a.displayName} ${a.email} ${a.role}`}
        searchPlaceholder="Search account…"
        rowKey={(a) => a.id}
        onRowClick={setSelected}
        rowActions={(a) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
              Inspect
            </Button>
            <Button
              size="sm"
              disabled={!canSetStatus}
              onClick={() =>
                setPending({
                  admin: a,
                  kind: "status",
                  value: a.status === "suspended" ? "active" : "suspended",
                })
              }
            >
              {a.status === "suspended" ? "Reactivate" : "Suspend"}
            </Button>
          </div>
        )}
      />
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.displayName ?? ""}
        subtitle={selected?.email}
        badges={
          selected ? (
            <StatusBadge tone={selected.status === "suspended" ? "destructive" : "success"}>
              {selected.status ?? "unknown"}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "identity",
                  title: "Account",
                  fields: [
                    {
                      label: "Role",
                      value: ROLE_LIST.find((r) => r.id === selected.role)?.label ?? selected.role,
                    },
                    {
                      label: "MFA",
                      value:
                        selected.mfaState ??
                        (selected.mfaEnabled === undefined
                          ? "Unknown"
                          : selected.mfaEnabled
                            ? "Enabled"
                            : "Not enabled"),
                    },
                    {
                      label: "Last active",
                      value: new Date(selected.lastActiveAt).toLocaleString(),
                    },
                    { label: "Active sessions", value: String(activeSessions) },
                  ],
                },
                {
                  id: "audit",
                  title: "Recent audit",
                  content: (
                    <p className="text-xs text-muted-foreground">
                      Use Audit Logs to inspect linked before/after events for {selected.id}.
                    </p>
                  ),
                },
              ]
            : []
        }
        actions={
          selected ? (
            <div className="flex flex-wrap gap-2">
              {provider.setAdminRole ? (
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={selected.role}
                  disabled={!session.can("admins.edit")}
                  onChange={(e) =>
                    setPending({ admin: selected, kind: "role", value: e.target.value })
                  }
                >
                  {ROLE_LIST.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="flex h-9 items-center rounded-md border border-border/60 px-2 text-xs text-muted-foreground">
                  Role assignment unavailable
                </span>
              )}
              <Button
                variant="outline"
                disabled={!canSetStatus}
                onClick={() =>
                  setPending({
                    admin: selected,
                    kind: "status",
                    value: selected.status === "suspended" ? "active" : "suspended",
                  })
                }
              >
                {selected.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </div>
          ) : null
        }
      />
      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => !o && setPending(null)}
          title={pending.kind === "role" ? "Assign admin role" : "Change account status"}
          description="Governed action updates the provider and creates an audit event."
          target={pending.admin.displayName}
          targetId={pending.admin.id}
          action={pending.kind === "role" ? "admins.set_role" : "admins.set_status"}
          permission="admins.edit"
          currentState={
            pending.kind === "role" ? pending.admin.role : (pending.admin.status ?? "active")
          }
          proposedState={pending.value}
          destructive={pending.kind === "status" && pending.value === "suspended"}
          onConfirm={async (reason) => {
            const ctx = {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            };
            if (pending.kind === "role" && !provider.setAdminRole) {
              throw new Error("Role assignment is unavailable from the active provider.");
            }
            const result =
              pending.kind === "role"
                ? await provider.setAdminRole!(pending.admin.id, pending.value as RoleId, ctx)
                : await provider.setAdminStatus(
                    pending.admin.id,
                    pending.value as "active" | "suspended",
                    ctx,
                  );
            receipt.record(
              pending.kind === "role" ? "admins.set_role" : "admins.set_status",
              result,
            );
            refresh();
            setSelected(null);
            return result;
          }}
        />
      ) : null}
    </GovernanceShell>
  );
}
