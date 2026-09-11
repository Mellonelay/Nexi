import { useAdminData } from "@/admin/data/context";
import { StatusBadge } from "@/admin/components/StatusBadge";

/**
 * Provider-state badge.
 *
 * Renders a truthful label for the active AdminDataProvider. The live label
 * describes configured provider mode, not successful connectivity.
 *
 * The identity method is the live-provider boundary. This also keeps injected
 * live providers consistent with the session provider and avoids an
 * instanceof check that would misclassify test or embedded providers.
 */
export function ProviderBadge() {
  const provider = useAdminData();
  const isLive = Boolean(provider.getAdminIdentity);
  return isLive ? (
    <StatusBadge tone="info">Configured live Admin API</StatusBadge>
  ) : (
    <StatusBadge tone="warning">Local/demo data</StatusBadge>
  );
}
