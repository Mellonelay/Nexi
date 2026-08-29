import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { FormDrawer } from "@/admin/components/FormDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  PublicRoute,
  PublicRouteState,
  QuotesCategory,
  PublicBanner,
  IncidentMessage,
  SupportEntryPoint,
} from "@/admin/types";
import { ArrowUp, ArrowDown, Megaphone, Wrench, ListFilter, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/frontend-control")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="frontend.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const routesQ = useAdminQuery((p) => p.listPublicRoutes());
  const catsQ = useAdminQuery((p) => p.listQuotesCategories());
  const bannersQ = useAdminQuery((p) => p.listBanners());
  const incidentsQ = useAdminQuery((p) => p.listIncidents());
  const supportQ = useAdminQuery((p) => p.listSupportEntryPoints());

  if (
    routesQ.loading ||
    catsQ.loading ||
    bannersQ.loading ||
    incidentsQ.loading ||
    supportQ.loading
  ) {
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  }
  if (routesQ.error)
    return (
      <Shell>
        <ErrorState title="Could not load frontend config" description={routesQ.error.message} />
      </Shell>
    );

  const routes = routesQ.data ?? [];
  const cats = catsQ.data ?? [];
  const banners = bannersQ.data ?? [];
  const incidents = incidentsQ.data ?? [];
  const supports = supportQ.data ?? [];
  const activeBanners = banners.filter((b) => b.active).length;
  const activeIncidents = incidents.filter((i) => i.active).length;

  return (
    <Shell
      badges={[
        { tone: "info", label: `${routes.length} routes` },
        {
          tone: activeIncidents ? "destructive" : "neutral",
          label: `${activeIncidents} incident${activeIncidents === 1 ? "" : "s"}`,
        },
        {
          tone: activeBanners ? "warning" : "neutral",
          label: `${activeBanners} banner${activeBanners === 1 ? "" : "s"}`,
        },
      ]}
    >
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="routes" data-testid="tab-routes">
            <Wrench className="mr-1 h-3.5 w-3.5" />
            Public routes
          </TabsTrigger>
          <TabsTrigger value="quotes" data-testid="tab-quotes">
            <ListFilter className="mr-1 h-3.5 w-3.5" />
            Quotes Hub
          </TabsTrigger>
          <TabsTrigger value="banners" data-testid="tab-banners">
            <Megaphone className="mr-1 h-3.5 w-3.5" />
            Banners & incidents
          </TabsTrigger>
          <TabsTrigger value="support" data-testid="tab-support">
            <LifeBuoy className="mr-1 h-3.5 w-3.5" />
            Support entry
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <PublicRoutesPanel routes={routes} />
        </TabsContent>
        <TabsContent value="quotes">
          <QuotesPanel cats={cats} />
        </TabsContent>
        <TabsContent value="banners">
          <BannersPanel banners={banners} incidents={incidents} />
        </TabsContent>
        <TabsContent value="support">
          <SupportEntryPanel supports={supports} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTimeline actionPrefix="frontend." limit={40} />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({
  children,
  badges,
}: {
  children: React.ReactNode;
  badges?: { tone: "info" | "warning" | "destructive" | "neutral"; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Frontend Control"
        description="Public route visibility, Quotes Hub, banners, incidents, and support entry points."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {badges?.map((b, i) => (
              <StatusBadge key={i} tone={b.tone} dot={false}>
                {b.label}
              </StatusBadge>
            ))}
          </>
        }
      />
      {children}
    </div>
  );
}

/* --------------- Public routes --------------- */
function PublicRoutesPanel({ routes }: { routes: PublicRoute[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const [editing, setEditing] = useState<PublicRoute | null>(null);

  const canEdit = session.can("frontend.edit");
  const sorted = useMemo(() => [...routes].sort((a, b) => a.order - b.order), [routes]);

  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((r) => r.id === id);
    const other = sorted[idx + dir];
    if (!other) return;
    const orderMap = { [id]: other.order, [other.id]: sorted[idx].order };
    await provider.reorderPublicRoutes(orderMap, {
      actor: session.actorName,
      role: session.roleId,
      environment: session.environment,
      reason: `Reordered ${id} ${dir === -1 ? "up" : "down"}`,
    });
    toast.success("Order updated");
  }

  const columns: DataTableColumn<PublicRoute>[] = [
    {
      key: "order",
      header: "#",
      align: "right",
      sortValue: (r) => r.order,
      cell: (r) => <span className="mono text-xs">{r.order}</span>,
    },
    {
      key: "path",
      header: "Path",
      sortValue: (r) => r.path,
      cell: (r) => <span className="mono text-xs text-primary">{r.path}</span>,
    },
    {
      key: "label",
      header: "Label",
      sortValue: (r) => r.label,
      cell: (r) => <span className="text-sm">{r.label}</span>,
    },
    {
      key: "state",
      header: "State",
      sortValue: (r) => r.state,
      cell: (r) => <StatusBadge tone={stateTone(r.state)}>{r.state}</StatusBadge>,
    },
    {
      key: "message",
      header: "Unavailable message",
      cell: (r) =>
        r.unavailableMessage ? (
          <span className="text-xs text-muted-foreground">{r.unavailableMessage}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">—</span>
        ),
    },
  ];

  return (
    <>
      <DataTable
        data={sorted}
        columns={columns}
        rowKey={(r) => r.id}
        searchable={(r) => `${r.path} ${r.label}`}
        searchPlaceholder="Search path or label…"
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              data-testid={`route-up-${r.id}`}
              disabled={!canEdit || sorted[0]?.id === r.id}
              onClick={() => move(r.id, -1)}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-testid={`route-down-${r.id}`}
              disabled={!canEdit || sorted[sorted.length - 1]?.id === r.id}
              onClick={() => move(r.id, 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid={`route-edit-${r.id}`}
              disabled={!canEdit}
              onClick={() => setEditing(r)}
            >
              Edit state
            </Button>
          </div>
        )}
      />
      <PublicRouteStateForm
        route={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (state, message, reason) => {
          if (!editing) return;
          await provider.setPublicRouteState(editing.id, state, message, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />
    </>
  );
}

function PublicRouteStateForm({
  route,
  onClose,
  onSubmit,
}: {
  route: PublicRoute | null;
  onClose: () => void;
  onSubmit: (state: PublicRouteState, message: string | undefined, reason: string) => Promise<void>;
}) {
  const [state, setState] = useState<PublicRouteState>("public");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (route) {
      setState(route.state);
      setMessage(route.unavailableMessage ?? "");
      setReason("");
    }
  }, [route?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsMessage = state === "maintenance" || state === "hidden";
  const reasonOk = reason.trim().length >= 6;
  const canSubmit = reasonOk && (!needsMessage || message.trim().length >= 4);

  return (
    <FormDrawer
      open={!!route}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={route ? `Public route — ${route.path}` : ""}
      description="Control who sees this route on the public surface and the message shown when unavailable."
      submitLabel="Save state"
      submitDisabled={!canSubmit}
      onSubmit={async () => {
        await onSubmit(state, needsMessage ? message.trim() : undefined, reason.trim());
        onClose();
      }}
      testId="route-state-drawer"
    >
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">State</Label>
        <select
          data-testid="route-state-select"
          value={state}
          onChange={(e) => setState(e.target.value as PublicRouteState)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="public">public — visible to everyone</option>
          <option value="authenticated">authenticated — visible only to signed-in users</option>
          <option value="hidden">hidden — not present in nav; message shown if reached</option>
          <option value="maintenance">maintenance — visible but disabled; message shown</option>
        </select>
      </div>
      {needsMessage ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Unavailable message</Label>
          <Input
            data-testid="route-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Shown on the public surface when the route is unreachable."
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">
          Reason <span className="text-muted-foreground">(auditable, ≥ 6 chars)</span>
        </Label>
        <textarea
          data-testid="route-state-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
    </FormDrawer>
  );
}

/* --------------- Quotes categories --------------- */
function QuotesPanel({ cats }: { cats: QuotesCategory[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("frontend.edit");
  const sorted = useMemo(() => [...cats].sort((a, b) => a.order - b.order), [cats]);
  const [pendingToggle, setPendingToggle] = useState<QuotesCategory | null>(null);

  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((c) => c.id === id);
    const other = sorted[idx + dir];
    if (!other) return;
    await provider.reorderQuotesCategories(
      { [id]: other.order, [other.id]: sorted[idx].order },
      {
        actor: session.actorName,
        role: session.roleId,
        environment: session.environment,
        reason: `Reordered category ${id}`,
      },
    );
    toast.success("Order updated");
  }

  const columns: DataTableColumn<QuotesCategory>[] = [
    {
      key: "order",
      header: "#",
      align: "right",
      sortValue: (c) => c.order,
      cell: (c) => <span className="mono text-xs">{c.order}</span>,
    },
    {
      key: "label",
      header: "Label",
      sortValue: (c) => c.label,
      cell: (c) => <span className="text-sm">{c.label}</span>,
    },
    {
      key: "visible",
      header: "Visibility",
      cell: (c) => (
        <StatusBadge tone={c.visible ? "success" : "neutral"}>
          {c.visible ? "visible" : "hidden"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={sorted}
        columns={columns}
        rowKey={(c) => c.id}
        rowActions={(c) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              data-testid={`cat-up-${c.id}`}
              disabled={!canEdit || sorted[0]?.id === c.id}
              onClick={() => move(c.id, -1)}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              data-testid={`cat-down-${c.id}`}
              disabled={!canEdit || sorted[sorted.length - 1]?.id === c.id}
              onClick={() => move(c.id, 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={c.visible ? "destructive" : "default"}
              size="sm"
              data-testid={`cat-toggle-${c.id}`}
              disabled={!canEdit}
              onClick={() => setPendingToggle(c)}
            >
              {c.visible ? "Hide" : "Show"}
            </Button>
          </div>
        )}
      />
      {pendingToggle ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPendingToggle(null);
          }}
          title={pendingToggle.visible ? "Hide Quotes Hub category" : "Show Quotes Hub category"}
          target={<span>{pendingToggle.label}</span>}
          targetId={pendingToggle.id}
          action="frontend.quotes_category_toggle"
          permission="frontend.edit"
          currentState={
            <StatusBadge tone={pendingToggle.visible ? "success" : "neutral"}>
              {pendingToggle.visible ? "visible" : "hidden"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pendingToggle.visible ? "neutral" : "success"}>
              {pendingToggle.visible ? "hidden" : "visible"}
            </StatusBadge>
          }
          destructive={pendingToggle.visible}
          submitLabel={pendingToggle.visible ? "Hide" : "Show"}
          successMessage="Category updated"
          onConfirm={(reason) =>
            provider.toggleQuotesCategory(pendingToggle.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPendingToggle(null)}
        />
      ) : null}
    </>
  );
}

/* --------------- Banners & incidents --------------- */
function BannersPanel({
  banners,
  incidents,
}: {
  banners: PublicBanner[];
  incidents: IncidentMessage[];
}) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("frontend.edit");
  const [pending, setPending] = useState<
    { kind: "banner"; row: PublicBanner } | { kind: "incident"; row: IncidentMessage } | null
  >(null);

  const bColumns: DataTableColumn<PublicBanner>[] = [
    {
      key: "scope",
      header: "Scope",
      sortValue: (b) => b.scope,
      cell: (b) => <span className="mono text-xs">{b.scope}</span>,
    },
    {
      key: "severity",
      header: "Severity",
      sortValue: (b) => b.severity,
      cell: (b) => <StatusBadge tone={sevTone(b.severity)}>{b.severity}</StatusBadge>,
    },
    {
      key: "message",
      header: "Message",
      cell: (b) => <span className="text-sm">{b.message}</span>,
    },
    {
      key: "active",
      header: "State",
      cell: (b) => (
        <StatusBadge tone={b.active ? "success" : "neutral"}>
          {b.active ? "active" : "inactive"}
        </StatusBadge>
      ),
    },
  ];

  const iColumns: DataTableColumn<IncidentMessage>[] = [
    {
      key: "title",
      header: "Title",
      sortValue: (i) => i.title,
      cell: (i) => <span className="text-sm font-medium">{i.title}</span>,
    },
    {
      key: "sev",
      header: "Severity",
      cell: (i) => <StatusBadge tone={sevTone(i.severity)}>{i.severity}</StatusBadge>,
    },
    {
      key: "body",
      header: "Body",
      cell: (i) => <span className="text-xs text-muted-foreground">{i.body}</span>,
    },
    {
      key: "posted",
      header: "Posted",
      sortValue: (i) => i.postedAt,
      cell: (i) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(i.postedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "active",
      header: "State",
      cell: (i) => (
        <StatusBadge tone={i.active ? "destructive" : "neutral"}>
          {i.active ? "active" : "resolved"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Banners
        </h3>
        <DataTable
          data={banners}
          columns={bColumns}
          rowKey={(b) => b.id}
          rowActions={(b) => (
            <Button
              variant={b.active ? "destructive" : "default"}
              size="sm"
              data-testid={`banner-toggle-${b.id}`}
              disabled={!canEdit}
              onClick={() => setPending({ kind: "banner", row: b })}
            >
              {b.active ? "Deactivate" : "Activate"}
            </Button>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Incident messages
        </h3>
        <DataTable
          data={incidents}
          columns={iColumns}
          rowKey={(i) => i.id}
          rowActions={(i) => (
            <Button
              variant={i.active ? "outline" : "default"}
              size="sm"
              data-testid={`incident-toggle-${i.id}`}
              disabled={!canEdit}
              onClick={() => setPending({ kind: "incident", row: i })}
            >
              {i.active ? "Mark resolved" : "Repost"}
            </Button>
          )}
        />
      </div>

      {pending?.kind === "banner" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={pending.row.active ? "Deactivate banner" : "Activate banner"}
          target={<span>{pending.row.message}</span>}
          targetId={pending.row.id}
          action="frontend.banner_active"
          permission="frontend.edit"
          currentState={
            <StatusBadge tone={pending.row.active ? "success" : "neutral"}>
              {pending.row.active ? "active" : "inactive"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pending.row.active ? "neutral" : "success"}>
              {pending.row.active ? "inactive" : "active"}
            </StatusBadge>
          }
          destructive={pending.row.active}
          submitLabel={pending.row.active ? "Deactivate" : "Activate"}
          successMessage="Banner updated"
          onConfirm={(reason) =>
            provider.setBannerActive(pending.row.id, !pending.row.active, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}

      {pending?.kind === "incident" ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title={pending.row.active ? "Mark incident resolved" : "Repost incident"}
          target={<span>{pending.row.title}</span>}
          targetId={pending.row.id}
          action="frontend.incident_active"
          permission="frontend.edit"
          currentState={
            <StatusBadge tone={pending.row.active ? "destructive" : "neutral"}>
              {pending.row.active ? "active" : "resolved"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pending.row.active ? "neutral" : "destructive"}>
              {pending.row.active ? "resolved" : "active"}
            </StatusBadge>
          }
          destructive={!pending.row.active}
          submitLabel={pending.row.active ? "Mark resolved" : "Repost"}
          successMessage="Incident updated"
          onConfirm={(reason) =>
            provider.setIncidentActive(pending.row.id, !pending.row.active, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}

/* --------------- Support entry --------------- */
function SupportEntryPanel({ supports }: { supports: SupportEntryPoint[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("frontend.edit");
  const [editing, setEditing] = useState<SupportEntryPoint | null>(null);

  const columns: DataTableColumn<SupportEntryPoint>[] = [
    {
      key: "order",
      header: "#",
      align: "right",
      sortValue: (s) => s.order,
      cell: (s) => <span className="mono text-xs">{s.order}</span>,
    },
    { key: "label", header: "Label", cell: (s) => <span className="text-sm">{s.label}</span> },
    {
      key: "channel",
      header: "Channel",
      cell: (s) => <span className="mono text-xs">{s.channel}</span>,
    },
    {
      key: "target",
      header: "Target",
      cell: (s) => <span className="mono text-xs text-muted-foreground">{s.target}</span>,
    },
    {
      key: "visible",
      header: "Visibility",
      cell: (s) => (
        <StatusBadge tone={s.visible ? "success" : "neutral"}>
          {s.visible ? "visible" : "hidden"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={supports}
        columns={columns}
        rowKey={(s) => s.id}
        rowActions={(s) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`support-edit-${s.id}`}
            disabled={!canEdit}
            onClick={() => setEditing(s)}
          >
            Edit
          </Button>
        )}
      />
      <SupportEntryForm
        entry={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateSupportEntryPoint(editing.id, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />
    </>
  );
}

function SupportEntryForm({
  entry,
  onClose,
  onSubmit,
}: {
  entry: SupportEntryPoint | null;
  onClose: () => void;
  onSubmit: (patch: Partial<SupportEntryPoint>, reason: string) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("");
  const [order, setOrder] = useState(1);
  const [visible, setVisible] = useState(true);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (entry) {
      setLabel(entry.label);
      setTarget(entry.target);
      setOrder(entry.order);
      setVisible(entry.visible);
      setReason("");
    }
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!entry}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={entry ? `Support entry — ${entry.label}` : ""}
      description="Public label, target, and visibility for the support entry point."
      submitLabel="Save"
      submitDisabled={!reasonOk}
      onSubmit={async () => {
        await onSubmit({ label, target, order, visible }, reason.trim());
        onClose();
      }}
      testId="support-entry-drawer"
    >
      <FormField label="Label">
        <Input data-testid="se-label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </FormField>
      <FormField label="Target">
        <Input data-testid="se-target" value={target} onChange={(e) => setTarget(e.target.value)} />
      </FormField>
      <FormField label="Order">
        <Input
          data-testid="se-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </FormField>
      <div className="flex items-center gap-2">
        <input
          id="se-visible"
          data-testid="se-visible"
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        <Label htmlFor="se-visible" className="text-xs">
          Visible on public surface
        </Label>
      </div>
      <FormField label="Reason (auditable, ≥ 6 chars)">
        <textarea
          data-testid="se-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </FormField>
    </FormDrawer>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function stateTone(s: PublicRouteState) {
  switch (s) {
    case "public":
      return "success" as const;
    case "authenticated":
      return "info" as const;
    case "hidden":
      return "neutral" as const;
    case "maintenance":
      return "warning" as const;
  }
}
function sevTone(s: "info" | "warning" | "critical") {
  return s === "critical"
    ? ("destructive" as const)
    : s === "warning"
      ? ("warning" as const)
      : ("info" as const);
}
