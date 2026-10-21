import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { AdminSessionProvider } from "@/admin/session/session";
import { AdminAuthGate } from "@/admin/session/AdminAuthGate";
import { AdminDataProviderScope, getConfiguredAdminProvider } from "@/admin/data/context";
import { AdminShell } from "@/admin/components/shell/AdminShell";
import { AdminDevtools } from "@/admin/devtools/AdminDevtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEXI Admin Control Plane" },
      {
        name: "description",
        content:
          "Internal administration console for the NEXI platform. Operator control plane; live mode uses the configured Admin API provider.",
      },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "NEXI Admin Control Plane" },
      {
        property: "og:description",
        content: "Internal administration console for the NEXI platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="dark bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const provider = getConfiguredAdminProvider();
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSessionProvider provider={provider}>
        <AdminDataProviderScope provider={provider}>
          <AdminAuthGate provider={provider}>
            <AdminShell>
              <Outlet />
            </AdminShell>
          </AdminAuthGate>
          <Toaster position="top-right" richColors />
          {import.meta.env.DEV && <AdminDevtools />}
        </AdminDataProviderScope>
      </AdminSessionProvider>
    </QueryClientProvider>
  );
}
