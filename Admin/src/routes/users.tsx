import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Ban, ShieldCheck, ShieldOff, KeyRound, LogOut, UserRound } from "lucide-react";
import { VipReferralPolicyEditor } from "./-vip-referral-policy-editor";

export const Route = createFileRoute("/users")({ component: Page });

type PendingStatusAction = {
  kind: "status";
  user: User;
  status: UserStatus;
};
type PendingRevokeAllAction = { kind: "revoke-all"; user: User; activeSessions: number };
type PendingVipAction = { kind: "assign" | "clear"; user: User; level: number | null };
type PendingAction = PendingStatusAction | PendingRevokeAllAction;

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
  const reference = useRouterState({
    select: (state) => {
      const value = (state.location.search as { reference?: unknown }).reference;
      return typeof value === "string" ? value : undefined;
    },
  });
  const usersQ = useAdminQuery((p) => p.listUsers());
  const sessionsQ = useAdminQuery(
    (p) => (session.can("sessions.view") ? p.listSessions() : Promise.resolve([])),
    [session.roleId],
  );
  const walletsQ = useAdminQuery(
    (p) => (session.can("wallets.view") ? p.listWallets() : Promise.resolve([])),
    [session.roleId],
  );
  const [selectedId, setSelectedId] = useState<string | null>(reference ?? null);
  const selectedUserCode = Number(usersQ.data?.find((user) => user.id === selectedId)?.userCode);
  const vipReferralQ = useAdminQuery(
    (p) =>
      Number.isSafeInteger(selectedUserCode) &&
      selectedUserCode >= 100000 &&
      p.getVipReferralCustomer
        ? p.getVipReferralCustomer(selectedUserCode)
        : Promise.resolve(null),
    [selectedUserCode],
  );
  const vipSettingsQ = useAdminQuery((p) =>
    p.getVipReferralAdminSettings ? p.getVipReferralAdminSettings() : Promise.resolve(null),
  );
  const [vipLevelDraft, setVipLevelDraft] = useState("");
  const [vipActionMessage, setVipActionMessage] = useState("");
  const [pendingVipAction, setPendingVipAction] = useState<PendingVipAction | null>(null);

  useEffect(() => {
    if (reference) setSelectedId(reference);
  }, [reference]);
  const [entitlementUser, setEntitlementUser] = useState<User | null>(null);
  const [restrictionUser, setRestrictionUser] = useState<User | null>(null);
  const [fundingUser, setFundingUser] = useState<User | null>(null);
  const [freezeAction, setFreezeAction] = useState<{ user: User; frozen: boolean } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [binaryDefaultDraft, setBinaryDefaultDraft] = useState<"NORMAL" | "WIN" | "LOSS">("NORMAL");
  const [pendingBinaryDefault, setPendingBinaryDefault] = useState<{
    user: User;
    mode: "NORMAL" | "WIN" | "LOSS";
  } | null>(null);

  const users = useMemo(() => usersQ.data ?? [], [usersQ.data]);
  const sessions = useMemo(() => sessionsQ.data ?? [], [sessionsQ.data]);
  const wallets = useMemo(() => walletsQ.data ?? [], [walletsQ.data]);

  const selected = useMemo(
    () => (selectedId ? (users.find((u) => u.id === selectedId) ?? null) : null),
    [users, selectedId],
  );

  useEffect(() => {
    setBinaryDefaultDraft(selected?.binaryResearchDefault ?? "NORMAL");
    setVipLevelDraft(vipReferralQ.data?.vip ? String(vipReferralQ.data.vip.level) : "");
  }, [selected?.id, selected?.binaryResearchDefault, vipReferralQ.data]);

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

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (u) => u.displayName.toLowerCase(),
      cell: (u) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-foreground">{u.displayName}</span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
          {u.walletAddress ? (
            <span
              className="mono max-w-48 truncate text-[10px] text-muted-foreground"
              title={u.walletAddress}
            >
              {u.walletAddress}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "userCode",
      header: "Profile ID",
      sortValue: (u) => u.userCode ?? "",
      cell: (u) => <span className="mono text-xs text-primary">{u.userCode ?? "—"}</span>,
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
          {u.binaryResearchEligible ? (
            <StatusBadge tone="warning" dot={false}>
              Research
            </StatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      key: "sessions",
      header: "Unrevoked sessions",
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
        { value: "unknown", label: "Unknown" },
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

  const restrictedCount = users.filter(
    (u) => u.status !== "active" && u.status !== "unknown",
  ).length;
  const researchCount = users.filter((u) => u.binaryResearchEligible).length;

  return (
    <PageShell restrictedCount={restrictedCount} researchCount={researchCount} total={users.length}>
      {session.can("users.view") ? (
        <VipReferralPolicyEditor
          settings={vipSettingsQ.data}
          loading={vipSettingsQ.loading}
          error={vipSettingsQ.error}
          refresh={vipSettingsQ.refresh}
        />
      ) : null}
      <DataTable
        data={users}
        columns={columns}
        filters={filters}
        searchable={(u) =>
          `${u.displayName} ${u.email} ${u.walletAddress ?? ""} ${u.userCode ?? ""} ${u.id} ${u.country}`
        }
        searchPlaceholder="Search profile ID, name, email, wallet, UUID…"
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
        subtitle={
          selected
            ? `${selected.userCode ? `Profile ${selected.userCode} · ` : ""}${selected.email}`
            : undefined
        }
        badges={
          selected ? (
            <>
              <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
              <StatusBadge tone={kycTone(selected.kyc)}>KYC {selected.kyc}</StatusBadge>
              {selected.binaryResearchEligible ? (
                <StatusBadge tone="warning">Approved research account</StatusBadge>
              ) : null}
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
                    { label: "Profile ID", value: selected.userCode ?? "Unavailable", mono: true },
                    { label: "Internal UUID", value: selected.id, mono: true },
                    { label: "Display name", value: selected.displayName },
                    { label: "Email", value: selected.email },
                    {
                      label: "Connected wallet",
                      value: selected.walletAddress ?? "Not connected",
                      mono: true,
                    },
                    { label: "Country", value: selected.country, mono: true },
                    { label: "Tier", value: selected.tier, mono: true },
                    { label: "Created", value: formatDate(selected.createdAt), mono: true },
                    { label: "Last login", value: formatDate(selected.lastLoginAt), mono: true },
                  ],
                },
                ...(session.can("wallets.view")
                  ? [
                      {
                        id: "accounts",
                        title: "NEXI internal accounts",
                        description:
                          "Funding, Spot, Margin, Option and Finance balances. Deposit addresses are configured separately.",
                        content: walletsQ.error ? (
                          <p className="text-sm text-destructive">
                            Could not load account balances.
                          </p>
                        ) : walletsQ.loading ? (
                          <p className="text-sm text-muted-foreground">Loading balances…</p>
                        ) : (
                          <div className="space-y-2">
                            {(
                              [
                                ["funding", "Funding"],
                                ["spot", "Spot"],
                                ["margin", "Margin"],
                                ["option", "Option"],
                                ["financial", "Finance"],
                              ] as const
                            ).map(([domain, label]) => {
                              const accounts = wallets.filter(
                                (wallet) =>
                                  wallet.userId === selected.id && wallet.domain === domain,
                              );
                              return (
                                <div
                                  key={domain}
                                  className="rounded-md border border-border/60 p-3"
                                >
                                  <div className="text-xs font-semibold text-foreground">
                                    {label}
                                  </div>
                                  {accounts.length ? (
                                    accounts.map((account) => (
                                      <div
                                        key={account.id}
                                        className="mt-1 text-xs text-muted-foreground"
                                      >
                                        <span className="font-medium text-foreground">
                                          {account.asset}
                                        </span>
                                        : {account.available} available · {account.locked} locked ·{" "}
                                        {account.status ?? "unknown"}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Account not opened
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ),
                      },
                    ]
                  : []),
                ...(session.can("sessions.view")
                  ? [
                      {
                        id: "security-sessions",
                        title: "Security & Sessions",
                        description:
                          "Authentication sessions. A session that is not revoked does not mean the customer is online now.",
                        content: sessionsQ.error ? (
                          <p className="text-sm text-destructive">
                            Could not load customer sessions.
                          </p>
                        ) : sessionsQ.loading ? (
                          <p className="text-sm text-muted-foreground">
                            Loading customer sessions…
                          </p>
                        ) : sessions.filter((item) => item.userId === selected.id).length ? (
                          <div className="space-y-2">
                            {sessions
                              .filter((item) => item.userId === selected.id)
                              .sort((left, right) => {
                                const lastUsed =
                                  Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt);
                                return Number.isFinite(lastUsed) ? lastUsed : 0;
                              })
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-md border border-border/60 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {item.device}
                                    </span>
                                    <StatusBadge tone={item.active ? "success" : "neutral"}>
                                      {item.active ? "Not revoked" : "Revoked"}
                                    </StatusBadge>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Last used {formatDate(item.lastSeenAt)} · Created{" "}
                                    {formatDate(item.createdAt)}
                                  </p>
                                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                                    {item.id}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No customer authentication sessions found.
                          </p>
                        ),
                      },
                    ]
                  : []),
                {
                  id: "vip-referral",
                  title: "VIP and referrals",
                  description:
                    "Qualification and referral rewards are based on credited external deposits. Legacy referral totals are not shown as payable balances.",
                  content: (
                    <div className="flex flex-col gap-3">
                      {vipReferralQ.loading ? (
                        <p className="text-xs text-muted-foreground">
                          Loading VIP and referral profile…
                        </p>
                      ) : null}
                      {vipReferralQ.error ? (
                        <p role="alert" className="text-xs text-destructive">
                          {vipReferralQ.error.message}
                        </p>
                      ) : null}
                      {vipReferralQ.data?.vip ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p className="text-sm">
                            VIP {vipReferralQ.data.vip.level} · {vipReferralQ.data.vip.name}
                          </p>
                          <p className="text-sm">
                            Qualified deposit progress {vipReferralQ.data.vip.progress} /{" "}
                            {vipReferralQ.data.vip.threshold} {vipReferralQ.data.vip.baseAsset ?? ""}
                          </p>
                          {vipReferralQ.data.vip.nextTier ? (
                            <p className="text-sm">
                              Next: VIP {vipReferralQ.data.vip.nextTier.level} · {vipReferralQ.data.vip.nextTier.name};{" "}
                              {vipReferralQ.data.vip.nextTier.remaining} {vipReferralQ.data.vip.baseAsset ?? ""} remaining
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {vipReferralQ.data.vip.manualOverride
                              ? `Manual override: ${vipReferralQ.data.vip.overrideReason ?? "reason not recorded"}`
                              : "Automatically qualified"}
                          </p>
                          <div className="rounded bg-muted p-2 text-xs">
                            <p className="mb-1 font-medium">Tier benefit metadata</p>
                            {Object.entries(vipReferralQ.data.vip.benefits ?? {}).length ? (
                              <dl className="grid gap-1 sm:grid-cols-2">
                                {Object.entries(vipReferralQ.data.vip.benefits ?? {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">{key}</dt>
                                    <dd className="text-right">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                                  </div>
                                ))}
                              </dl>
                            ) : <p className="text-muted-foreground">No benefit metadata configured.</p>}
                          </div>
                          <p className="text-xs text-muted-foreground sm:col-span-2">
                            Benefit metadata is informational; deposit and withdrawal limits are not enforced by this field.
                          </p>
                          {vipReferralQ.data.vip.firstDepositReferral ? (
                            <div className="text-xs sm:col-span-2">
                              First deposit referral: {vipReferralQ.data.vip.firstDepositReferral.status}
                              {vipReferralQ.data.vip.firstDepositReferral.reason ? ` · ${vipReferralQ.data.vip.firstDepositReferral.reason}` : ""}
                              {vipReferralQ.data.vip.firstDepositReferral.rewardAmount
                                ? ` · ${vipReferralQ.data.vip.firstDepositReferral.rewardAmount} ${vipReferralQ.data.vip.firstDepositReferral.rewardAsset ?? ""}`
                                : ""}
                            </div>
                          ) : null}
                        </div>
                      ) : !vipReferralQ.loading ? (
                        <p className="text-xs text-muted-foreground">
                          No VIP qualification record for this customer.
                        </p>
                      ) : null}
                      {vipReferralQ.data?.referral ? (
                        <div className="grid gap-1 text-sm sm:grid-cols-3">
                          <p>
                            Referral code:{" "}
                            <span className="font-mono">
                              {vipReferralQ.data.referral.referralCode}
                            </span>
                          </p>
                          <p>Referred by: {vipReferralQ.data.referral.referredByUserCode ?? "—"}</p>
                          <p>Customers referred: {vipReferralQ.data.referral.referralCount}</p>
                        </div>
                      ) : !vipReferralQ.loading ? (
                        <p className="text-xs text-muted-foreground">
                          No referral identity recorded.
                        </p>
                      ) : null}
                      {selected.userCode && session.can("users.entitlements") ? (
                        <div className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-3">
                          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                            Audited manual VIP override
                            <select
                              aria-label="VIP manual override level"
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                              value={vipLevelDraft}
                              onChange={(event) => setVipLevelDraft(event.target.value)}
                            >
                              <option value="">Select level</option>
                              {(vipSettingsQ.data?.levels ?? [])
                                .filter((level) => level.enabled)
                                .map((level) => (
                                  <option key={level.id} value={level.level}>
                                    VIP {level.level} · {level.name}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <Button
                            size="sm"
                            disabled={
                              !provider.assignUserVip ||
                              !vipLevelDraft ||
                              vipReferralQ.loading
                            }
                            onClick={() => setPendingVipAction({
                              kind: "assign",
                              user: selected,
                              level: Number(vipLevelDraft),
                            })}
                          >
                            Assign override
                          </Button>
                          {vipReferralQ.data?.vip?.manualOverride ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                !provider.clearUserVipOverride || vipReferralQ.loading
                              }
                              onClick={() => setPendingVipAction({
                                kind: "clear",
                                user: selected,
                                level: null,
                              })}
                            >
                              Clear override
                            </Button>
                          ) : null}
                          {vipActionMessage ? (
                            <p role="status" className="w-full text-xs text-muted-foreground">
                              {vipActionMessage}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ),
                },
                {
                  id: "entitlements",
                  title: "Entitlements & flags",
                  fields: [
                    { label: "Spot", value: <BoolPill on={selected.entitlements.spot} /> },
                    { label: "Binary", value: <BoolPill on={selected.entitlements.binary} /> },
                    { label: "Mining", value: <BoolPill on={selected.entitlements.mining} /> },
                    { label: "Loans", value: <BoolPill on={selected.entitlements.loans} /> },
                    {
                      label: "Approved research account",
                      value: <BoolPill on={!!selected.binaryResearchEligible} />,
                    },
                  ],
                },
                ...(selected.binaryResearchEligible
                  ? [
                      {
                        id: "binary-research",
                        title: "Binary Trading Control",
                        content: (
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                              Default for future eligible trades
                              <select
                                aria-label="Binary account default"
                                value={binaryDefaultDraft}
                                onChange={(event) =>
                                  setBinaryDefaultDraft(
                                    event.target.value as typeof binaryDefaultDraft,
                                  )
                                }
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                              >
                                <option value="NORMAL">Normal</option>
                                <option value="WIN">Win</option>
                                <option value="LOSS">Lose</option>
                              </select>
                            </label>
                            <Button
                              size="sm"
                              disabled={
                                !session.can("binary.edit") ||
                                binaryDefaultDraft === (selected.binaryResearchDefault ?? "NORMAL")
                              }
                              onClick={() =>
                                setPendingBinaryDefault({
                                  user: selected,
                                  mode: binaryDefaultDraft,
                                })
                              }
                            >
                              Save default
                            </Button>
                          </div>
                        ),
                      },
                    ]
                  : []),
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
                disabled={!session.can("ledger.adjust") || !provider.applyFinancialCorrection}
                onClick={() => setFundingUser(selected)}
              >
                Adjust balance
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!session.can("ledger.freeze") || !provider.setUserLedgerFreeze}
                onClick={() => setFreezeAction({ user: selected, frozen: true })}
              >
                Freeze balances
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!session.can("ledger.freeze") || !provider.setUserLedgerFreeze}
                onClick={() => setFreezeAction({ user: selected, frozen: false })}
              >
                Unfreeze balances
              </Button>
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

      <FinancialCorrectionForm
        key={fundingUser?.id ?? "closed"}
        user={fundingUser}
        provider={provider}
        session={session}
        onClose={() => {
          setFundingUser(null);
          walletsQ.refresh();
        }}
      />
      <LedgerFreezeForm
        key={freezeAction ? `${freezeAction.user.id}:${freezeAction.frozen}` : "closed"}
        action={freezeAction}
        provider={provider}
        session={session}
        onClose={() => {
          setFreezeAction(null);
          walletsQ.refresh();
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

      {pendingVipAction ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(open) => { if (!open) setPendingVipAction(null); }}
          title={pendingVipAction.kind === "assign" ? "Assign VIP override" : "Clear VIP override"}
          description={pendingVipAction.kind === "clear"
            ? "Clears the manual override flag. The current tier stays in place; future automatic qualification resumes."
            : "Sets the customer's current VIP tier through an audited manual override."}
          target={<span>{pendingVipAction.user.displayName}</span>}
          targetId={String(pendingVipAction.user.userCode ?? pendingVipAction.user.id)}
          action={pendingVipAction.kind === "assign" ? "vip.override.assign" : "vip.override.clear"}
          permission="users.entitlements"
          currentState={<StatusBadge tone="info">VIP {vipReferralQ.data?.vip?.level ?? "unassigned"}</StatusBadge>}
          proposedState={<StatusBadge tone="warning">
            {pendingVipAction.kind === "assign" ? "VIP " + pendingVipAction.level + " override" : "Override flag cleared"}
          </StatusBadge>}
          submitLabel={pendingVipAction.kind === "assign" ? "Assign override" : "Clear override"}
          successMessage={pendingVipAction.kind === "assign" ? "VIP override saved" : "VIP override cleared"}
          onConfirm={async (reason) => {
            const userCode = Number(pendingVipAction.user.userCode);
            const result = pendingVipAction.kind === "assign"
              ? await provider.assignUserVip!(userCode, pendingVipAction.level!, reason)
              : await provider.clearUserVipOverride!(userCode, reason);
            const readback = await provider.getVipReferralCustomer!(userCode);
            const verified = pendingVipAction.kind === "assign"
              ? readback.vip?.manualOverride === true && readback.vip.level === pendingVipAction.level
              : readback.vip?.manualOverride === false &&
                readback.vip.level === (vipReferralQ.data?.vip?.level ?? 0);
            if (!verified) {
              throw new Error("Mutation was accepted but profile readback did not confirm it. Refresh before retrying.");
            }
            setVipActionMessage(pendingVipAction.kind === "assign"
              ? "VIP override saved and confirmed by profile readback."
              : "Override clear confirmed; current tier retained and automatic qualification resumed.");
            return result;
          }}
          onSuccess={() => {
            setPendingVipAction(null);
            vipReferralQ.refresh();
          }}
        />
      ) : null}

      {pendingBinaryDefault ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingBinaryDefault(null);
          }}
          title="Save Binary default"
          description="Applies to future eligible research trades for this approved account."
          target={<span>{pendingBinaryDefault.user.displayName}</span>}
          targetId={pendingBinaryDefault.user.id}
          action="binary.research_account_default"
          permission="binary.edit"
          currentState={
            <StatusBadge tone="info">
              {pendingBinaryDefault.user.binaryResearchDefault ?? "NORMAL"}
            </StatusBadge>
          }
          proposedState={<StatusBadge tone="warning">{pendingBinaryDefault.mode}</StatusBadge>}
          submitLabel="Save default"
          successMessage="Binary default saved"
          onConfirm={(reason) =>
            provider.setBinaryResearchDefault(
              pendingBinaryDefault.user.id,
              pendingBinaryDefault.mode,
              {
                actor: session.actorName,
                role: session.roleId,
                environment: session.environment,
                reason,
              },
            )
          }
          onSuccess={() => {
            setPendingBinaryDefault(null);
            usersQ.refresh();
          }}
        />
      ) : null}
    </PageShell>
  );
}

function PageShell({
  children,
  restrictedCount,
  researchCount,
  total,
}: {
  children: React.ReactNode;
  restrictedCount?: number;
  researchCount?: number;
  total?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description="Search, inspect, and administer client accounts. All actions are auditable."
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
            {researchCount ? (
              <StatusBadge tone="primary" dot={false}>
                {researchCount} research accounts
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

function LedgerFreezeForm({
  action,
  provider,
  session,
  onClose,
}: {
  action: { user: User; frozen: boolean } | null;
  provider: ReturnType<typeof useAdminData>;
  session: ReturnType<typeof useAdminSession>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  return (
    <FormDrawer
      open={!!action}
      onOpenChange={(open) => !open && onClose()}
      onCancel={onClose}
      title={action?.frozen ? "Freeze user balances" : "Unfreeze user balances"}
      description="Suspends or reactivates this user’s open ledger accounts. The change is audited and recorded in the event outbox."
      submitLabel={action?.frozen ? "Freeze balances" : "Unfreeze balances"}
      submitVariant={action?.frozen ? "destructive" : "default"}
      submitDisabled={!action || !provider.setUserLedgerFreeze || !session.can("ledger.freeze")}
      testId="ledger-freeze-form"
      onSubmit={async () => {
        if (!action || !provider.setUserLedgerFreeze) return;
        setError(null);
        try {
          if (reason.trim().length < 3) throw new Error("Enter a reason of at least 3 characters.");
          const requestKey = idempotencyKey.current ?? crypto.randomUUID();
          idempotencyKey.current = requestKey;
          await provider.setUserLedgerFreeze({
            userId: action.user.id,
            frozen: action.frozen,
            reason: reason.trim(),
            idempotencyKey: requestKey,
          });
          idempotencyKey.current = null;
          onClose();
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Could not change ledger account status.",
          );
        }
      }}
    >
      {action ? (
        <p className="text-xs text-muted-foreground">
          {action.user.displayName} · Profile {action.user.userCode ?? "—"}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-xs">
        Reason
        <textarea
          required
          minLength={3}
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(e) => {
            idempotencyKey.current = null;
            setReason(e.target.value);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </FormDrawer>
  );
}

function FinancialCorrectionForm({
  user,
  provider,
  session,
  onClose,
}: {
  user: User | null;
  provider: ReturnType<typeof useAdminData>;
  session: ReturnType<typeof useAdminSession>;
  onClose: () => void;
}) {
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [scope, setScope] = useState<"MAIN" | "SPOT" | "MARGIN" | "BINARY" | "FINANCE">("MAIN");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const optionsQ = useAdminQuery(
    (p) => user && session.can("ledger.adjust") && p.getFinancialCorrectionOptions
      ? p.getFinancialCorrectionOptions(user.id)
      : Promise.resolve([]),
    [user?.id, session.roleId],
  );
  const availableScopes = useMemo(
    () => [...new Set((optionsQ.data ?? []).flatMap((item) => item.scopes))],
    [optionsQ.data],
  );
  const scopedAssets = useMemo(
    () => (optionsQ.data ?? []).filter((item) => item.scopes.includes(scope)),
    [optionsQ.data, scope],
  );
  useEffect(() => {
    if (!availableScopes.includes(scope)) {
      setScope(availableScopes.includes("MAIN") ? "MAIN" : availableScopes[0] ?? "MAIN");
    }
  }, [availableScopes, scope]);
  useEffect(() => {
    if (!scopedAssets.some((item) => item.asset === asset)) {
      setAsset(scopedAssets.find((item) => item.asset === "USDT")?.asset ?? scopedAssets[0]?.asset ?? "");
    }
  }, [asset, scopedAssets]);
  return (
    <FormDrawer
      open={!!user}
      onOpenChange={(open) => !open && onClose()}
      onCancel={onClose}
      title="Adjust user balance"
      description="Posts a direct balance adjustment to the selected ledger account, with an administrator audit record."
      submitLabel={direction === "CREDIT" ? "Credit account" : "Debit account"}
      submitDisabled={!user || !session.can("ledger.adjust") || !provider.applyFinancialCorrection || optionsQ.loading || !!optionsQ.error || !scopedAssets.some((item) => item.asset === asset)}
      testId="financial-correction-form"
      onSubmit={async () => {
        if (!user || !provider.applyFinancialCorrection) return;
        setError(null);
        try {
          const canonicalAmount = amount.trim();
          if (
            !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(canonicalAmount) ||
            !/[1-9]/.test(canonicalAmount)
          ) {
            throw new Error("Enter a positive decimal amount.");
          }
          if (!scopedAssets.some((item) => item.asset === asset && item.scopes.includes(scope)))
            throw new Error("Choose an active configured asset and customer account scope.");
          if (!/^[A-Z0-9._-]{2,20}$/.test(asset.trim()))
            throw new Error("Enter a valid uppercase asset code.");
          if (reason.trim().length < 3) throw new Error("Enter a reason of at least 3 characters.");
          const requestKey = idempotencyKey.current ?? crypto.randomUUID();
          idempotencyKey.current = requestKey;
          await provider.applyFinancialCorrection({
            userId: user.id,
            asset: asset.trim(),
            scope,
            amount: canonicalAmount,
            direction,
            reason: reason.trim(),
            idempotencyKey: requestKey,
          });
          idempotencyKey.current = null;
          onClose();
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not complete the balance adjustment. Retry to safely check the original request.",
          );
        }
      }}
    >
      {user ? (
        <p className="text-xs text-muted-foreground">
          {user.displayName} · Profile {user.userCode ?? "—"}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-xs">
        Asset
        <input
          required
          list="financial-correction-assets"
          value={asset}
          disabled={optionsQ.loading || !!optionsQ.error || scopedAssets.length === 0}
          placeholder={scopedAssets.length ? "Search configured assets" : "No eligible configured asset"}
          onChange={(e) => { idempotencyKey.current = null; setAsset(e.target.value.trim().toUpperCase()); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <datalist id="financial-correction-assets">
          {scopedAssets.map((item) => <option key={item.asset} value={item.asset} label={item.name} />)}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Amount
        <input
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            idempotencyKey.current = null;
            setAmount(e.target.value);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Account scope
        <select
          value={availableScopes.includes(scope) ? scope : ""}
          disabled={optionsQ.loading || !!optionsQ.error || availableScopes.length === 0}
          onChange={(e) => { idempotencyKey.current = null; setScope(e.target.value as typeof scope); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {availableScopes.map((value) => <option key={value} value={value}>{{ MAIN: "MAIN · Funding", SPOT: "SPOT · Spot", MARGIN: "MARGIN · Margin", BINARY: "BINARY · Options", FINANCE: "FINANCE · Finance" }[value]}</option>)}
        </select>
      </label>
      {optionsQ.loading ? <p className="text-xs text-muted-foreground">Loading eligible customer accounts…</p> : null}
      {optionsQ.error ? <p role="alert" className="text-xs text-destructive">Could not load eligible account assets. Refresh the customer detail before adjusting a balance.</p> : null}
      {!optionsQ.loading && !optionsQ.error && scopedAssets.length === 0 ? <p className="text-xs text-muted-foreground">No active customer account is available for this scope and configured asset.</p> : null}
      <label className="flex flex-col gap-1 text-xs">
        Direction
        <select
          value={direction}
          onChange={(e) => {
            idempotencyKey.current = null;
            setDirection(e.target.value as typeof direction);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Reason
        <textarea
          required
          minLength={3}
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(e) => {
            idempotencyKey.current = null;
            setReason(e.target.value);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
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

function statusTone(s: UserStatus | "unknown") {
  switch (s) {
    case "unknown":
      return "neutral" as const;
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
