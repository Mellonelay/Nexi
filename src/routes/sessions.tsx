import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import type { Session, User } from "@/admin/types";
import { LogOut, Monitor } from "lucide-react";

export const Route = createFileRoute("/sessions")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="sessions.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const sessionsQ = useAdminQuery((p) => p.listSessions());
  const usersQ = useAdminQuery((p) => p.listUsers());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<Session | null>(null);

  const sessions = useMemo(() => sessionsQ.data ?? [], [sessionsQ.data]);
  const users = useMemo(() => usersQ.data ?? [], [usersQ.data]);

  const selected = useMemo(
    () => (selectedId ? (sessions.find((s) => s.id === selectedId) ?? null) : null),
    [sessions, selectedId],
  );

  if (sessionsQ.loading)
    return (
      <PageShell>
        <LoadingSkeleton rows={6} />
      </PageShell>
    );
  if (sessionsQ.error)
    return (
      <PageShell>
        <ErrorState title="Could not load sessions" description={sessionsQ.error.message} />
      </PageShell>
    );

  const canRevoke = session.can("sessions.revoke");
  const userFor = (id: string): User | undefined => users.find((u) => u.id === id);

  const columns: DataTableColumn<Session>[] = [
    {
      key: "id",
      header: "Session",
      sortValue: (s) => s.id,
      cell: (s) => <span className="mono text-xs text-muted-foreground">{s.id}</span>,
    },
    {
      key: "user",
      header: "User",
      sortValue: (s) => (userFor(s.userId)?.displayName ?? s.userId).toLowerCase(),
      cell: (s) => {
        const u = userFor(s.userId);
        return (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{u?.displayName ?? "Unknown"}</span>
            <span className="mono text-xs text-muted-foreground">{s.userId}</span>
          </div>
        );
      },
    },
    {
      key: "device",
      header: "Device",
      sortValue: (s) => s.device,
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          {s.device}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortValue: (s) => s.location,
      cell: (s) => <span className="text-sm">{s.location}</span>,
    },
    {
      key: "ip",
      header: "IP",
      sortValue: (s) => s.ip,
      cell: (s) => <span className="mono text-xs">{s.ip}</span>,
    },
    {
      key: "lastSeen",
      header: "Last seen",
      sortValue: (s) => s.lastSeenAt,
      cell: (s) => (
        <span className="mono text-[11px] text-muted-foreground">{formatDate(s.lastSeenAt)}</span>
      ),
    },
    {
      key: "active",
      header: "Status",
      sortValue: (s) => (s.active ? 0 : 1),
      cell: (s) => (
        <StatusBadge tone={s.active ? "success" : "neutral"}>
          {s.active ? "active" : "revoked"}
        </StatusBadge>
      ),
    },
  ];

  const filters: DataTableFilter<Session>[] = [
    {
      key: "active",
      label: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "revoked", label: "Revoked" },
      ],
      match: (s, v) => (v === "active" ? s.active : !s.active),
    },
  ];

  const activeCount = sessions.filter((s) => s.active).length;
  const revokedCount = sessions.length - activeCount;

  return (
    <PageShell active={activeCount} revoked={revokedCount} total={sessions.length}>
      <DataTable
        data={sessions}
        columns={columns}
        filters={filters}
        searchable={(s) =>
          `${s.id} ${s.userId} ${userFor(s.userId)?.displayName ?? ""} ${s.device} ${s.location} ${s.ip}`
        }
        searchPlaceholder="Search session, user, device, IP…"
        rowKey={(s) => s.id}
        onRowClick={(s) => setSelectedId(s.id)}
        rowActions={(s) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`session-inspect-${s.id}`}
              onClick={() => setSelectedId(s.id)}
            >
              Inspect
            </Button>
            <Button
              variant="destructive"
              size="sm"
              data-testid={`session-revoke-${s.id}`}
              disabled={!canRevoke || !s.active}
              onClick={() => setPending(s)}
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              Revoke
            </Button>
          </div>
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
              Session <span className="mono text-primary">{selected.id}</span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={
          selected
            ? `${userFor(selected.userId)?.displayName ?? selected.userId} · ${selected.location}`
            : undefined
        }
        badges={
          selected ? (
            <StatusBadge tone={selected.active ? "success" : "neutral"}>
              {selected.active ? "active" : "revoked"}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "session",
                  title: "Session",
                  fields: [
                    { label: "Session ID", value: selected.id, mono: true },
                    { label: "User ID", value: selected.userId, mono: true },
                    { label: "Device", value: selected.device },
                    { label: "Location", value: selected.location },
                    { label: "IP", value: selected.ip, mono: true },
                    { label: "Created", value: formatDate(selected.createdAt), mono: true },
                    { label: "Last seen", value: formatDate(selected.lastSeenAt), mono: true },
                    { label: "Status", value: selected.active ? "active" : "revoked" },
                  ],
                },
                {
                  id: "user",
                  title: "User context",
                  fields: userFor(selected.userId)
                    ? [
                        { label: "Name", value: userFor(selected.userId)!.displayName },
                        { label: "Email", value: userFor(selected.userId)!.email },
                        { label: "Account status", value: userFor(selected.userId)!.status },
                        { label: "KYC", value: userFor(selected.userId)!.kyc },
                      ]
                    : [{ label: "User", value: selected.userId, mono: true }],
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={15} />,
                },
              ]
            : []
        }
        actions={
          selected ? (
            <Button
              variant="destructive"
              size="sm"
              data-testid="session-detail-revoke"
              disabled={!canRevoke || !selected.active}
              onClick={() => setPending(selected)}
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              Revoke session
            </Button>
          ) : null
        }
      />

      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Revoke session"
          description="Immediately terminates this session on the user's device."
          target={
            <span>
              {userFor(pending.userId)?.displayName ?? pending.userId} · {pending.device}
            </span>
          }
          targetId={pending.id}
          action="sessions.revoke"
          permission="sessions.revoke"
          currentState={<StatusBadge tone="success">active</StatusBadge>}
          proposedState={<StatusBadge tone="neutral">revoked</StatusBadge>}
          destructive
          submitLabel="Revoke"
          successMessage="Session revoked"
          onConfirm={(reason) =>
            provider.revokeSession(pending.id, {
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
  active,
  revoked,
}: {
  children: React.ReactNode;
  total?: number;
  active?: number;
  revoked?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sessions"
        description="Inspect and revoke active user sessions."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} total
              </StatusBadge>
            ) : null}
            {active !== undefined ? (
              <StatusBadge tone="success" dot={false}>
                {active} active
              </StatusBadge>
            ) : null}
            {revoked ? (
              <StatusBadge tone="neutral" dot={false}>
                {revoked} revoked
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
