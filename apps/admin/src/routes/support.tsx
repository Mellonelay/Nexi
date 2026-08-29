import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { EmptyState } from "@/admin/components/states";

export const Route = createFileRoute("/support")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="support.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Support"
          description="Ticket queues, priorities, assignment, and replies."
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
