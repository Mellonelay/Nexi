import { UnauthorizedState } from "@/admin/components/states";
import { useAdminSession } from "@/admin/session/session";
import type { Permission } from "@/admin/types";
import type { ReactNode } from "react";

export function RouteGuard({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAdminSession();
  if (!can(permission)) return <UnauthorizedState requiredPermission={permission} />;
  return <>{children}</>;
}
