import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GovernanceShell, ReceiptBanner } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { PERMISSION_GROUPS, ROLE_LIST } from "@/admin/config/roles";
import type { Permission, RoleId } from "@/admin/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/roles")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="roles.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const receipt = useReceipt();
  const q = useAdminQuery((p) => p.listRoleDefinitions());
  const [roleId, setRoleId] = useState<RoleId>("super_admin");
  const [pending, setPending] = useState<{
    role: RoleId;
    permission: Permission;
    enabled: boolean;
  } | null>(null);
  if (q.loading)
    return (
      <GovernanceShell title="Roles & Permissions" description="Nine-role permission matrix.">
        <LoadingSkeleton rows={8} />
      </GovernanceShell>
    );
  if (q.error)
    return (
      <GovernanceShell title="Roles & Permissions" description="Nine-role permission matrix.">
        <ErrorState title="Could not load roles" description={q.error.message} />
      </GovernanceShell>
    );
  const role = q.data?.find((r) => r.id === roleId);
  const current = new Set(role?.permissions ?? []);
  const canEdit =
    session.can("roles.edit") && provider.supports?.("updateRolePermission") !== false;
  return (
    <GovernanceShell
      title="Roles & Permissions"
      description="Governed permission editing with explicit before/after state."
    >
      <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="surface-1 rounded-lg border border-border/60 p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Roles ({ROLE_LIST.length})
          </div>
          <div className="flex flex-col gap-1">
            {ROLE_LIST.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoleId(r.id)}
                className={`rounded-md px-3 py-2 text-left text-sm ${r.id === roleId ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-muted/40"}`}
              >
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="surface-1 rounded-lg border border-border/60 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{role?.label}</h2>
              <p className="text-xs text-muted-foreground">{role?.description}</p>
            </div>
            <span className="mono text-xs text-muted-foreground">{current.size} enabled</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {PERMISSION_GROUPS.map((g) => (
              <section key={g.label} className="rounded-md border border-border/50 p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </h3>
                <div className="flex flex-col gap-2">
                  {g.perms.map((perm) => (
                    <Label key={perm} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={current.has(perm)}
                        disabled={!canEdit}
                        onCheckedChange={(checked) =>
                          setPending({ role: roleId, permission: perm, enabled: checked === true })
                        }
                      />
                      <span className="mono">{perm}</span>
                    </Label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => !o && setPending(null)}
          title="Edit role permission"
          description="Privilege changes are reason-required and audited by the active provider."
          target={ROLE_LIST.find((r) => r.id === pending.role)?.label ?? pending.role}
          targetId={pending.role}
          action="roles.edit"
          permission="roles.edit"
          currentState={`${pending.permission}: ${pending.enabled ? "disabled" : "enabled"}`}
          proposedState={`${pending.permission}: ${pending.enabled ? "enabled" : "disabled"}`}
          destructive={!pending.enabled}
          onConfirm={async (reason) => {
            const result = await provider.updateRolePermission(
              pending.role,
              pending.permission,
              pending.enabled,
              {
                actor: session.actorName,
                role: session.roleId,
                environment: session.environment,
                reason,
              },
            );
            receipt.record("roles.edit", result);
            q.refresh();
            return result;
          }}
        />
      ) : null}
    </GovernanceShell>
  );
}
