import { useEffect, useMemo, useState } from "react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useRouter } from "@tanstack/react-router";
import { AdminRuntimePanel } from "./AdminRuntimePanel";

export function AdminDevtools() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const plugins = useMemo(
    () => [
      { name: "TanStack Query", id: "tanstack-query", render: <ReactQueryDevtoolsPanel /> },
      {
        name: "TanStack Router",
        id: "tanstack-router",
        render: <TanStackRouterDevtoolsPanel router={router} />,
      },
      { name: "NEXI Admin Runtime", id: "nexi-admin-runtime", render: <AdminRuntimePanel /> },
    ],
    [router],
  );

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <TanStackDevtools
      config={{ position: "bottom-right", hideUntilHover: true }}
      plugins={plugins}
    />
  );
}
