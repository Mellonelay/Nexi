import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GovernanceShell, ReceiptBanner } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import type { MaintenanceScope, MaintenanceWindow } from "@/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/maintenance")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="maintenance.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const receipt = useReceipt();
  const q = useAdminQuery((p) => p.listMaintenanceWindows());
  const [scope, setScope] = useState<MaintenanceScope>("global");
  const [target, setTarget] = useState("all");
  const [scheduledAt, setScheduledAt] = useState(isoInput(60));
  const [endsAt, setEndsAt] = useState(isoInput(120));
  const [pending, setPending] = useState<{
    kind: "schedule" | "cancel";
    item?: MaintenanceWindow;
  } | null>(null);
  if (q.loading)
    return (
      <GovernanceShell
        title="Maintenance"
        description="Governed service, route, market, and pair windows."
      >
        <LoadingSkeleton rows={7} />
      </GovernanceShell>
    );
  if (q.error)
    return (
      <GovernanceShell
        title="Maintenance"
        description="Governed service, route, market, and pair windows."
      >
        <ErrorState title="Could not load maintenance" description={q.error.message} />
      </GovernanceShell>
    );
  const windows = q.data ?? [];
  const canEdit = session.can("maintenance.edit");
  return (
    <GovernanceShell
      title="Maintenance"
      description="Schedule and cancel maintenance windows with exact target and timing."
    >
      <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
      <div className="surface-1 grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-5">
        <div>
          <Label>Scope</Label>
          <select
            value={scope}
            aria-label="Maintenance scope"
            onChange={(e) => setScope(e.target.value as MaintenanceScope)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="global">Global</option>
            <option value="route">Route</option>
            <option value="market">Market</option>
            <option value="pair">Pair</option>
          </select>
        </div>
        <div>
          <Label>Target</Label>
          <Input className="mt-1" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div>
          <Label>Start</Label>
          <Input
            className="mt-1"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <Label>End</Label>
          <Input
            className="mt-1"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            className="w-full"
            disabled={!canEdit || !target.trim()}
            onClick={() => setPending({ kind: "schedule" })}
          >
            Schedule
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {windows.map((w) => (
          <div key={w.id} className="surface-1 rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-medium">{w.target}</span>
                <div className="mt-1 text-xs text-muted-foreground">
                  {w.scope} · {new Date(w.scheduledAt).toLocaleString()} →{" "}
                  {new Date(w.endsAt).toLocaleString()}
                </div>
              </div>
              <StatusBadge
                tone={
                  w.status === "active"
                    ? "warning"
                    : w.status === "scheduled"
                      ? "info"
                      : w.status === "cancelled"
                        ? "destructive"
                        : "neutral"
                }
              >
                {w.status}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{w.reason}</p>
            {w.status === "scheduled" || w.status === "active" ? (
              <Button
                className="mt-3"
                size="sm"
                variant="destructive"
                disabled={!canEdit}
                onClick={() => setPending({ kind: "cancel", item: w })}
              >
                Cancel window
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {pending?.kind === "schedule" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => !o && setPending(null)}
          title="Schedule maintenance"
          description="The exact scope, target, timing, environment, and reason will be recorded."
          target={`${scope}:${target}`}
          targetId={`${scope}:${target}`}
          action="maintenance.schedule"
          permission="maintenance.edit"
          currentState="not scheduled"
          proposedState={`scheduled ${scheduledAt} → ${endsAt}`}
          onConfirm={async (reason) => {
            const result = await provider.scheduleMaintenanceWindow(
              {
                scope,
                target,
                scheduledAt: new Date(scheduledAt).toISOString(),
                endsAt: new Date(endsAt).toISOString(),
                reason,
              },
              {
                actor: session.actorName,
                role: session.roleId,
                environment: session.environment,
                reason,
              },
            );
            receipt.record("maintenance.schedule", result);
            q.refresh();
            return result;
          }}
        />
      ) : null}
      {pending?.kind === "cancel" && pending.item ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => !o && setPending(null)}
          title="Cancel maintenance"
          description="Cancellation is auditable and preserves the original window history."
          target={pending.item.target}
          targetId={pending.item.id}
          action="maintenance.cancel"
          permission="maintenance.edit"
          currentState={pending.item.status}
          proposedState="cancelled"
          destructive
          onConfirm={async (reason) => {
            const result = await provider.cancelMaintenanceWindow(pending.item!.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            });
            receipt.record("maintenance.cancel", result);
            q.refresh();
            return result;
          }}
        />
      ) : null}
    </GovernanceShell>
  );
}
function isoInput(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
