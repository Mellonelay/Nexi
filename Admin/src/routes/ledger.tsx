import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { DetailDrawer } from "@/admin/components/DetailDrawer";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminQuery } from "@/admin/data/context";
import { Button } from "@/components/ui/button";
import type { LedgerEntry, LedgerOperationType, LedgerStatus, WalletDomain } from "@/admin/types";
import { BookText } from "lucide-react";

export const Route = createFileRoute("/ledger")({ component: Page });

const OP_TYPES: LedgerOperationType[] = [
  "deposit",
  "withdrawal",
  "trade",
  "settlement",
  "adjustment",
  "fee",
  "reward",
];
const DOMAINS: WalletDomain[] = ["overview", "spot", "option", "funding", "financial"];

function Page() {
  return (
    <RouteGuard permission="ledger.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const q = useAdminQuery((p) => p.listLedger());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = useMemo(() => q.data ?? [], [q.data]);
  const selected = useMemo(
    () => (selectedId ? (entries.find((e) => e.id === selectedId) ?? null) : null),
    [entries, selectedId],
  );

  // Must be called unconditionally before any early return (Rules of Hooks).
  const userOptions = useMemoUsers(entries);
  const assetOptions = useMemoAssets(entries);

  if (q.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (q.error)
    return (
      <Shell>
        <ErrorState title="Could not load ledger" description={q.error.message} />
      </Shell>
    );

  const columns: DataTableColumn<LedgerEntry>[] = [
    {
      key: "id",
      header: "Entry",
      sortValue: (e) => e.id,
      cell: (e) => <span className="mono text-xs text-muted-foreground">{e.id}</span>,
    },
    {
      key: "ts",
      header: "Timestamp",
      sortValue: (e) => e.ts,
      cell: (e) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(e.ts).toLocaleString()}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      sortValue: (e) => e.userId ?? "",
      cell: (e) =>
        e.userId ? (
          <span className="mono text-xs">{e.userId}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">system</span>
        ),
    },
    {
      key: "domain",
      header: "Domain",
      sortValue: (e) => e.domain,
      cell: (e) => (
        <StatusBadge tone="info" dot={false}>
          {e.domain}
        </StatusBadge>
      ),
    },
    { key: "asset", header: "Asset", cell: (e) => <span className="mono text-sm">{e.asset}</span> },
    {
      key: "type",
      header: "Type",
      cell: (e) => (
        <StatusBadge tone={typeTone(e.type)} dot={false}>
          {e.type}
        </StatusBadge>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      align: "right",
      cell: (e) =>
        e.debit && Number(e.debit) > 0 ? (
          <span className="mono text-xs text-destructive">{e.debit}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "credit",
      header: "Credit",
      align: "right",
      cell: (e) =>
        e.credit && Number(e.credit) > 0 ? (
          <span className="mono text-xs text-success">{e.credit}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (e) =>
        e.balance ? (
          <span className="mono text-xs">{e.balance}</span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: "ref",
      header: "Ref",
      cell: (e) => <span className="mono text-xs text-primary">{e.refId}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (e) => e.status ?? "",
      cell: (e) => <StatusBadge tone={statusTone(e.status)}>{e.status ?? "posted"}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<LedgerEntry>[] = [
    {
      key: "domain",
      label: "domain",
      options: DOMAINS.map((d) => ({ value: d, label: d })),
      match: (e, v) => e.domain === v,
    },
    { key: "user", label: "user", options: userOptions, match: (e, v) => e.userId === v },
    { key: "asset", label: "asset", options: assetOptions, match: (e, v) => e.asset === v },
    {
      key: "type",
      label: "operation",
      options: OP_TYPES.map((t) => ({ value: t, label: t })),
      match: (e, v) => e.type === v,
    },
    {
      key: "status",
      label: "status",
      options: [
        { value: "posted", label: "Posted" },
        { value: "pending", label: "Pending" },
        { value: "reversed", label: "Reversed" },
      ],
      match: (e, v) => (e.status ?? "posted") === v,
    },
  ];

  const pending = entries.filter((e) => e.status === "pending").length;
  const reversed = entries.filter((e) => e.status === "reversed").length;

  return (
    <Shell total={entries.length} pending={pending} reversed={reversed}>
      <p className="text-xs text-muted-foreground">
        <span className="mono text-primary">Append-only:</span> ledger history cannot be edited from
        this route. Corrections are posted as new adjustment entries via governed workflows.
      </p>
      <DataTable
        data={entries}
        columns={columns}
        filters={filters}
        searchable={(e) => `${e.id} ${e.userId ?? ""} ${e.asset} ${e.refId} ${e.type}`}
        searchPlaceholder="Search entry, user, ref, type…"
        rowKey={(e) => e.id}
        onRowClick={(e) => setSelectedId(e.id)}
        rowActions={(e) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`ledger-inspect-${e.id}`}
            onClick={() => setSelectedId(e.id)}
          >
            Inspect
          </Button>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={
          selected ? (
            <span className="flex items-center gap-2">
              <BookText className="h-4 w-4 text-primary" />
              <span className="mono text-primary">{selected.id}</span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={
          selected ? `${selected.type} · ${selected.asset} · ref ${selected.refId}` : undefined
        }
        badges={
          selected ? (
            <>
              <StatusBadge tone={typeTone(selected.type)} dot={false}>
                {selected.type}
              </StatusBadge>
              <StatusBadge tone={statusTone(selected.status)}>
                {selected.status ?? "posted"}
              </StatusBadge>
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "posting",
                  title: "Posting",
                  fields: [
                    { label: "Entry ID", value: selected.id, mono: true },
                    {
                      label: "Timestamp",
                      value: new Date(selected.ts).toLocaleString(),
                      mono: true,
                    },
                    { label: "User", value: selected.userId ?? "system", mono: true },
                    { label: "Domain", value: selected.domain, mono: true },
                    { label: "Asset", value: selected.asset, mono: true },
                    { label: "Operation type", value: selected.type, mono: true },
                    { label: "Amount", value: selected.amount, mono: true },
                    { label: "Debit", value: selected.debit ?? "—", mono: true },
                    { label: "Credit", value: selected.credit ?? "—", mono: true },
                    { label: "Resulting balance", value: selected.balance ?? "—", mono: true },
                    { label: "Linked ref", value: selected.refId, mono: true },
                    { label: "Status", value: selected.status ?? "posted", mono: true },
                  ],
                },
                {
                  id: "reason",
                  title: "Reason & note",
                  content: (
                    <div className="flex flex-col gap-2 text-sm">
                      {selected.reason ? (
                        <div className="rounded-md border border-border/60 bg-background/40 p-3">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Reason
                          </div>
                          <div>{selected.reason}</div>
                        </div>
                      ) : null}
                      {selected.note ? (
                        <div className="rounded-md border border-border/60 bg-background/40 p-3">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Note
                          </div>
                          <div>{selected.note}</div>
                        </div>
                      ) : null}
                      {!selected.reason && !selected.note ? (
                        <p className="text-xs italic text-muted-foreground">
                          No reason or note recorded.
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  id: "audit",
                  title: "Audit linkage",
                  content: <AuditTimeline targetId={selected.refId} heading="" limit={10} />,
                },
              ]
            : []
        }
      />
    </Shell>
  );
}

function Shell({
  children,
  total,
  pending,
  reversed,
}: {
  children: React.ReactNode;
  total?: number;
  pending?: number;
  reversed?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ledger"
        description="Debit/credit postings across all wallet domains, linked to source records. Append-only."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} entries
              </StatusBadge>
            ) : null}
            {pending ? (
              <StatusBadge tone="warning" dot={false}>
                {pending} pending
              </StatusBadge>
            ) : null}
            {reversed ? (
              <StatusBadge tone="destructive" dot={false}>
                {reversed} reversed
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function useMemoUsers(entries: LedgerEntry[]) {
  return useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.userId).filter(Boolean) as string[]))
        .sort()
        .map((u) => ({ value: u, label: u })),
    [entries],
  );
}
function useMemoAssets(entries: LedgerEntry[]) {
  return useMemo(
    () =>
      Array.from(new Set(entries.map((e) => e.asset)))
        .sort()
        .map((a) => ({ value: a, label: a })),
    [entries],
  );
}
function typeTone(t: LedgerOperationType) {
  switch (t) {
    case "deposit":
      return "success" as const;
    case "reward":
      return "success" as const;
    case "trade":
      return "info" as const;
    case "settlement":
      return "primary" as const;
    case "withdrawal":
      return "destructive" as const;
    case "fee":
      return "warning" as const;
    case "adjustment":
      return "warning" as const;
  }
}
function statusTone(s: LedgerStatus | undefined) {
  switch (s) {
    case "reversed":
      return "destructive" as const;
    case "pending":
      return "warning" as const;
    default:
      return "success" as const;
  }
}
