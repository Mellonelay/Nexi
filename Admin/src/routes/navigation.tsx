import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { NavItem, NavAudience, NavSurface } from "@/admin/types";

export const Route = createFileRoute("/navigation")({ component: Page });

const AUDIENCES: NavAudience[] = ["public", "authenticated", "vip", "internal"];

function Page() {
  return (
    <RouteGuard permission="navigation.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const navQ = useAdminQuery((p) => p.listNavItems());

  if (navQ.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (navQ.error)
    return (
      <Shell>
        <ErrorState title="Could not load navigation" description={navQ.error.message} />
      </Shell>
    );

  const items = navQ.data ?? [];
  return (
    <Shell total={items.length}>
      <Tabs defaultValue="bottom">
        <TabsList className="mb-4">
          <TabsTrigger value="bottom" data-testid="nav-tab-bottom">
            Bottom navigation
          </TabsTrigger>
          <TabsTrigger value="drawer" data-testid="nav-tab-drawer">
            Left drawer
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="nav-tab-audit">
            Audit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bottom">
          <SurfaceEditor
            surface="bottom"
            items={items.filter((i) => i.surface === "bottom")}
            key={`b-${navQ.data?.length ?? 0}`}
          />
        </TabsContent>
        <TabsContent value="drawer">
          <SurfaceEditor
            surface="drawer"
            items={items.filter((i) => i.surface === "drawer")}
            key={`d-${navQ.data?.length ?? 0}`}
          />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTimeline actionPrefix="navigation." limit={40} />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({ children, total }: { children: React.ReactNode; total?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Public Navigation Settings"
        description="Public navigation currently uses built-in menus. Admin overrides shown here are not currently applied by the Public app."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} items
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function SurfaceEditor({ surface, items }: { surface: NavSurface; items: NavItem[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("navigation.edit");

  const [staged, setStaged] = useState<NavItem[]>([]);
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    setStaged(
      [...items].sort((a, b) => a.order - b.order).map((i, idx) => ({ ...i, order: idx + 1 })),
    );
  }, [items]);

  const dirty = useMemo(
    () =>
      JSON.stringify(staged) !==
      JSON.stringify(
        [...items].sort((a, b) => a.order - b.order).map((i, idx) => ({ ...i, order: idx + 1 })),
      ),
    [staged, items],
  );

  function move(id: string, dir: -1 | 1) {
    setStaged((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((it, i) => ({ ...it, order: i + 1 }));
    });
  }
  function toggleVisibility(id: string) {
    setStaged((prev) => prev.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i)));
  }
  function setAudience(id: string, audience: NavAudience) {
    setStaged((prev) => prev.map((i) => (i.id === id ? { ...i, audience } : i)));
  }
  function revert() {
    setStaged(
      [...items].sort((a, b) => a.order - b.order).map((i, idx) => ({ ...i, order: idx + 1 })),
    );
  }

  if (staged.length === 0) {
    return (
      <EmptyState
        title="No Admin overrides"
        description={`The ${surface} Public menu still uses its built-in items; an empty override list does not mean the menu is empty.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
        <div className="text-xs text-muted-foreground">
          {dirty ? (
            <span className="text-warning">You have unsaved changes.</span>
          ) : (
            <span>All changes saved.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid={`nav-revert-${surface}`}
            disabled={!dirty}
            onClick={revert}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Revert
          </Button>
          <Button
            size="sm"
            data-testid={`nav-save-${surface}`}
            disabled={!canEdit || !dirty}
            onClick={() => setConfirmSave(true)}
          >
            Save {surface}
          </Button>
        </div>
      </div>

      <ol className="flex flex-col gap-2" data-testid={`nav-list-${surface}`}>
        {staged.map((it, idx) => (
          <li
            key={it.id}
            className="surface-1 flex flex-wrap items-center gap-2 rounded-md border border-border/60 p-3"
            data-testid={`nav-item-${it.id}`}
          >
            <span className="mono w-6 text-center text-xs text-muted-foreground">{it.order}</span>
            <div className="flex min-w-[200px] flex-1 flex-col leading-tight">
              <span className="text-sm font-medium">{it.label}</span>
              <span className="mono text-[11px] text-muted-foreground">{it.target}</span>
            </div>
            <select
              value={it.audience}
              aria-label={`Audience for ${it.label}`}
              onChange={(e) => setAudience(it.id, e.target.value as NavAudience)}
              disabled={!canEdit}
              data-testid={`nav-audience-${it.id}`}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <Button
              variant={it.visible ? "outline" : "default"}
              size="sm"
              disabled={!canEdit}
              onClick={() => toggleVisibility(it.id)}
              data-testid={`nav-visible-${it.id}`}
            >
              {it.visible ? (
                <>
                  <Eye className="mr-1 h-3.5 w-3.5" /> visible
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> hidden
                </>
              )}
            </Button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                data-testid={`nav-up-${it.id}`}
                aria-label={`Move ${it.label} up`}
                disabled={!canEdit || idx === 0}
                onClick={() => move(it.id, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`nav-down-${it.id}`}
                aria-label={`Move ${it.label} down`}
                disabled={!canEdit || idx === staged.length - 1}
                onClick={() => move(it.id, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      {confirmSave ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setConfirmSave(false);
          }}
          title={`Save ${surface} navigation`}
          description="Publishes the staged layout to the corresponding public surface."
          target={<span>{surface === "bottom" ? "Bottom navigation" : "Left drawer"}</span>}
          targetId={`nav:${surface}`}
          action="navigation.update"
          permission="navigation.edit"
          currentState={<span className="text-xs text-muted-foreground">Persisted layout</span>}
          proposedState={
            <span className="text-xs text-primary">
              {staged.length} items · {staged.filter((i) => i.visible).length} visible
            </span>
          }
          submitLabel={`Save ${surface}`}
          successMessage="Navigation updated"
          onConfirm={(reason) =>
            provider.updateNavItems(surface, staged, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setConfirmSave(false)}
        />
      ) : null}
    </div>
  );
}
