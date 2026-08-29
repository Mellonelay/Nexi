import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { EmptyState } from "@/admin/components/states";

export const Route = createFileRoute("/learn")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="learn.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Learn Content"
          description="Learn modules with localization workflow."
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
