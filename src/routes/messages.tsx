import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { EmptyState } from "@/admin/components/states";

export const Route = createFileRoute("/messages")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="messages.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Messages"
          description="Direct messaging with users."
          badges={
            <>
              <StatusBadge tone="warning">Mock data</StatusBadge>
              <StatusBadge tone="info">Structural</StatusBadge>
            </>
          }
        />
        <EmptyState
          title="Structural page"
          description="This route ships with shell, permission gating, and shared components. Deeper mock workflows land in the next iteration."
        />
      </div>
    </RouteGuard>
  );
}
