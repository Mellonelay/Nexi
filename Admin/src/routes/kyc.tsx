import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { FormDrawer } from "@/admin/components/FormDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { KycReview, KycStatus, User, AdminUser } from "@/admin/types";
import { ShieldCheck, ShieldX, MessageSquareWarning, UserCog } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/kyc")({ component: Page });

type PendingKycAction = {
  review: KycReview;
  decision: Exclude<KycStatus, "unverified" | "pending">;
};

function Page() {
  return (
    <RouteGuard permission="kyc.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const kycQ = useAdminQuery((p) => p.listKyc());
  const usersQ = useAdminQuery((p) => p.listUsers());
  const adminsQ = useAdminQuery((p) => p.listAdmins());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<KycReview | null>(null);
  const [notesFor, setNotesFor] = useState<KycReview | null>(null);
  const [pending, setPending] = useState<PendingKycAction | null>(null);
  const [evidenceBusy, setEvidenceBusy] = useState<"front" | "back" | null>(null);

  const kyc = useMemo(() => kycQ.data ?? [], [kycQ.data]);
  const users = usersQ.data ?? [];
  const admins = adminsQ.data ?? [];

  const selected = useMemo(
    () => (selectedId ? (kyc.find((k) => k.id === selectedId) ?? null) : null),
    [kyc, selectedId],
  );

  if (kycQ.loading)
    return (
      <PageShell>
        <LoadingSkeleton rows={6} />
      </PageShell>
    );
  if (kycQ.error)
    return (
      <PageShell>
        <ErrorState title="Could not load KYC reviews" description={kycQ.error.message} />
      </PageShell>
    );

  const canDecide = session.can("kyc.decide");
  const canAssignReviewer =
    canDecide && provider.supports?.("assignKycReviewer") !== false;
  const canUpdateNotes = canDecide && provider.supports?.("updateKycNotes") !== false;

  const userFor = (id: string): User | undefined => users.find((u) => u.id === id);

  const downloadEvidence = async (review: KycReview, side: "front" | "back") => {
    if (!provider.getKycEvidence) {
      toast.error("Private KYC evidence access is unavailable.");
      return;
    }
    setEvidenceBusy(side);
    try {
      const blob = await provider.getKycEvidence(review.userId, side);
      const extension = blob.type === "application/pdf" ? ".pdf"
        : blob.type === "image/png" ? ".png"
        : blob.type === "image/webp" ? ".webp"
        : ".jpg";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `kyc-${side}-${review.id}${extension}`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error(`KYC ${side} document could not be retrieved.`);
    } finally {
      setEvidenceBusy(null);
    }
  };

  const columns: DataTableColumn<KycReview>[] = [
    {
      key: "id",
      header: "Review",
      sortValue: (r) => r.id,
      cell: (r) => <span className="mono text-xs text-muted-foreground">{r.id}</span>,
    },
    {
      key: "user",
      header: "User",
      sortValue: (r) => (userFor(r.userId)?.displayName ?? r.userId).toLowerCase(),
      cell: (r) => {
        const u = userFor(r.userId);
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{u?.displayName ?? "Unknown"}</span>
            <span className="mono text-xs text-muted-foreground">{r.userId}</span>
          </div>
        );
      },
    },
    {
      key: "doc",
      header: "Document",
      sortValue: (r) => r.documentType,
      cell: (r) => <span className="mono text-xs">{r.documentType.replace("_", " ")}</span>,
    },
    {
      key: "country",
      header: "Country",
      sortValue: (r) => r.country,
      cell: (r) => <span className="mono text-xs">{r.country}</span>,
    },
    {
      key: "submitted",
      header: "Submitted",
      sortValue: (r) => r.submittedAt,
      cell: (r) => (
        <span className="mono text-[11px] text-muted-foreground">{formatDate(r.submittedAt)}</span>
      ),
    },
    {
      key: "reviewer",
      header: "Reviewer",
      sortValue: (r) => r.reviewer ?? "",
      cell: (r) =>
        r.reviewer ? (
          <span className="text-sm">{r.reviewer}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">unassigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge tone={kycTone(r.status)}>{r.status}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<KycReview>[] = [
    {
      key: "status",
      label: "status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "more_info", label: "More info" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
      match: (r, v) => r.status === v,
    },
    {
      key: "doc",
      label: "document",
      options: [
        { value: "passport", label: "Passport" },
        { value: "id_card", label: "ID card" },
        { value: "drivers_license", label: "Driver's license" },
      ],
      match: (r, v) => r.documentType === v,
    },
    {
      key: "assignment",
      label: "assignment",
      options: [
        { value: "assigned", label: "Assigned" },
        { value: "unassigned", label: "Unassigned" },
      ],
      match: (r, v) => (v === "assigned" ? !!r.reviewer : !r.reviewer),
    },
  ];

  const pendingCount = kyc.filter((r) => r.status === "pending").length;
  const moreInfoCount = kyc.filter((r) => r.status === "more_info").length;

  return (
    <PageShell pendingCount={pendingCount} moreInfoCount={moreInfoCount} total={kyc.length}>
      <DataTable
        data={kyc}
        columns={columns}
        filters={filters}
        searchable={(r) =>
          `${r.id} ${r.userId} ${userFor(r.userId)?.displayName ?? ""} ${userFor(r.userId)?.email ?? ""} ${r.country}`
        }
        searchPlaceholder="Search review, user, email…"
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        rowActions={(r) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`kyc-inspect-${r.id}`}
            onClick={() => setSelectedId(r.id)}
          >
            Review
          </Button>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={
          selected ? (
            <span>
              KYC review <span className="mono text-primary">{selected.id}</span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={
          selected
            ? `${userFor(selected.userId)?.displayName ?? selected.userId} · ${selected.country} · ${selected.documentType}`
            : undefined
        }
        badges={
          selected ? (
            <>
              <StatusBadge tone={kycTone(selected.status)}>{selected.status}</StatusBadge>
              {selected.reviewer ? (
                <StatusBadge tone="info" dot={false}>
                  Assigned
                </StatusBadge>
              ) : (
                <StatusBadge tone="warning" dot={false}>
                  Unassigned
                </StatusBadge>
              )}
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "review",
                  title: "Review",
                  fields: [
                    { label: "Review ID", value: selected.id, mono: true },
                    { label: "Submitted", value: formatDate(selected.submittedAt), mono: true },
                    { label: "Document", value: selected.documentType.replace("_", " ") },
                    { label: "Country", value: selected.country, mono: true },
                    { label: "Reviewer", value: selected.reviewer ?? "—" },
                    {
                      label: "Status",
                      value: (
                        <StatusBadge tone={kycTone(selected.status)}>{selected.status}</StatusBadge>
                      ),
                    },
                  ],
                },
                {
                  id: "evidence",
                  title: "Identity documents",
                  content: (
                    <div className="flex flex-wrap gap-2">
                      {(["front", "back"] as const).map((side) => (
                        <Button
                          key={side}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!provider.getKycEvidence || evidenceBusy !== null}
                          onClick={() => void downloadEvidence(selected, side)}
                        >
                          {evidenceBusy === side ? "Retrieving…" : `Download ${side}`}
                        </Button>
                      ))}
                      {!provider.getKycEvidence ? (
                        <p className="w-full text-xs text-muted-foreground">
                          Private evidence access is not configured for this provider.
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  id: "user",
                  title: "Applicant",
                  fields: userFor(selected.userId)
                    ? [
                        { label: "Name", value: userFor(selected.userId)!.displayName },
                        { label: "Email", value: userFor(selected.userId)!.email },
                        { label: "Tier", value: userFor(selected.userId)!.tier, mono: true },
                        { label: "Account status", value: userFor(selected.userId)!.status },
                        { label: "User ID", value: userFor(selected.userId)!.id, mono: true },
                      ]
                    : [{ label: "User", value: selected.userId, mono: true }],
                },
                {
                  id: "notes",
                  title: "Reviewer notes",
                  content: (
                    <div className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">
                      {selected.notes ? (
                        <p className="whitespace-pre-wrap text-foreground/90">{selected.notes}</p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">No notes yet.</p>
                      )}
                    </div>
                  ),
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={30} />,
                },
              ]
            : []
        }
        actions={
          selected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                data-testid="kyc-assign"
                disabled={!canAssignReviewer}
                onClick={() => setAssignFor(selected)}
              >
                <UserCog className="mr-1 h-3.5 w-3.5" />
                {selected.reviewer ? "Reassign" : "Assign"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="kyc-notes"
                disabled={!canUpdateNotes}
                onClick={() => setNotesFor(selected)}
              >
                <MessageSquareWarning className="mr-1 h-3.5 w-3.5" />
                Edit notes
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="kyc-more-info"
                disabled={!canDecide || selected.status === "more_info"}
                onClick={() => setPending({ review: selected, decision: "more_info" })}
              >
                Request more info
              </Button>
              <Button
                variant="destructive"
                size="sm"
                data-testid="kyc-reject"
                disabled={!canDecide || selected.status === "rejected"}
                onClick={() => setPending({ review: selected, decision: "rejected" })}
              >
                <ShieldX className="mr-1 h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                data-testid="kyc-approve"
                disabled={!canDecide || selected.status === "approved"}
                onClick={() => setPending({ review: selected, decision: "approved" })}
              >
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Approve
              </Button>
            </>
          ) : null
        }
      />

      <AssignReviewerForm
        review={assignFor}
        admins={admins}
        onClose={() => setAssignFor(null)}
        onSubmit={async (reviewer, reason) => {
          if (!assignFor) return;
          const res = await provider.assignKycReviewer(assignFor.id, reviewer, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
          if (res.ok) toast.success("Reviewer assigned", { description: reviewer });
          else toast.error("Assignment failed");
        }}
      />

      <NotesForm
        review={notesFor}
        onClose={() => setNotesFor(null)}
        onSubmit={async (notes, reason) => {
          if (!notesFor) return;
          const res = await provider.updateKycNotes(notesFor.id, notes, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
          if (res.ok) toast.success("Notes updated");
          else toast.error("Update failed");
        }}
      />

      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={
            pending.decision === "approved"
              ? "Approve KYC"
              : pending.decision === "rejected"
                ? "Reject KYC"
                : "Request more information"
          }
          description={
            pending.decision === "approved"
              ? "Grants the user their approved tier and unlocks entitlements."
              : pending.decision === "rejected"
                ? "Denies the submission; user must resubmit new documents."
                : "Ask the applicant to supply additional documents or a new selfie."
          }
          target={
            <span>
              Review {pending.review.id} —{" "}
              {userFor(pending.review.userId)?.displayName ?? pending.review.userId}
            </span>
          }
          targetId={pending.review.id}
          action={`kyc.decide:${pending.decision}`}
          permission="kyc.decide"
          currentState={
            <StatusBadge tone={kycTone(pending.review.status)}>{pending.review.status}</StatusBadge>
          }
          proposedState={
            <StatusBadge tone={kycTone(pending.decision)}>{pending.decision}</StatusBadge>
          }
          destructive={pending.decision === "rejected"}
          submitLabel={
            pending.decision === "approved"
              ? "Approve"
              : pending.decision === "rejected"
                ? "Reject"
                : "Request more info"
          }
          successMessage="KYC decision recorded"
          onConfirm={(reason) =>
            provider.decideKyc(pending.review.id, pending.decision, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}
    </PageShell>
  );
}

function PageShell({
  children,
  total,
  pendingCount,
  moreInfoCount,
}: {
  children: React.ReactNode;
  total?: number;
  pendingCount?: number;
  moreInfoCount?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="KYC Reviews"
        description="Approve, reject, or request more information on identity verifications."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} total
              </StatusBadge>
            ) : null}
            {pendingCount ? (
              <StatusBadge tone="info" dot={false}>
                {pendingCount} pending
              </StatusBadge>
            ) : null}
            {moreInfoCount ? (
              <StatusBadge tone="warning" dot={false}>
                {moreInfoCount} more info
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function AssignReviewerForm({
  review,
  admins,
  onClose,
  onSubmit,
}: {
  review: KycReview | null;
  admins: AdminUser[];
  onClose: () => void;
  onSubmit: (reviewer: string, reason: string) => Promise<void>;
}) {
  const [reviewer, setReviewer] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (review) {
      setReviewer(review.reviewer ?? "");
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id]);

  const reviewers = admins.filter((a) => a.role === "kyc_reviewer" || a.role === "super_admin");
  const changed = review
    ? reviewer.trim() !== (review.reviewer ?? "") && reviewer.trim().length > 0
    : false;
  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!review}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={review ? `Assign reviewer — ${review.id}` : ""}
      description="Assign a reviewer. Existing decisions are unaffected."
      submitLabel="Assign"
      submitDisabled={!changed || !reasonOk}
      onSubmit={async () => {
        await onSubmit(reviewer.trim(), reason.trim());
        onClose();
      }}
      testId="assign-reviewer-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reviewer-select" className="text-xs">
          Reviewer
        </Label>
        <select
          id="reviewer-select"
          data-testid="reviewer-select"
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="">— select reviewer —</option>
          {reviewers.map((a) => (
            <option key={a.id} value={a.displayName}>
              {a.displayName} ({a.role})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-reason" className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          id="assign-reason"
          data-testid="assign-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Rebalancing workload, language match, tier requirement…"
        />
      </div>
    </FormDrawer>
  );
}

function NotesForm({
  review,
  onClose,
  onSubmit,
}: {
  review: KycReview | null;
  onClose: () => void;
  onSubmit: (notes: string, reason: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (review) {
      setNotes(review.notes ?? "");
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review?.id]);

  const changed = review ? notes !== (review.notes ?? "") : false;
  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!review}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={review ? `Reviewer notes — ${review.id}` : ""}
      description="Notes are visible to KYC reviewers and appear on the audit trail."
      submitLabel="Save notes"
      submitDisabled={!changed || !reasonOk}
      onSubmit={async () => {
        await onSubmit(notes, reason.trim());
        onClose();
      }}
      testId="kyc-notes-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="kyc-notes" className="text-xs">
          Notes
        </Label>
        <textarea
          id="kyc-notes"
          data-testid="kyc-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Document quality, discrepancies, next steps…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes-reason" className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          id="notes-reason"
          data-testid="notes-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Short justification for the note update."
        />
      </div>
    </FormDrawer>
  );
}

function kycTone(k: string) {
  switch (k) {
    case "approved":
      return "success" as const;
    case "pending":
      return "info" as const;
    case "more_info":
      return "warning" as const;
    case "rejected":
      return "destructive" as const;
    default:
      return "neutral" as const;
  }
}
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
