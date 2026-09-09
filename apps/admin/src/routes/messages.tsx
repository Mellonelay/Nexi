import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { DataTable, type DataTableColumn } from "@/admin/components/DataTable";
import { useAdminQuery } from "@/admin/data/context";
import type { AdminMessage } from "@/admin/types";

export const Route = createFileRoute("/messages")({ component: Page });

function Page() {
  const q = useAdminQuery((p) => p.listMessages());
  if (q.loading) return <RouteGuard permission="messages.view"><LoadingSkeleton rows={6} /></RouteGuard>;
  if (q.error) return <RouteGuard permission="messages.view"><ErrorState title="Could not load messages" description={q.error.message} /></RouteGuard>;
  const columns: DataTableColumn<AdminMessage>[] = [
    { key: "created", header: "Created", sortValue: (m) => m.createdAt, cell: (m) => new Date(m.createdAt).toLocaleString() },
    { key: "sender", header: "Sender", sortValue: (m) => m.senderId, cell: (m) => <span className="mono text-xs">{m.senderId}</span> },
    { key: "recipient", header: "Recipient", sortValue: (m) => m.recipientId, cell: (m) => <span className="mono text-xs">{m.recipientId}</span> },
    { key: "state", header: "Delivery", cell: (m) => <StatusBadge tone="info">{m.deliveryState}</StatusBadge> },
    { key: "body", header: "Message", cell: (m) => <span className="line-clamp-2">{m.body}</span> },
  ];
  return (
    <RouteGuard permission="messages.view">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Messages"
          description="Direct messaging with users."
          badges={
            <>
              <StatusBadge tone="success">Live API</StatusBadge>
            </>
          }
        />
        <DataTable data={q.data ?? []} columns={columns} rowKey={(m) => m.id} searchable={(m) => `${m.senderId} ${m.recipientId} ${m.body}`} searchPlaceholder="Search messages…" />
      </div>
    </RouteGuard>
  );
}
