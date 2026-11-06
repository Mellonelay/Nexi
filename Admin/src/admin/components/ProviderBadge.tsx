import { useAdminData } from "@/admin/data/context";
import { StatusBadge } from "@/admin/components/StatusBadge";

/**
 * Provider-state indicator for explicit local/demo mode.
 * Live API mode is the production default and is intentionally not shown.
 */
export function ProviderBadge() {
  const provider = useAdminData();
  if (provider.getAdminIdentity) return null;
  return <StatusBadge tone="warning">Local/demo data</StatusBadge>;
}
