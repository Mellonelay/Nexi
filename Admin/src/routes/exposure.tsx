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
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminQuery } from "@/admin/data/context";
import { Button } from "@/components/ui/button";
import type { ExposureRow, ExposureStatus } from "@/admin/types";

export const Route = createFileRoute("/exposure")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="exposure.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const q = useAdminQuery((p) => p.listExposure());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => q.data ?? [], [q.data]);
  const selected = useMemo(
    () => (selectedId ? (rows.find((r) => r.id === selectedId) ?? null) : null),
    [rows, selectedId],
  );

  if (q.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (q.error)
    return (
      <Shell>
        <ErrorState title="Could not load exposure" description={q.error.message} />
      </Shell>
    );

  const completeExposureData =
    rows.length > 0 &&
    rows.every(
      (row) =>
        Number.isFinite(Number(row.used)) &&
        Number.isFinite(Number(row.cap)) &&
        Number(row.cap) > 0,
    );
  const global = completeExposureData
    ? rows.reduce(
        (acc, row) => ({ used: acc.used + Number(row.used), cap: acc.cap + Number(row.cap) }),
        { used: 0, cap: 0 },
      )
    : null;
  const globalUtil = global ? global.used / global.cap : null;
  const globalStatus: ExposureStatus =
    globalUtil === null
      ? "unavailable"
      : globalUtil >= 0.9
        ? "over_limit"
        : globalUtil >= 0.7
          ? "warning"
          : "ok";

  const warningCount = rows.filter((r) => r.status === "warning").length;
  const overCount = rows.filter((r) => r.status === "over_limit").length;

  const columns: DataTableColumn<ExposureRow>[] = [
    {
      key: "pair",
      header: "Pair",
      sortValue: (r) => r.pair,
      cell: (r) => <span className="mono text-sm font-medium text-primary">{r.pair}</span>,
    },
    {
      key: "product",
      header: "Product",
      sortValue: (r) => r.product,
      cell: (r) => (
        <StatusBadge tone={r.product === "spot" ? "info" : "primary"} dot={false}>
          {r.product}
        </StatusBadge>
      ),
    },
    {
      key: "used",
      header: "Used",
      align: "right",
      sortValue: (r) => Number(r.used),
      cell: (r) => <span className="mono text-xs">{fmt(r.used)}</span>,
    },
    {
      key: "cap",
      header: "Cap",
      align: "right",
      sortValue: (r) => Number(r.cap),
      cell: (r) => <span className="mono text-xs">{fmt(r.cap)}</span>,
    },
    {
      key: "util",
      header: "Utilisation",
      align: "right",
      sortValue: (r) => r.utilisation,
      cell: (r) => (
        <div className="flex min-w-32 flex-col items-end gap-1">
          <span className={utilClass(r.status)}>
            {r.status === "unavailable" ? "Unavailable" : `${Math.round(r.utilisation * 100)}%`}
          </span>
          {r.status !== "unavailable" ? (
            <div className="h-1.5 w-full rounded bg-muted/40">
              <div
                className={barClass(r.status)}
                style={{ width: `${Math.min(100, Math.round(r.utilisation * 100))}%` }}
              />
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge tone={statusTone(r.status)}>{label(r.status)}</StatusBadge>,
    },
  ];

  const filters: DataTableFilter<ExposureRow>[] = [
    {
      key: "product",
      label: "product",
      options: [
        { value: "spot", label: "Spot" },
        { value: "binary", label: "Binary" },
      ],
      match: (r, v) => r.product === v,
    },
    {
      key: "status",
      label: "status",
      options: [
        { value: "ok", label: "OK" },
        { value: "warning", label: "Warning" },
        { value: "over_limit", label: "Over limit" },
      ],
      match: (r, v) => r.status === v,
    },
  ];

  return (
    <Shell total={rows.length} warning={warningCount} over={overCount}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Global utilisation"
          value={globalUtil === null ? "Unavailable" : `${Math.round(globalUtil * 100)}%`}
          tone={
            globalStatus === "unavailable"
              ? "info"
              : globalStatus === "over_limit"
                ? "destructive"
                : globalStatus === "warning"
                  ? "warning"
                  : "success"
          }
        />
        <SummaryCard label="Used" value={global ? fmt(global.used) : "Unavailable"} />
        <SummaryCard label="Cap" value={global ? fmt(global.cap) : "Unavailable"} />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchable={(r) => `${r.pair} ${r.product}`}
        searchPlaceholder="Search pair or product…"
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelectedId(r.id)}
        rowActions={(r) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`exp-inspect-${r.id}`}
            onClick={() => setSelectedId(r.id)}
          >
            Drill down
          </Button>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.pair}</span> : ""}
        subtitle={selected ? `${selected.product} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <StatusBadge tone={statusTone(selected.status)}>{label(selected.status)}</StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "exposure",
                  title: "Exposure",
                  fields: [
                    { label: "Product", value: selected.product, mono: true },
                    { label: "Used", value: fmt(selected.used), mono: true },
                    { label: "Cap", value: fmt(selected.cap), mono: true },
                    {
                      label: "Utilisation",
                      value: `${Math.round(selected.utilisation * 100)}%`,
                      mono: true,
                    },
                    { label: "Status", value: label(selected.status), mono: true },
                  ],
                },
                {
                  id: "notes",
                  title: "Guidance",
                  content: (
                    <p className="text-xs text-muted-foreground">
                      {selected.status === "unavailable"
                        ? "Exposure limits are not available for this pair; its risk cannot be assessed here."
                        : selected.status === "over_limit"
                          ? "Utilisation is at or above the configured cap. Pause new orders/positions on this pair and hedge or de-risk before accepting more flow."
                          : selected.status === "warning"
                            ? "Utilisation is approaching the cap. Notify Market Operator on-call and prepare fallback rules."
                            : "Utilisation is within nominal range."}
                    </p>
                  ),
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
  warning,
  over,
}: {
  children: React.ReactNode;
  total?: number;
  warning?: number;
  over?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trading Risk"
        description="Pair-level and global exposure across Spot and Binary. Warning and limit states drive maintenance decisions."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} pairs
              </StatusBadge>
            ) : null}
            {warning ? (
              <StatusBadge tone="warning" dot={false}>
                {warning} warning
              </StatusBadge>
            ) : null}
            {over ? (
              <StatusBadge tone="destructive" dot={false}>
                {over} over limit
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "info" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="surface-1 flex flex-col gap-1 rounded-lg border border-border/60 p-4">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mono text-2xl ${toneClass}`}>{value}</span>
    </div>
  );
}

function statusTone(s: ExposureStatus) {
  return s === "unavailable"
    ? ("neutral" as const)
    : s === "over_limit"
      ? ("destructive" as const)
      : s === "warning"
        ? ("warning" as const)
        : ("success" as const);
}
function utilClass(s: ExposureStatus) {
  return s === "unavailable"
    ? "text-xs text-muted-foreground"
    : s === "over_limit"
      ? "mono text-xs text-destructive"
      : s === "warning"
        ? "mono text-xs text-warning"
        : "mono text-xs text-foreground";
}
function barClass(s: ExposureStatus) {
  return `h-full rounded ${s === "over_limit" ? "bg-destructive" : s === "warning" ? "bg-warning" : "bg-success"}`;
}
function label(s: ExposureStatus) {
  return s === "over_limit" ? "over limit" : s === "unavailable" ? "unavailable" : s;
}
function fmt(v: string | number) {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "Unavailable";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
