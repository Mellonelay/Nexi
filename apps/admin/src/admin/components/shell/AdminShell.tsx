import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_GROUPS } from "@/admin/config/navigation";
import { useAdminSession } from "@/admin/session/session";
import { cn } from "@/lib/utils";
import { ROLE_LIST } from "@/admin/config/roles";
import { ENVIRONMENTS } from "@/admin/config/environments";
import { EnvironmentBadge } from "@/admin/components/EnvironmentBadge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Environment, RoleId } from "@/admin/types";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { can, environment, roleId } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-4 p-3">
      {NAV_GROUPS.map((g) => {
        const items = g.items.filter((i) => {
          if (!can(i.permission)) return false;
          if (i.sandboxOnly) {
            const ok =
              environment === "SANDBOX" &&
              (roleId === "sandbox_operator" || roleId === "super_admin");
            if (!ok) return false;
          }
          return true;
        });
        if (items.length === 0) return null;
        return (
          <div key={g.id} className="flex flex-col gap-1">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {g.label}
            </div>
            {items.map((i) => {
              const active =
                pathname === i.to || (i.to !== "/overview" && pathname.startsWith(i.to));
              const Icon = i.icon;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="truncate">{i.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function SessionControls() {
  const s = useAdminSession();
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/60 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Mock session
      </div>
      <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        Environment
        <select
          value={s.environment}
          onChange={(e) => s.setEnvironment(e.target.value as Environment)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          {ENVIRONMENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>
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
      <div className="mt-1 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-2 py-1.5 text-[10px] text-warning">
        <ShieldAlert className="h-3 w-3" />
        <span>Mock data. No backend connected.</span>
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
        className="hidden h-8 w-72 rounded-md border border-input bg-background px-3 text-sm text-foreground md:block"
      />
      <EnvironmentBadge env={s.environment} />
      <div className="hidden items-center gap-2 md:flex">
        <div className="text-right">
          <div className="text-xs font-medium text-foreground">{s.actorName}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Mock actor
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
                <button className="grid h-8 w-8 place-items-center rounded-md border border-border/60">
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
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
