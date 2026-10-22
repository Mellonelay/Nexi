import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_GROUPS } from "@/admin/config/navigation";
import { useAdminSession } from "@/admin/session/session";
import { cn } from "@/lib/utils";
import { ROLE_LIST } from "@/admin/config/roles";
import { EnvironmentBadge } from "@/admin/components/EnvironmentBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { useAdminData } from "@/admin/data/context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { useState } from "react";
import type { RoleId } from "@/admin/types";

function routeMatches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((i) => {
          if (!can(i.permission)) return false;
          return true;
        });
        if (items.length === 0) return null;
        const primary = items.find((item) => item.to === g.primary) ?? items[0];
        const active = items.some((item) => routeMatches(pathname, item.to));
        return (
          <Link
            key={g.id}
            to={primary.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
            )}
          >
            <primary.icon
              className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
            />
            <span className="truncate">{g.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ContextualNavigation() {
  const { can } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as { view?: string } });
  const group = NAV_GROUPS.find((item) =>
    item.items.some((route) => routeMatches(pathname, route.to)),
  );
  if (!group) return null;
  const items = group.items.filter((item) => can(item.permission));
  if (items.length < 2) return null;

  return (
    <nav
      aria-label={`${group.label} sections`}
      className="flex min-w-0 gap-1 overflow-x-auto border-b border-border/60 px-4 py-2 lg:px-6"
    >
      {items.map((item) => (
        <Fragment key={item.to}>
          <ContextualRouteLink item={item} pathname={pathname} view={search.view} />
          {item.to === "/settlements" ? (
            <BinarySettingsLink
              trading={group.id === "trading"}
              active={pathname === "/binary" && search.view === "pairs"}
            />
          ) : null}
        </Fragment>
      ))}
    </nav>
  );
}

function ContextualRouteLink({
  item,
  pathname,
  view,
}: {
  item: (typeof NAV_GROUPS)[number]["items"][number];
  pathname: string;
  view?: string;
}) {
  if (item.to === "/binary") {
    const active = pathname === "/binary" && view !== "pairs";
    return (
      <Link
        to="/binary"
        search={{}}
        aria-current={active ? "page" : undefined}
        className={navClass(active)}
      >
        {item.label}
      </Link>
    );
  }
  const active = routeMatches(pathname, item.to);
  return (
    <Link to={item.to} aria-current={active ? "page" : undefined} className={navClass(active)}>
      {item.label}
    </Link>
  );
}

function BinarySettingsLink({ trading, active }: { trading: boolean; active: boolean }) {
  const { can } = useAdminSession();
  if (!trading || !can("binary.view")) return null;
  return (
    <Link
      to="/binary"
      search={{ view: "pairs" }}
      aria-current={active ? "page" : undefined}
      className={navClass(active)}
    >
      Binary Settings
    </Link>
  );
}

function navClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors",
    active
      ? "bg-primary/15 font-medium text-primary"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

function SessionControls() {
  const s = useAdminSession();
  const provider = useAdminData();
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/60 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Session
      </div>
      {provider.getAdminIdentity ? (
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Role
          <div className="flex h-8 items-center rounded-md border border-input bg-background px-2 text-sm text-foreground">
            {s.roleLabel}
          </div>
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Role
          <select
            value={s.roleId}
            onChange={(e) => s.setRoleId(e.target.value as RoleId)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          >
            {ROLE_LIST.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div
        className={cn(
          "mt-1 flex items-center gap-2 rounded-md border px-2 py-1.5 text-[10px]",
          s.identityStatus === "ready"
            ? "border-success/40 bg-success/10 text-success"
            : "border-warning/40 bg-warning/10 text-warning",
        )}
        role="status"
        aria-live="polite"
      >
        <ShieldAlert className="h-3 w-3" />
        <span>
          {s.identityStatus === "ready"
            ? "Admin API connected; your identity and permissions are confirmed by the server."
            : s.identityStatus === "loading"
              ? "Checking Admin API connection and access…"
              : s.identityStatus === "unavailable"
                ? "Admin API identity is unavailable; protected actions remain disabled."
                : "Local/demo mode; no live Admin API identity is connected."}
        </span>
      </div>
      <div className="mt-1">
        <ProviderBadge />
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar lg:flex">
      <div className="flex items-center gap-2 border-b border-sidebar-border/60 px-4 py-3">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-black">
          N
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">NEXI Admin</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Control Plane
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavList />
      </div>
      <SessionControls />
    </aside>
  );
}

function TopBar({ mobileNav }: { mobileNav: ReactNode }) {
  const s = useAdminSession();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const crumbs = pathname.split("/").filter(Boolean);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 px-3 backdrop-blur">
      <div className="lg:hidden">{mobileNav}</div>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground/80">Admin</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            <span
              className={cn(i === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground")}
            >
              {c}
            </span>
          </span>
        ))}
      </div>
      <input
        placeholder="Search users, tickets, orders…"
        aria-label="Search admin records"
        className="hidden h-8 w-72 rounded-md border border-input bg-background px-3 text-sm text-foreground md:block"
      />
      <EnvironmentBadge env={s.environment} />
      <div className="hidden items-center gap-2 md:flex">
        <div className="text-right">
          <div className="text-xs font-medium text-foreground">{s.actorName}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {s.identityStatus === "local"
              ? "local operator"
              : s.identityStatus === "loading"
                ? "loading identity"
                : s.identityStatus === "ready"
                  ? "authenticated"
                  : "identity unavailable"}
          </div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {s.actorName.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dark flex min-h-screen w-full bg-background text-foreground">
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          mobileNav={
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open admin navigation"
                  className="grid h-8 w-8 place-items-center rounded-md border border-border/60"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <div className="flex h-full flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <NavList onNavigate={() => setOpen(false)} />
                  </div>
                  <SessionControls />
                </div>
              </SheetContent>
            </Sheet>
          }
        />
        <ContextualNavigation />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
