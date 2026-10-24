import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({ component: RetiredSupportPage });

function RetiredSupportPage() {
  return (
    <RouteGuard permission="messages.view">
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Support tickets retired"
          description="Customer support now runs through the shared Messages conversation."
        />
        <section className="max-w-2xl rounded-lg border border-border p-5">
          <p className="text-sm text-muted-foreground">
            Existing ticket records are retained. Ticket creation, replies and lifecycle controls are no longer available here.
          </p>
          <Button asChild className="mt-4">
            <Link to="/messages">Open Messages</Link>
          </Button>
        </section>
      </div>
    </RouteGuard>
  );
}
