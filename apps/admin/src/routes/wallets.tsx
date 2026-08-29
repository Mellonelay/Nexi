import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
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
import type { WalletDomain, WalletRow, WalletStatus } from "@/admin/types";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/wallets")({ component: Page });

const DOMAINS: WalletDomain[] = ["overview", "spot", "option", "funding", "financial"];

function Page() {
  return (
    <RouteGuard permission="wallets.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const walletsQ = useAdminQuery((p) => p.listWallets());
  const ledgerQ = useAdminQuery((p) => p.listLedger());
  const depositsQ = useAdminQuery((p) => p.listDeposits());
  const withdrawalsQ = useAdminQuery((p) => p.listWithdrawals());

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const wallets = useMemo(() => walletsQ.data ?? [], [walletsQ.data]);
  const ledger = useMemo(() => ledgerQ.data ?? [], [ledgerQ.data]);
  const deposits = useMemo(() => depositsQ.data ?? [], [depositsQ.data]);
  const withdrawals = useMemo(() => withdrawalsQ.data ?? [], [withdrawalsQ.data]);

  const selected = useMemo(
    () => (selectedId ? (wallets.find((w) => w.id === selectedId) ?? null) : null),
    [wallets, selectedId],
  );

  const userOptions = useMemo(
    () =>
      Array.from(new Set(wallets.map((w) => w.userId)))
        .sort()
        .map((u) => ({ value: u, label: u })),
    [wallets],
  );
  const assetOptions = useMemo(
    () =>
      Array.from(new Set(wallets.map((w) => w.asset)))
        .sort()
        .map((a) => ({ value: a, label: a })),
    [wallets],
  );

  if (walletsQ.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (walletsQ.error)
    return (
      <Shell>
        <ErrorState title="Could not load wallets" description={walletsQ.error.message} />
      </Shell>
    );

  const totalValue = wallets
    .filter((w) => w.domain === "overview")
    .reduce((n, w) => n + Number(w.estimatedValue ?? 0), 0);

  const columns: DataTableColumn<WalletRow>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (w) => w.userId,
      cell: (w) => <span className="mono text-xs">{w.userId}</span>,
    },
    {
      key: "domain",
      header: "Domain",
      sortValue: (w) => w.domain,
      cell: (w) => (
        <StatusBadge tone={domainTone(w.domain)} dot={false}>
          {w.domain}
        </StatusBadge>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      sortValue: (w) => w.asset,
      cell: (w) => <span className="mono text-sm font-medium text-primary">{w.asset}</span>,
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      sortValue: (w) => Number(w.available),
      cell: (w) => <span className="mono text-xs">{w.available}</span>,
    },
    {
      key: "locked",
      header: "Locked",
      align: "right",
      sortValue: (w) => Number(w.locked),
      cell: (w) => <span className="mono text-xs">{w.locked}</span>,
    },
    {
      key: "estValue",
      header: "Est. value (USDT)",
      align: "right",
      sortValue: (w) => Number(w.estimatedValue ?? 0),
      cell: (w) => <span className="mono text-xs">{fmt(w.estimatedValue ?? "0")}</span>,
    },
    {
      key: "updated",
      header: "Last update",
      sortValue: (w) => w.updatedAt ?? "",
      cell: (w) => (
        <span className="mono text-[11px] text-muted-foreground">
          {w.updatedAt ? new Date(w.updatedAt).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (w) => w.status ?? "",
      cell: (w) => <StatusBadge tone={statusTone(w.status)}>{w.status ?? "active"}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<WalletRow>[] = [
    {
      key: "domain",
      label: "domain",
      options: DOMAINS.map((d) => ({ value: d, label: d })),
      match: (w, v) => w.domain === v,
    },
    { key: "user", label: "user", options: userOptions, match: (w, v) => w.userId === v },
    { key: "asset", label: "asset", options: assetOptions, match: (w, v) => w.asset === v },
    {
      key: "status",
      label: "status",
      options: [
        { value: "active", label: "Active" },
        { value: "frozen", label: "Frozen" },
        { value: "closed", label: "Closed" },
        { value: "maintenance", label: "Maintenance" },
      ],
      match: (w, v) => (w.status ?? "active") === v,
    },
  ];

  return (
    <Shell total={wallets.length} totalValue={totalValue}>
      <p className="text-xs text-muted-foreground">
        Wallets are read-only in the admin plane. Balance edits happen through governed workflows
        (deposits, withdrawals, reconciliation) — not through direct writes here.
      </p>
      <DataTable
        data={wallets}
        columns={columns}
        filters={filters}
        searchable={(w) => `${w.userId} ${w.asset} ${w.id} ${w.domain}`}
        searchPlaceholder="Search user, asset, wallet ID…"
        rowKey={(w) => w.id}
        onRowClick={(w) => setSelectedId(w.id)}
        rowActions={(w) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`wallet-inspect-${w.id}`}
            onClick={() => setSelectedId(w.id)}
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
              <Wallet className="h-4 w-4 text-primary" />
              <span className="mono text-primary">{selected.asset}</span>
              <span className="text-xs text-muted-foreground">· {selected.domain}</span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={selected ? `${selected.userId} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <>
              <StatusBadge tone={domainTone(selected.domain)} dot={false}>
                {selected.domain}
              </StatusBadge>
              <StatusBadge tone={statusTone(selected.status)}>
                {selected.status ?? "active"}
              </StatusBadge>
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "wallet",
                  title: "Wallet",
                  fields: [
                    { label: "Wallet ID", value: selected.id, mono: true },
                    { label: "User", value: selected.userId, mono: true },
                    { label: "Domain", value: selected.domain, mono: true },
                    { label: "Asset", value: selected.asset, mono: true },
                    { label: "Available", value: selected.available, mono: true },
                    { label: "Locked", value: selected.locked, mono: true },
                    {
                      label: "Estimated value (USDT)",
                      value: fmt(selected.estimatedValue ?? "0"),
                      mono: true,
                    },
                    {
                      label: "Last update",
                      value: selected.updatedAt
                        ? new Date(selected.updatedAt).toLocaleString()
                        : "—",
                      mono: true,
                    },
                    { label: "Status", value: selected.status ?? "active" },
                  ],
                },
                {
                  id: "ledger",
                  title: "Linked ledger entries",
                  content: (
                    <LinkedLedger
                      entries={ledger.filter(
                        (e) =>
                          e.userId === selected.userId &&
                          e.asset === selected.asset &&
                          (selected.domain === "overview" || e.domain === selected.domain),
                      )}
                    />
                  ),
                },
                {
                  id: "deposits",
                  title: "Related deposits",
                  content: (
                    <LinkedDeposits
                      deposits={deposits.filter(
                        (d) => d.userId === selected.userId && d.asset === selected.asset,
                      )}
                    />
                  ),
                },
                {
                  id: "withdrawals",
                  title: "Related withdrawals",
                  content: (
                    <LinkedWithdrawals
                      withdrawals={withdrawals.filter(
                        (w) => w.userId === selected.userId && w.asset === selected.asset,
                      )}
                    />
                  ),
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={15} />,
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
  totalValue,
}: {
  children: React.ReactNode;
  total?: number;
  totalValue?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wallets"
        description="Domains: Overview · Spot · Option · Funding · Financial. Inspect balances and linked activity. No direct balance-edit UI."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} rows
              </StatusBadge>
            ) : null}
            {totalValue !== undefined ? (
              <StatusBadge tone="primary" dot={false}>
                Overview aggregate ≈ {fmt(String(totalValue))} USDT
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function LinkedLedger({ entries }: { entries: import("@/admin/types").LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        No ledger entries linked to this wallet.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1.5">
      {entries.slice(0, 8).map((e) => (
        <li
          key={e.id}
          className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="mono text-primary">{e.id}</span>
            <span className="mono text-[10px] text-muted-foreground">
              {new Date(e.ts).toLocaleString()}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
            <StatusBadge tone={typeTone(e.type)} dot={false}>
              {e.type}
            </StatusBadge>
            <span className={amountClass(e.amount)}>
              {e.amount} {e.asset}
            </span>
            <span className="mono text-muted-foreground">ref {e.refId}</span>
          </div>
          {e.reason ? <p className="mt-1 text-[11px] text-muted-foreground">{e.reason}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function LinkedDeposits({ deposits }: { deposits: import("@/admin/types").Deposit[] }) {
  if (deposits.length === 0)
    return <p className="text-xs italic text-muted-foreground">No deposits.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {deposits.map((d) => (
        <li
          key={d.id}
          className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-primary">{d.id}</span>
            <StatusBadge tone="info" dot={false}>
              {d.status}
            </StatusBadge>
            <span className="mono">
              {d.amount} {d.asset}
            </span>
            <span className="mono text-muted-foreground">{d.network}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LinkedWithdrawals({ withdrawals }: { withdrawals: import("@/admin/types").Withdrawal[] }) {
  if (withdrawals.length === 0)
    return <p className="text-xs italic text-muted-foreground">No withdrawals.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {withdrawals.map((w) => (
        <li
          key={w.id}
          className="rounded-md border border-border/60 bg-background/40 px-3 py-2 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-primary">{w.id}</span>
            <StatusBadge tone="info" dot={false}>
              {w.status}
            </StatusBadge>
            <span className="mono">
              {w.amount} {w.asset}
            </span>
            <span className="mono text-muted-foreground">{w.network}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function domainTone(d: WalletDomain) {
  switch (d) {
    case "overview":
      return "primary" as const;
    case "spot":
      return "info" as const;
    case "option":
      return "warning" as const;
    case "funding":
      return "success" as const;
    case "financial":
      return "neutral" as const;
  }
}
function statusTone(s: WalletStatus | undefined) {
  switch (s) {
    case "frozen":
      return "destructive" as const;
    case "maintenance":
      return "warning" as const;
    case "closed":
      return "neutral" as const;
    default:
      return "success" as const;
  }
}
function typeTone(t: import("@/admin/types").LedgerOperationType) {
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
function amountClass(amount: string) {
  const positive = amount.startsWith("+");
  return `mono text-xs ${positive ? "text-success" : amount.startsWith("-") ? "text-destructive" : ""}`;
}
function fmt(v: string) {
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}
