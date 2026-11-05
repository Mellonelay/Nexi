import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MiningPlan } from "@/admin/types";

export const Route = createFileRoute("/mining")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="mining.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const query = useAdminQuery((p) => p.listMiningPlans());
  const subscriptionsQuery = useAdminQuery((p) => p.listMiningSubscriptions());
  const [editing, setEditing] = useState<MiningPlan | null>(null);
  const [name, setName] = useState("");
  const [dailyYield, setDailyYield] = useState("0.001");
  const [lockupPeriod, setLockupPeriod] = useState("30");
  const [minDeposit, setMinDeposit] = useState("100");
  const [maxDeposit, setMaxDeposit] = useState("100000");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState("");
  const canEdit = session.can("mining.edit");
  if (query.loading) return <LoadingSkeleton rows={5} />;
  if (query.error)
    return <ErrorState title="Could not load mining plans" description={query.error.message} />;
  const ctx = {
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason: "Mining product administration",
  } as const;
  const reset = () => {
    setEditing(null);
    setName("");
    setIsActive(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !canEdit ||
      !name.trim() ||
      !Number.isInteger(Number(lockupPeriod)) ||
      Number(lockupPeriod) < 1 ||
      !Number.isFinite(Number(dailyYield)) ||
      Number(dailyYield) < 0 ||
      !Number.isFinite(Number(minDeposit)) ||
      Number(minDeposit) < 0 ||
      !Number.isFinite(Number(maxDeposit)) ||
      Number(maxDeposit) < Number(minDeposit)
    ) {
      setMessage("Enter a valid plan name, duration, payout and deposit limits.");
      return;
    }
    const payload = {
      name: name.trim(),
      currency: editing?.currency ?? "USDT",
      dailyYield,
      lockupPeriod: Number(lockupPeriod),
      minDeposit,
      maxDeposit,
      isActive,
    };
    try {
      const result = editing
        ? await provider.updateMiningPlan(editing.id, payload, ctx)
        : await provider.createMiningPlan(payload, ctx);
      if (result.ok) {
        reset();
        query.refresh();
        setMessage("Mining plan saved.");
      } else {
        setMessage("Mining plan was not saved.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mining plan was not saved.");
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mining"
        description="Administer backend-defined mining products, lock terms, yield and limits."
        badges={
          <>
            <ProviderBadge />
            <StatusBadge tone="info">Ledger-backed product control</StatusBadge>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {(query.data ?? []).map((plan) => (
            <article key={plan.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {plan.currency} · {plan.lockupPeriod} days · daily {plan.dailyYield}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={plan.isActive ? "success" : "neutral"}>
                    {plan.isActive ? "active" : "disabled"}
                  </StatusBadge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditing(plan);
                      setName(plan.name);
                      setDailyYield(plan.dailyYield);
                      setLockupPeriod(String(plan.lockupPeriod));
                      setMinDeposit(plan.minDeposit);
                      setMaxDeposit(plan.maxDeposit);
                      setIsActive(plan.isActive);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Limits: {plan.minDeposit} – {plan.maxDeposit}
              </p>
            </article>
          ))}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Subscriptions and rewards</h2>
            {subscriptionsQuery.data?.length ? (
              subscriptionsQuery.data.map((row) => (
                <div
                  key={row.id}
                  className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm"
                >
                  <span>
                    {row.userEmail ?? row.userId} · {row.planName ?? "plan"}
                  </span>
                  <span className="font-mono">
                    {row.amount} {row.currency} · rewards {row.totalRewards}
                  </span>
                  <StatusBadge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
                    {row.status}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No subscription records returned.
              </p>
            )}
          </div>
        </section>
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">{editing ? "Edit plan" : "Create plan"}</h2>
          <label htmlFor="mining-plan-name" className="text-xs font-medium">
            Plan name
          </label>
          <Input
            id="mining-plan-name"
            placeholder="Plan name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEdit}
          />
          <label htmlFor="mining-daily-payout" className="text-xs font-medium">
            Daily payout rate (decimal)
          </label>
          <Input
            id="mining-daily-payout"
            placeholder="Daily yield"
            value={dailyYield}
            onChange={(event) => setDailyYield(event.target.value)}
            disabled={!canEdit}
          />
          <label htmlFor="mining-plan-duration" className="text-xs font-medium">
            Plan duration (days)
          </label>
          <Input
            id="mining-plan-duration"
            placeholder="Lockup days"
            value={lockupPeriod}
            onChange={(event) => setLockupPeriod(event.target.value)}
            disabled={!canEdit}
          />
          <label htmlFor="mining-minimum-deposit" className="text-xs font-medium">
            Minimum deposit
          </label>
          <Input
            id="mining-minimum-deposit"
            placeholder="Minimum deposit"
            value={minDeposit}
            onChange={(event) => setMinDeposit(event.target.value)}
            disabled={!canEdit}
          />
          <label htmlFor="mining-maximum-deposit" className="text-xs font-medium">
            Maximum deposit
          </label>
          <Input
            id="mining-maximum-deposit"
            placeholder="Maximum deposit"
            value={maxDeposit}
            onChange={(event) => setMaxDeposit(event.target.value)}
            disabled={!canEdit}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={!canEdit}
            />
            Plan enabled
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={!canEdit}>
              {editing ? "Save changes" : "Create plan"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            )}
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </div>
    </div>
  );
}
