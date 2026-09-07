import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GovernanceShell, ReceiptBanner, JsonState } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { MaintenanceState, UnauthorizedState, EmptyState } from "@/admin/components/states";
import { useAdminData } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/sandbox")({ component: Page });
type Scenario = {
  id: string;
  name: string;
  scope: "binary" | "spot" | "balance";
  target: string;
  seed: string;
  duration: string;
  expectedResult: string;
  mode: "normal" | "forced_win" | "forced_loss";
  expiresAt: string;
  result?: string;
  auditId?: string;
  status?: "requested" | "executed";
};
function Page() {
  return (
    <RouteGuard permission="sandbox.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const receipt = useReceipt();
  const allowed = session.environment === "SANDBOX" && session.can("sandbox.force");
  const [history, setHistory] = useState<Scenario[]>([]);
  const [pending, setPending] = useState<Scenario | null>(null);
  const [form, setForm] = useState<Scenario>({
    id: "draft",
    name: "Options sandbox scenario",
    scope: "binary",
    target: "bin_ethusdt",
    seed: "QA-001",
    duration: "15 minutes",
    expectedResult: "",
    mode: "normal",
    expiresAt: isoInput(30),
  });
  const update = <K extends keyof Scenario>(key: K, value: Scenario[K]) =>
    setForm((v) => ({ ...v, [key]: value }));
  return (
    <GovernanceShell
      title="Sandbox Controls"
      description="Deterministic mock scenarios only. No public or production authority."
      badges={false}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <StatusBadge tone="destructive">SANDBOX_ONLY</StatusBadge>
        <StatusBadge tone="destructive">NOT_FOR_REAL_USER_PRODUCTION</StatusBadge>
        <StatusBadge tone="warning">AUDIT_LOG_REQUIRED</StatusBadge>
      </div>
      {session.environment !== "SANDBOX" ? (
        <MaintenanceState description="Execution is denied unless the environment selector is SANDBOX." />
      ) : !session.can("sandbox.force") ? (
        <UnauthorizedState requiredPermission="sandbox.force" />
      ) : (
        <>
          <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
          <div className="surface-1 grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>Scenario name / preset</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div>
              <Label>Target scope</Label>
              <select
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.scope}
                onChange={(e) => update("scope", e.target.value as Scenario["scope"])}
              >
                <option value="binary">Binary</option>
                <option value="spot">Spot</option>
                <option value="balance">Balance simulation</option>
              </select>
            </div>
            <div>
              <Label>Target account / entity</Label>
              <Input
                className="mt-1"
                value={form.target}
                onChange={(e) => update("target", e.target.value)}
              />
            </div>
            <div>
              <Label>Deterministic seed</Label>
              <Input
                className="mt-1"
                value={form.seed}
                onChange={(e) => update("seed", e.target.value)}
              />
            </div>
            <div>
              <Label>Expiry / duration</Label>
              <Input
                className="mt-1"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
            </div>
            <div>
              <Label>Forced outcome / mode</Label>
              <select
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.mode}
                onChange={(e) => update("mode", e.target.value as Scenario["mode"])}
              >
                {["normal", "forced_win", "forced_loss"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Expires at</Label>
              <Input
                className="mt-1"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => update("expiresAt", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={!form.name.trim() || !form.target.trim() || !form.seed.trim()}
                onClick={() =>
                  setPending({ ...form })
                }
              >
                Request scenario
              </Button>
            </div>
          </div>
          <div className="surface-1 rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Scenario history</h2>
              <span className="mono text-xs text-muted-foreground">
                {history.length} executions
              </span>
            </div>
            {history.length ? (
              <div className="flex flex-col gap-2">
                {history.map((s) => (
                  <div key={s.id} className="rounded-md border border-border/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{s.name}</span>
                      <StatusBadge tone={s.status === "executed" ? "success" : "warning"}>
                        {s.status ?? "requested"}
                      </StatusBadge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.scope} · {s.target} · seed <span className="mono">{s.seed}</span> ·{" "}
                      {s.result}
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      audit <span className="mono">{s.auditId}</span>
                    </div>
                    <JsonState value={s} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No scenarios executed"
                description="Executed mock scenarios remain visible here for this session."
              />
            )}
          </div>
          <ConsequentialActionDialog
            open={!!pending}
            onOpenChange={(o) => !o && setPending(null)}
            title="Request sandbox scenario"
            description="Exact parameters are shown before governance approval. This request cannot affect real users or production."
            target={pending?.target ?? ""}
            targetId={pending?.target ?? "sandbox"}
            action="sandbox.request"
            permission="sandbox.force"
            currentState="normal"
            proposedState={
              pending ? `${pending.mode} · seed ${pending.seed} · expires ${pending.expiresAt}` : ""
            }
            onConfirm={async (reason) => {
              if (!pending) return;
              const result = await provider.applySandboxOverride(
                {
                  scope: pending.scope,
                  target: pending.target,
                  mode: pending.mode,
                  seed: pending.seed,
                  expectedResult: pending.expectedResult,
                  expiresAt: new Date(pending.expiresAt).toISOString(),
                },
                {
                  actor: session.actorName,
                  role: session.roleId,
                  environment: session.environment,
                  reason,
                },
              );
              const completed = {
                ...pending,
                id: `${Date.now()}`,
                result: "Awaiting governance approval and sandbox execution",
                auditId: result.auditId,
                status: "requested" as const,
              };
              setHistory((items) => [completed, ...items]);
              receipt.record("sandbox.request", result);
              return result;
            }}
          />
        </>
      )}
    </GovernanceShell>
  );
}
function isoInput(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
