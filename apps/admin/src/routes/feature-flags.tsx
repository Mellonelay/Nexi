import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLE_LIST } from "@/admin/config/roles";
import type { Environment, FeatureFlag, RoleId } from "@/admin/types";
import { Flag } from "lucide-react";

export const Route = createFileRoute("/feature-flags")({ component: Page });

const ENV_OPTIONS: Environment[] = ["DEVELOPMENT", "SANDBOX", "PRODUCTION"];

function Page() {
  return (
    <RouteGuard permission="flags.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const flagsQ = useAdminQuery((p) => p.listFlags());

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [pendingToggle, setPendingToggle] = useState<FeatureFlag | null>(null);

  const flags = useMemo(() => flagsQ.data ?? [], [flagsQ.data]);
  const selected = useMemo(
    () => (selectedKey ? (flags.find((f) => f.key === selectedKey) ?? null) : null),
    [flags, selectedKey],
  );

  if (flagsQ.loading) {
    return (
      <Shell>
        <LoadingSkeleton rows={4} />
      </Shell>
    );
  }
  if (flagsQ.error) {
    return (
      <Shell>
        <ErrorState title="Could not load flags" description={flagsQ.error.message} />
      </Shell>
    );
  }

  const canEdit = session.can("flags.edit");
  const enabledCount = flags.filter((f) => f.enabled).length;

  const columns: DataTableColumn<FeatureFlag>[] = [
    {
      key: "key",
      header: "Key",
      sortValue: (f) => f.key,
      cell: (f) => (
        <div className="flex flex-col leading-tight">
          <span className="mono text-xs text-primary">{f.key}</span>
          <span className="text-xs text-muted-foreground">{f.description}</span>
        </div>
      ),
    },
    {
      key: "env",
      header: "Environment",
      sortValue: (f) => f.env,
      cell: (f) => (
        <StatusBadge tone={envTone(f.env)} dot={false}>
          {f.env}
        </StatusBadge>
      ),
    },
    {
      key: "enabled",
      header: "State",
      sortValue: (f) => (f.enabled ? 0 : 1),
      cell: (f) => (
        <StatusBadge tone={f.enabled ? "success" : "neutral"}>
          {f.enabled ? "enabled" : "disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "rollout",
      header: "Rollout",
      align: "right",
      sortValue: (f) => f.rolloutPct ?? 0,
      cell: (f) => (
        <span className="mono text-xs">
          {f.rolloutPct !== undefined ? `${f.rolloutPct}%` : "—"}
        </span>
      ),
    },
    {
      key: "targets",
      header: "Targets",
      cell: (f) => {
        const roles = f.roleTargets?.length ?? 0;
        const users = f.userTargets?.length ?? 0;
        if (roles === 0 && users === 0) {
          return <span className="text-xs text-muted-foreground">all</span>;
        }
        return (
          <div className="flex gap-1">
            {roles ? (
              <StatusBadge tone="info" dot={false}>
                {roles} role{roles === 1 ? "" : "s"}
              </StatusBadge>
            ) : null}
            {users ? (
              <StatusBadge tone="primary" dot={false}>
                {users} user{users === 1 ? "" : "s"}
              </StatusBadge>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "updated",
      header: "Updated",
      sortValue: (f) => f.updatedAt,
      cell: (f) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(f.updatedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  const filters: DataTableFilter<FeatureFlag>[] = [
    {
      key: "env",
      label: "environment",
      options: ENV_OPTIONS.map((e) => ({ value: e, label: e })),
      match: (f, v) => f.env === v,
    },
    {
      key: "state",
      label: "state",
      options: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
      ],
      match: (f, v) => (v === "enabled" ? f.enabled : !f.enabled),
    },
  ];

  return (
    <Shell total={flags.length} enabled={enabledCount}>
      <DataTable
        data={flags}
        columns={columns}
        filters={filters}
        searchable={(f) => `${f.key} ${f.description}`}
        searchPlaceholder="Search key or description…"
        rowKey={(f) => f.key}
        onRowClick={(f) => setSelectedKey(f.key)}
        rowActions={(f) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`flag-inspect-${f.key}`}
              onClick={() => setSelectedKey(f.key)}
            >
              Inspect
            </Button>
            <Button
              variant={f.enabled ? "destructive" : "default"}
              size="sm"
              data-testid={`flag-toggle-${f.key}`}
              disabled={!canEdit}
              onClick={() => setPendingToggle(f)}
            >
              {f.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedKey(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.key}</span> : ""}
        subtitle={selected?.description}
        badges={
          selected ? (
            <>
              <StatusBadge tone={envTone(selected.env)} dot={false}>
                {selected.env}
              </StatusBadge>
              <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
                {selected.enabled ? "enabled" : "disabled"}
              </StatusBadge>
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "flag",
                  title: "Flag",
                  fields: [
                    { label: "Key", value: selected.key, mono: true },
                    { label: "Environment", value: selected.env, mono: true },
                    {
                      label: "Rollout %",
                      value: selected.rolloutPct !== undefined ? `${selected.rolloutPct}%` : "—",
                      mono: true,
                    },
                    {
                      label: "Updated",
                      value: new Date(selected.updatedAt).toLocaleString(),
                      mono: true,
                    },
                  ],
                },
                {
                  id: "targets",
                  title: "Targeting",
                  content: (
                    <div className="flex flex-col gap-2 text-sm">
                      <TargetBlock
                        label="Roles"
                        values={selected.roleTargets ?? []}
                        fallback="all roles"
                      />
                      <TargetBlock
                        label="Users"
                        values={selected.userTargets ?? []}
                        fallback="all users"
                      />
                    </div>
                  ),
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.key} heading="" limit={20} />,
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
                data-testid="flag-detail-edit"
                disabled={!canEdit}
                onClick={() => setEditing(selected)}
              >
                Edit targeting
              </Button>
              <Button
                variant={selected.enabled ? "destructive" : "default"}
                size="sm"
                data-testid="flag-detail-toggle"
                disabled={!canEdit}
                onClick={() => setPendingToggle(selected)}
              >
                {selected.enabled ? "Disable" : "Enable"}
              </Button>
            </>
          ) : null
        }
      />

      <FlagEditForm
        flag={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateFlag(editing.key, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {pendingToggle ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPendingToggle(null);
          }}
          title={pendingToggle.enabled ? "Disable feature flag" : "Enable feature flag"}
          description="Applies immediately in the flag's target environment."
          target={<span className="mono">{pendingToggle.key}</span>}
          targetId={pendingToggle.key}
          action={pendingToggle.enabled ? "flags.disable" : "flags.enable"}
          permission="flags.edit"
          currentState={
            <StatusBadge tone={pendingToggle.enabled ? "success" : "neutral"}>
              {pendingToggle.enabled ? "enabled" : "disabled"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pendingToggle.enabled ? "neutral" : "success"}>
              {pendingToggle.enabled ? "disabled" : "enabled"}
            </StatusBadge>
          }
          destructive={pendingToggle.enabled}
          submitLabel={pendingToggle.enabled ? "Disable" : "Enable"}
          successMessage="Flag toggled"
          onConfirm={(reason) =>
            provider.toggleFlag(pendingToggle.key, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPendingToggle(null)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  total,
  enabled,
}: {
  children: React.ReactNode;
  total?: number;
  enabled?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature Flags"
        description="Environment-scoped flags with rollout percentage and role/user targeting."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} total
              </StatusBadge>
            ) : null}
            {enabled !== undefined ? (
              <StatusBadge tone="success" dot={false}>
                {enabled} enabled
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function TargetBlock({
  label,
  values,
  fallback,
}: {
  label: string;
  values: string[];
  fallback: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {values.length === 0 ? (
        <div className="mt-1 text-xs italic text-muted-foreground">Applies to {fallback}.</div>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <StatusBadge key={v} tone="info" dot={false}>
              {v}
            </StatusBadge>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagEditForm({
  flag,
  onClose,
  onSubmit,
}: {
  flag: FeatureFlag | null;
  onClose: () => void;
  onSubmit: (
    patch: {
      env: Environment;
      rolloutPct: number;
      roleTargets: RoleId[];
      userTargets: string[];
    },
    reason: string,
  ) => Promise<void>;
}) {
  const [env, setEnv] = useState<Environment>("SANDBOX");
  const [rollout, setRollout] = useState(100);
  const [roles, setRoles] = useState<RoleId[]>([]);
  const [userTargets, setUserTargets] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (flag) {
      setEnv(flag.env);
      setRollout(flag.rolloutPct ?? 100);
      setRoles(flag.roleTargets ?? []);
      setUserTargets((flag.userTargets ?? []).join(", "));
      setReason("");
    }
  }, [flag?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;
  const parsedUsers = userTargets
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  function toggleRole(r: RoleId) {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  return (
    <FormDrawer
      open={!!flag}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={
        flag ? (
          <span className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            <span className="mono text-primary">{flag.key}</span>
          </span>
        ) : (
          ""
        )
      }
      description="Update environment, rollout percentage, and targeting. Requires a reason."
      submitLabel="Save flag"
      submitDisabled={!reasonOk}
      onSubmit={async () => {
        await onSubmit(
          { env, rolloutPct: rollout, roleTargets: roles, userTargets: parsedUsers },
          reason.trim(),
        );
        onClose();
      }}
      testId="flag-edit-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-env" className="text-xs">
          Environment
        </Label>
        <select
          id="flag-env"
          data-testid="flag-env-select"
          value={env}
          onChange={(e) => setEnv(e.target.value as Environment)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          {ENV_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-rollout" className="text-xs">
          Rollout percentage <span className="mono text-primary">{rollout}%</span>
        </Label>
        <input
          id="flag-rollout"
          data-testid="flag-rollout"
          type="range"
          min={0}
          max={100}
          step={5}
          value={rollout}
          onChange={(e) => setRollout(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          Role targets <span className="text-muted-foreground">(none = all roles)</span>
        </Label>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {ROLE_LIST.map((r) => (
            <label
              key={r.id}
              htmlFor={`flag-role-${r.id}`}
              className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2"
            >
              <Checkbox
                id={`flag-role-${r.id}`}
                data-testid={`flag-role-${r.id}`}
                checked={roles.includes(r.id)}
                onCheckedChange={() => toggleRole(r.id)}
              />
              <span className="text-xs">{r.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-users" className="text-xs">
          User targets <span className="text-muted-foreground">(comma-separated user IDs)</span>
        </Label>
        <Input
          id="flag-users"
          data-testid="flag-users"
          value={userTargets}
          onChange={(e) => setUserTargets(e.target.value)}
          placeholder="usr_1001, usr_1002"
          className="h-9 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="flag-reason" className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          id="flag-reason"
          data-testid="flag-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          placeholder="Reference ticket, launch plan, or incident."
        />
      </div>
    </FormDrawer>
  );
}

function envTone(env: Environment) {
  switch (env) {
    case "DEVELOPMENT":
      return "info" as const;
    case "SANDBOX":
      return "warning" as const;
    case "PRODUCTION":
      return "destructive" as const;
  }
}
