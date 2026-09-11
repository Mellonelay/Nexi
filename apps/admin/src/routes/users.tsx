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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  USER_RESTRICTION_TAGS,
  type User,
  type UserRestrictionTag,
  type UserStatus,
} from "@/admin/types";
import {
  Ban,
  ShieldCheck,
  ShieldOff,
  FlaskConical,
  KeyRound,
  LogOut,
  UserRound,
} from "lucide-react";

export const Route = createFileRoute("/users")({ component: Page });

type PendingStatusAction = {
  kind: "status";
  user: User;
  status: UserStatus;
};
type PendingSandboxAction = { kind: "sandbox"; user: User; sandbox: boolean };
type PendingRevokeAllAction = { kind: "revoke-all"; user: User; activeSessions: number };
type PendingAction = PendingStatusAction | PendingSandboxAction | PendingRevokeAllAction;

function Page() {
  return (
    <RouteGuard permission="users.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const usersQ = useAdminQuery((p) => p.listUsers());
  const sessionsQ = useAdminQuery((p) => p.listSessions());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entitlementUser, setEntitlementUser] = useState<User | null>(null);
  const [restrictionUser, setRestrictionUser] = useState<User | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const users = useMemo(() => usersQ.data ?? [], [usersQ.data]);
  const sessions = useMemo(() => sessionsQ.data ?? [], [sessionsQ.data]);

  const selected = useMemo(
    () => (selectedId ? (users.find((u) => u.id === selectedId) ?? null) : null),
    [users, selectedId],
  );

  if (usersQ.loading)
    return (
      <PageShell>
        <LoadingSkeleton rows={6} />
      </PageShell>
    );
  if (usersQ.error)
    return (
      <PageShell>
        <ErrorState title="Could not load users" description={usersQ.error.message} />
      </PageShell>
    );

  const activeSessionsFor = (userId: string) =>
    sessions.filter((s) => s.userId === userId && s.active).length;

  const canRestrict = session.can("users.restrict");
  const canEntitlements = session.can("users.entitlements");
  const canRevoke = session.can("sessions.revoke");
  const canSetStatus = canRestrict && provider.supports?.("setUserStatus") !== false;
  const canUpdateEntitlements =
    canEntitlements && provider.supports?.("updateUserEntitlements") !== false;
  const canUpdateRestrictions =
    canRestrict && provider.supports?.("updateUserRestrictions") !== false;
  const canSetSandbox = canEntitlements && provider.supports?.("setUserSandbox") !== false;

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (u) => u.displayName.toLowerCase(),
      cell: (u) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground">{u.displayName}</span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
        </div>
      ),
    },
    {
      key: "id",
      header: "User ID",
      sortValue: (u) => u.id,
      cell: (u) => <span className="mono text-xs text-muted-foreground">{u.id}</span>,
    },
    {
      key: "country",
      header: "Country",
      sortValue: (u) => u.country,
      cell: (u) => <span className="mono text-xs">{u.country}</span>,
    },
    {
      key: "tier",
      header: "Tier",
      sortValue: (u) => u.tier,
      cell: (u) => <span className="mono text-xs">{u.tier}</span>,
    },
    {
      key: "kyc",
      header: "KYC",
      sortValue: (u) => u.kyc,
      cell: (u) => <StatusBadge tone={kycTone(u.kyc)}>{u.kyc}</StatusBadge>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (u) => u.status,
      cell: (u) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={statusTone(u.status)}>{u.status}</StatusBadge>
          {u.sandbox ? (
            <StatusBadge tone="warning" dot={false}>
              SBX
            </StatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      key: "sessions",
      header: "Active",
      align: "right",
      sortValue: (u) => activeSessionsFor(u.id),
      cell: (u) => <span className="mono text-xs">{activeSessionsFor(u.id)}</span>,
    },
    {
      key: "lastLogin",
      header: "Last login",
      sortValue: (u) => u.lastLoginAt,
      cell: (u) => (
        <span className="mono text-[11px] text-muted-foreground">{formatDate(u.lastLoginAt)}</span>
      ),
    },
  ];

  const filters: DataTableFilter<User>[] = [
    {
      key: "status",
      label: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "restricted", label: "Restricted" },
        { value: "frozen", label: "Frozen" },
        { value: "closed", label: "Closed" },
      ],
      match: (u, v) => u.status === v,
    },
    {
      key: "kyc",
      label: "KYC",
      options: [
        { value: "unverified", label: "Unverified" },
        { value: "pending", label: "Pending" },
        { value: "more_info", label: "More info" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
      match: (u, v) => u.kyc === v,
    },
    {
      key: "tier",
      label: "tier",
      options: [
        { value: "T0", label: "T0" },
        { value: "T1", label: "T1" },
        { value: "T2", label: "T2" },
        { value: "T3", label: "T3" },
      ],
      match: (u, v) => u.tier === v,
    },
  ];

  const restrictedCount = users.filter((u) => u.status !== "active").length;
  const sandboxCount = users.filter((u) => u.sandbox).length;

  return (
    <PageShell restrictedCount={restrictedCount} sandboxCount={sandboxCount} total={users.length}>
      <DataTable
        data={users}
        columns={columns}
        filters={filters}
        searchable={(u) => `${u.displayName} ${u.email} ${u.id} ${u.country}`}
        searchPlaceholder="Search name, email, ID, country…"
        rowKey={(u) => u.id}
        onRowClick={(u) => setSelectedId(u.id)}
        rowActions={(u) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`user-inspect-${u.id}`}
            onClick={() => setSelectedId(u.id)}
          >
            Inspect
          </Button>
        )}
      />

      {/* User Detail Drawer */}
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={
          selected ? (
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              {selected.displayName}
            </span>
          ) : (
            ""
          )
        }
        subtitle={selected ? `${selected.email} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <>
              <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
              <StatusBadge tone={kycTone(selected.kyc)}>KYC {selected.kyc}</StatusBadge>
              {selected.sandbox ? <StatusBadge tone="warning">Sandbox user</StatusBadge> : null}
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "profile",
                  title: "Profile",
                  fields: [
                    { label: "Display name", value: selected.displayName },
                    { label: "Email", value: selected.email },
                    { label: "Country", value: selected.country, mono: true },
                    { label: "Tier", value: selected.tier, mono: true },
                    { label: "Created", value: formatDate(selected.createdAt), mono: true },
                    { label: "Last login", value: formatDate(selected.lastLoginAt), mono: true },
                  ],
                },
                {
                  id: "entitlements",
                  title: "Entitlements & flags",
                  fields: [
                    { label: "Spot", value: <BoolPill on={selected.entitlements.spot} /> },
                    { label: "Binary", value: <BoolPill on={selected.entitlements.binary} /> },
                    { label: "Mining", value: <BoolPill on={selected.entitlements.mining} /> },
                    { label: "Loans", value: <BoolPill on={selected.entitlements.loans} /> },
                    { label: "Sandbox user", value: <BoolPill on={!!selected.sandbox} /> },
                    {
                      label: "Active sessions",
                      value: <span className="mono">{activeSessionsFor(selected.id)}</span>,
                    },
                  ],
                },
                {
                  id: "restrictions",
                  title: "Restrictions",
                  content:
                    selected.restrictions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No restrictions applied.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selected.restrictions.map((r) => (
                          <StatusBadge key={r} tone="warning">
                            {r}
                          </StatusBadge>
                        ))}
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
                data-testid="user-detail-entitlements"
                disabled={!canUpdateEntitlements}
                onClick={() => {
                  setEntitlementUser(selected);
                }}
              >
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                Entitlements
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="user-detail-restrictions"
                disabled={!canUpdateRestrictions}
                onClick={() => {
                  setRestrictionUser(selected);
                }}
              >
                <ShieldOff className="mr-1 h-3.5 w-3.5" />
                Restrictions
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="user-detail-sandbox"
                disabled={!canSetSandbox}
                onClick={() =>
                  setPending({ kind: "sandbox", user: selected, sandbox: !selected.sandbox })
                }
              >
                <FlaskConical className="mr-1 h-3.5 w-3.5" />
                {selected.sandbox ? "Unmark sandbox" : "Mark sandbox"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="user-detail-revoke-sessions"
                disabled={!canRevoke || activeSessionsFor(selected.id) === 0}
                onClick={() =>
                  setPending({
                    kind: "revoke-all",
                    user: selected,
                    activeSessions: activeSessionsFor(selected.id),
                  })
                }
              >
                <LogOut className="mr-1 h-3.5 w-3.5" />
                Revoke sessions
              </Button>
              {selected.status === "active" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="user-detail-restrict"
                    disabled={!canSetStatus}
                    onClick={() =>
                      setPending({ kind: "status", user: selected, status: "restricted" })
                    }
                  >
                    <ShieldOff className="mr-1 h-3.5 w-3.5" />
                    Restrict
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    data-testid="user-detail-suspend"
                    disabled={!canSetStatus}
                    onClick={() => setPending({ kind: "status", user: selected, status: "frozen" })}
                  >
                    <Ban className="mr-1 h-3.5 w-3.5" />
                    Suspend
                  </Button>
                </>
              ) : selected.status === "closed" ? (
                <span className="text-xs text-muted-foreground">
                  Account closed — no state transitions.
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  data-testid="user-detail-reactivate"
                  disabled={!canSetStatus}
                  onClick={() => setPending({ kind: "status", user: selected, status: "active" })}
                >
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Reactivate
                </Button>
              )}
            </>
          ) : null
        }
      />

      {/* Entitlements FormDrawer */}
      <EntitlementsForm
        user={entitlementUser}
        onClose={() => setEntitlementUser(null)}
        onSubmit={async (next, reason) => {
          if (!entitlementUser) return;
          await provider.updateUserEntitlements(entitlementUser.id, next, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {/* Restrictions FormDrawer */}
      <RestrictionsForm
        user={restrictionUser}
        onClose={() => setRestrictionUser(null)}
        onSubmit={async (next, reason) => {
          if (!restrictionUser) return;
          await provider.updateUserRestrictions(restrictionUser.id, next, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {/* Consequential dialogs */}
      {pending?.kind === "status" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={
            pending.status === "active"
              ? "Reactivate user"
              : pending.status === "restricted"
                ? "Restrict user"
                : "Suspend user"
          }
          description="Applies to the selected user. State change is audited immediately."
          target={
            <span>
              {pending.user.displayName}{" "}
              <span className="text-muted-foreground">({pending.user.email})</span>
            </span>
          }
          targetId={pending.user.id}
          action={`users.set_status:${pending.status}`}
          permission="users.restrict"
          currentState={
            <StatusBadge tone={statusTone(pending.user.status)}>{pending.user.status}</StatusBadge>
          }
          proposedState={
            <StatusBadge tone={statusTone(pending.status)}>{pending.status}</StatusBadge>
          }
          destructive={pending.status !== "active"}
          submitLabel={
            pending.status === "active"
              ? "Reactivate"
              : pending.status === "restricted"
                ? "Restrict"
                : "Suspend"
          }
          successMessage="User status updated"
          onConfirm={async (reason) => {
            return provider.setUserStatus(pending.user.id, pending.status, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            });
          }}
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "sandbox" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={pending.sandbox ? "Mark as sandbox user" : "Remove sandbox flag"}
          description="Sandbox users are excluded from production flows and reporting."
          target={<span>{pending.user.displayName}</span>}
          targetId={pending.user.id}
          action={pending.sandbox ? "users.mark_sandbox" : "users.unmark_sandbox"}
          permission="users.entitlements"
          currentState={
            <StatusBadge tone={pending.user.sandbox ? "warning" : "neutral"}>
              {pending.user.sandbox ? "sandbox" : "regular"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pending.sandbox ? "warning" : "neutral"}>
              {pending.sandbox ? "sandbox" : "regular"}
            </StatusBadge>
          }
          submitLabel={pending.sandbox ? "Mark sandbox" : "Remove flag"}
          successMessage="Sandbox flag updated"
          onConfirm={(reason) =>
            provider.setUserSandbox(pending.user.id, pending.sandbox, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "revoke-all" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Revoke all active sessions"
          description="Immediately signs the user out of every active device and browser."
          target={<span>{pending.user.displayName}</span>}
          targetId={pending.user.id}
          action="sessions.revoke_all"
          permission="sessions.revoke"
          currentState={<span className="mono">{pending.activeSessions} active</span>}
          proposedState={<span className="mono">0 active</span>}
          destructive
          submitLabel="Revoke sessions"
          successMessage="Sessions revoked"
          onConfirm={(reason) =>
            provider.revokeUserSessions(pending.user.id, {
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
  restrictedCount,
  sandboxCount,
  total,
}: {
  children: React.ReactNode;
  restrictedCount?: number;
  sandboxCount?: number;
  total?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Search, inspect, and administer end users. All actions are auditable."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} total
              </StatusBadge>
            ) : null}
            {restrictedCount ? (
              <StatusBadge tone="destructive" dot={false}>
                {restrictedCount} non-active
              </StatusBadge>
            ) : null}
            {sandboxCount ? (
              <StatusBadge tone="primary" dot={false}>
                {sandboxCount} sandbox
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function EntitlementsForm({
  user,
  onClose,
  onSubmit,
}: {
  user: User | null;
  onClose: () => void;
  onSubmit: (next: User["entitlements"], reason: string) => Promise<void>;
}) {
  const [ent, setEnt] = useState<User["entitlements"]>({
    spot: false,
    binary: false,
    mining: false,
    loans: false,
  });
  const [reason, setReason] = useState("");

  useMemoOnUser(user, (u) => {
    setEnt({ ...u.entitlements });
    setReason("");
  });

  const changed = user
    ? (["spot", "binary", "mining", "loans"] as const).some((k) => ent[k] !== user.entitlements[k])
    : false;
  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!user}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={user ? `Entitlements — ${user.displayName}` : ""}
      description="Toggle the products this user is permitted to access. Requires a reason."
      submitLabel="Save entitlements"
      submitDisabled={!changed || !reasonOk}
      onSubmit={async () => {
        await onSubmit(ent, reason.trim());
        onClose();
      }}
      testId="entitlements-drawer"
    >
      {user ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["spot", "binary", "mining", "loans"] as const).map((k) => (
              <label
                key={k}
                htmlFor={`ent-${k}`}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm capitalize text-foreground">{k}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Currently {user.entitlements[k] ? "enabled" : "disabled"}
                  </span>
                </div>
                <Switch
                  id={`ent-${k}`}
                  data-testid={`ent-${k}-switch`}
                  checked={ent[k]}
                  onCheckedChange={(v) => setEnt((prev) => ({ ...prev, [k]: !!v }))}
                />
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ent-reason" className="text-xs">
              Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
            </Label>
            <textarea
              id="ent-reason"
              data-testid="ent-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Describe why entitlements are changing."
            />
          </div>
        </>
      ) : null}
    </FormDrawer>
  );
}

function RestrictionsForm({
  user,
  onClose,
  onSubmit,
}: {
  user: User | null;
  onClose: () => void;
  onSubmit: (next: UserRestrictionTag[], reason: string) => Promise<void>;
}) {
  const [tags, setTags] = useState<UserRestrictionTag[]>([]);
  const [reason, setReason] = useState("");

  useMemoOnUser(user, (u) => {
    setTags(
      u.restrictions.filter((t): t is UserRestrictionTag =>
        USER_RESTRICTION_TAGS.includes(t as UserRestrictionTag),
      ),
    );
    setReason("");
  });

  const changed = user
    ? tags.length !== user.restrictions.length || tags.some((t) => !user.restrictions.includes(t))
    : false;
  const reasonOk = reason.trim().length >= 6;

  function toggle(tag: UserRestrictionTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <FormDrawer
      open={!!user}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={user ? `Restrictions — ${user.displayName}` : ""}
      description="Add or remove account restriction tags. Recorded to the audit trail."
      submitLabel="Save restrictions"
      submitDisabled={!changed || !reasonOk}
      onSubmit={async () => {
        await onSubmit(tags, reason.trim());
        onClose();
      }}
      testId="restrictions-drawer"
    >
      {user ? (
        <>
          <div className="grid grid-cols-1 gap-2">
            {USER_RESTRICTION_TAGS.map((tag) => (
              <label
                key={tag}
                htmlFor={`rest-${tag}`}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2"
              >
                <Checkbox
                  id={`rest-${tag}`}
                  data-testid={`rest-${tag}`}
                  checked={tags.includes(tag)}
                  onCheckedChange={() => toggle(tag)}
                />
                <span className="mono text-xs text-foreground">{tag}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rest-reason" className="text-xs">
              Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
            </Label>
            <textarea
              id="rest-reason"
              data-testid="rest-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Reference ticket, alert, or compliance note."
            />
          </div>
        </>
      ) : null}
    </FormDrawer>
  );
}

/** Reset local state whenever the active user changes (open a different row). */
function useMemoOnUser(user: User | null, effect: (u: User) => void) {
  useEffect(() => {
    if (user) effect(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}

function BoolPill({ on }: { on: boolean }) {
  return (
    <StatusBadge tone={on ? "success" : "neutral"} dot={false}>
      {on ? "yes" : "no"}
    </StatusBadge>
  );
}

function statusTone(s: UserStatus) {
  switch (s) {
    case "active":
      return "success" as const;
    case "restricted":
      return "warning" as const;
    case "frozen":
      return "destructive" as const;
    case "closed":
      return "neutral" as const;
  }
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
