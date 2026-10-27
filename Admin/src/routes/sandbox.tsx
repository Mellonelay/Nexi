import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GovernanceShell, ReceiptBanner, JsonState } from "@/admin/components/GovernancePrimitives";
import { useReceipt } from "@/admin/components/governance-hooks";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { MaintenanceState, UnauthorizedState, EmptyState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
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
  commandId?: string;
  status?: "requested" | "approved" | "executed" | "rejected" | "expired";
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
  const approvalsQuery = useAdminQuery((p) => p.listApprovals());
  const [history, setHistory] = useState<Scenario[]>([]);
  const [pending, setPending] = useState<Scenario | null>(null);
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<Scenario>({
    id: "draft",
    name: "Binary test",
    scope: "binary",
    target: "",
    seed: "QA-001",
    duration: "15",
    expectedResult: "",
    mode: "normal",
    expiresAt: isoInput(30),
  });
  const update = <K extends keyof Scenario>(key: K, value: Scenario[K]) =>
    setForm((v) => ({ ...v, [key]: value }));

  const approvals = useMemo(() => approvalsQuery.data ?? [], [approvalsQuery.data]);
  const pendingCommandIds = useMemo(
    () =>
      new Set(
        history.filter((s) => s.status === "requested" && s.commandId).map((s) => s.commandId!),
      ),
    [history],
  );
  const hasPending = pendingCommandIds.size > 0;

  useEffect(() => {
    if (!hasPending) return;
    const id = window.setInterval(() => {
      approvalsQuery.refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [hasPending, approvalsQuery]);

  const getApprovalStatus = (commandId?: string) => {
    if (!commandId) return undefined;
    return approvals.find((a) => a.id === commandId)?.status;
  };

  const handleExecute = async (commandId: string) => {
    setExecuting((current) => ({ ...current, [commandId]: true }));
    try {
      const result = await provider.executeSandboxCommand(commandId, {
        actor: session.actorName,
        role: session.roleId,
        environment: session.environment,
        reason: "Execute approved sandbox scenario",
      });
      setHistory((items) =>
        items.map((item) =>
          item.commandId === commandId
            ? {
                ...item,
                status: "executed" as const,
                result: result.auditId ? `Executed (audit ${result.auditId})` : "Executed",
              }
            : item,
        ),
      );
      receipt.record("sandbox.execute", result);
    } finally {
      setExecuting((current) => {
        const next = { ...current };
        delete next[commandId];
        return next;
      });
    }
  };

  return (
    <GovernanceShell
      title="Sandbox Scenario Testing"
      description="Run approved test scenarios in the isolated sandbox environment."
    >
      <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        Test accounts only. All actions are recorded. Real customer trades cannot be changed.
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>Test controls</span>
        <Button
          type="button"
          variant="outline"
          onClick={() => session.setEnvironment("SANDBOX")}
          disabled={session.environment === "SANDBOX"}
        >
          {session.environment === "SANDBOX" ? "Test mode ready" : "Open test controls"}
        </Button>
      </div>
      {session.environment !== "SANDBOX" ? (
        <MaintenanceState description="Select Open test controls to use approved test accounts." />
      ) : !session.can("sandbox.force") ? (
        <UnauthorizedState requiredPermission="sandbox.force" />
      ) : (
        <>
          <ReceiptBanner receipt={receipt.receipt} onDismiss={receipt.clear} />
          <div className="surface-1 grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>Test name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Label>Test type</Label>
              <span className="flex h-9 items-center text-muted-foreground">Binary</span>
            </div>
            <div>
              <Label>Test account</Label>
              <Input
                placeholder="Approved Binary test account ID"
                className="mt-1"
                value={form.target}
                onChange={(e) => update("target", e.target.value)}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                className="mt-1"
                type="number"
                min="1"
                step="1"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
            </div>
            <details className="rounded-md border border-border/60 p-3 md:col-span-3">
              <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
              <div className="mt-3 max-w-sm">
                <Label htmlFor="sandbox-seed">Deterministic seed</Label>
                <Input
                  id="sandbox-seed"
                  className="mt-1"
                  value={form.seed}
                  onChange={(e) => update("seed", e.target.value)}
                />
              </div>
            </details>
            <div>
              <Label>Test result</Label>
              <select
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.mode}
                aria-label="Test result"
                onChange={(e) => update("mode", e.target.value as Scenario["mode"])}
              >
                {["forced_win", "forced_loss", "normal"].map((m) => (
                  <option key={m} value={m}>
                    {m === "forced_win" ? "Win" : m === "forced_loss" ? "Loss" : "Normal"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={
                  !form.name.trim() ||
                  !form.target.trim() ||
                  !form.seed.trim() ||
                  !Number.isInteger(Number(form.duration)) ||
                  Number(form.duration) < 1
                }
                onClick={() =>
                  setPending({
                    ...form,
                    scope: "binary",
                    expiresAt: isoInput(Number(form.duration)),
                  })
                }
              >
                Create test
              </Button>
            </div>
          </div>
          <div className="surface-1 rounded-lg border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Scenario history</h2>
              <span className="mono text-xs text-muted-foreground">
                {history.length} execution{history.length === 1 ? "" : "s"}
              </span>
            </div>
            {history.length ? (
              <div className="flex flex-col gap-2">
                {history.map((s) => {
                  const approvalStatus = getApprovalStatus(s.commandId);
                  const canExecute = s.status === "requested" && approvalStatus === "approved";
                  const isExecuting = executing[s.commandId ?? ""];
                  return (
                    <div key={s.id} className="rounded-md border border-border/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{s.name}</span>
                        <div className="flex items-center gap-2">
                          {canExecute && (
                            <Button
                              size="sm"
                              disabled={isExecuting}
                              onClick={() => s.commandId && handleExecute(s.commandId)}
                            >
                              {isExecuting ? "Executing…" : "Execute"}
                            </Button>
                          )}
                          <StatusBadge
                            tone={
                              s.status === "executed"
                                ? "success"
                                : approvalStatus === "rejected"
                                  ? "destructive"
                                  : approvalStatus === "approved"
                                    ? "success"
                                    : "warning"
                            }
                          >
                            {s.status === "executed"
                              ? "executed"
                              : approvalStatus === "rejected"
                                ? "rejected"
                                : approvalStatus === "approved"
                                  ? "approved"
                                  : (s.status ?? "requested")}
                          </StatusBadge>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.scope} · {s.target} · seed <span className="mono">{s.seed}</span> ·{" "}
                        {s.result}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        audit <span className="mono">{s.auditId}</span>
                        {s.commandId ? ` · command ${s.commandId}` : ""}
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[10px] text-muted-foreground">
                          Technical audit details
                        </summary>
                        <JsonState value={s} />
                      </details>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No scenarios executed"
                description="Executed scenarios remain visible here for this session."
              />
            )}
          </div>
          <ConsequentialActionDialog
            open={!!pending}
            onOpenChange={(o) => !o && setPending(null)}
            title="Create Binary test"
            description="This request is recorded and remains subject to server-side approval and test-account restrictions."
            target={pending?.target ?? ""}
            targetId={pending?.target ?? "sandbox"}
            action="sandbox.request"
            permission="sandbox.force"
            currentState="normal"
            proposedState={
              pending
                ? `${labelMode(pending.mode)} · ${pending.duration} minutes · test account ${pending.target}`
                : ""
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
              const completed: Scenario = {
                ...pending,
                id: `${Date.now()}`,
                commandId: result.auditId,
                result: "Awaiting governance approval and sandbox execution",
                auditId: result.auditId,
                status: "requested",
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
function labelMode(mode: Scenario["mode"]) {
  return mode === "forced_win" ? "Win" : mode === "forced_loss" ? "Loss" : "Normal";
}

function isoInput(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
