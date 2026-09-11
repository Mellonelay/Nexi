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
import type { LoanApplicationAdmin, LoanPlan } from "@/admin/types";

export const Route = createFileRoute("/loans")({ component: Page });
function Page() {
  return (
    <RouteGuard permission="loans.view">
      <Inner />
    </RouteGuard>
  );
}
function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const query = useAdminQuery((p) => p.listLoanPlans());
  const applicationsQuery = useAdminQuery((p) => p.listLoanApplications());
  const [editing, setEditing] = useState<LoanPlan | null>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState("30");
  const [rate, setRate] = useState("0.1");
  const [min, setMin] = useState("100");
  const [max, setMax] = useState("100000");
  const [message, setMessage] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const canEdit = session.can("loans.edit");
  if (query.loading) return <LoadingSkeleton rows={5} />;
  if (query.error)
    return <ErrorState title="Could not load loan plans" description={query.error.message} />;
  const ctx = {
    actor: session.actorName,
    role: session.roleId,
    environment: session.environment,
    reason: "Loan product administration",
  } as const;
  const reset = () => {
    setEditing(null);
    setName("");
    setMessage("");
  };
  const reviewApplication = async (
    application: LoanApplicationAdmin,
    decision: "approve" | "reject",
  ) => {
    if (!canEdit) return;
    setReviewingId(application.id);
    try {
      const result =
        decision === "approve"
          ? await provider.approveLoanApplication(application.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason: "Loan application approval",
            })
          : await provider.rejectLoanApplication(application.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason: "Loan application rejection",
            });
      setMessage(
        result.ok ? `Loan application ${decision}d.` : `Loan application was not ${decision}d.`,
      );
      applicationsQuery.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Loan application was not ${decision}d.`);
    } finally {
      setReviewingId(null);
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || !name.trim()) return;
    const payload = {
      name: name.trim(),
      durationDays: Number(days),
      interestRate: Number(rate),
      minAmount: Number(min),
      maxAmount: Number(max),
      isActive: editing?.isActive ?? true,
    };
    try {
      const result = editing
        ? await provider.updateLoanPlan(editing.id, payload, ctx)
        : await provider.createLoanPlan(payload, ctx);
      setMessage(result.ok ? "Loan plan saved." : "Loan plan was not saved.");
      query.refresh();
      reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Loan plan was not saved.");
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Loans"
        description="Administer loan products, terms, limits and lifecycle policy."
        badges={
          <>
            <ProviderBadge />
            <StatusBadge tone="info">Product control</StatusBadge>
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
                    {plan.durationDays} days · rate {plan.interestRate}
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
                      setDays(String(plan.durationDays));
                      setRate(String(plan.interestRate));
                      setMin(String(plan.minAmount));
                      setMax(String(plan.maxAmount));
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Limits: {plan.minAmount} – {plan.maxAmount}
              </p>
            </article>
          ))}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Loan applications</h2>
                <p className="text-xs text-muted-foreground">
                  Review backend loan requests before disbursement.
                </p>
              </div>
              <StatusBadge tone="info">Governed review</StatusBadge>
            </div>
            {applicationsQuery.loading && (
              <p className="mt-3 text-sm text-muted-foreground">Loading applications…</p>
            )}
            {applicationsQuery.error && (
              <p className="mt-3 text-sm text-destructive">{applicationsQuery.error.message}</p>
            )}
            {!applicationsQuery.loading &&
              !applicationsQuery.error &&
              (applicationsQuery.data ?? []).length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">No loan applications returned.</p>
              )}
            {(applicationsQuery.data ?? []).map((application) => (
              <div key={application.id} className="mt-3 border-t border-border pt-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{application.userEmail ?? application.userId}</p>
                    <p className="text-xs text-muted-foreground">
                      {application.amount} {application.currency} · {application.durationDays} days
                      · repay {application.totalRepayment}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Collateral: {application.collateral || "Not provided"}
                      {application.collateralImg ? ` · document ${application.collateralImg}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      application.status === "PENDING"
                        ? "warning"
                        : application.status === "ACTIVE" || application.status === "APPROVED"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {application.status}
                  </StatusBadge>
                </div>
                {application.status === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      disabled={!canEdit || reviewingId === application.id}
                      onClick={() => reviewApplication(application, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canEdit || reviewingId === application.id}
                      onClick={() => reviewApplication(application, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </section>
        </section>
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">{editing ? "Edit plan" : "Create plan"}</h2>
          <Input
            placeholder="Plan name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canEdit}
          />
          <Input
            placeholder="Duration days"
            value={days}
            onChange={(event) => setDays(event.target.value)}
            disabled={!canEdit}
          />
          <Input
            placeholder="Interest rate"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            disabled={!canEdit}
          />
          <Input
            placeholder="Minimum amount"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            disabled={!canEdit}
          />
          <Input
            placeholder="Maximum amount"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            disabled={!canEdit}
          />
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
