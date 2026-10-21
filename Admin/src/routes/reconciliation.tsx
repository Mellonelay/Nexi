import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";

export const Route = createFileRoute("/reconciliation")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="reconciliation.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Financial Reconciliation"
          description="This view is unavailable because no canonical reconciliation record set is configured."
          badges={
            <>
              <ProviderBadge />
              <StatusBadge tone="warning">Unavailable</StatusBadge>
            </>
          }
        />
        <section
          className="surface-1 rounded-lg border border-border/60 p-4 text-sm text-muted-foreground"
          role="status"
        >
          No durable reconciliation projection is available. No financial records were loaded or
          changed.
        </section>
      </div>
    </RouteGuard>
  );
}
