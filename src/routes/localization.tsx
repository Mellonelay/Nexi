import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { RouteGuard } from "@/admin/components/RouteGuard";
import { StatusBadge } from "@/admin/components/StatusBadge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/admin/components/DataTable";
import { FormDrawer } from "@/admin/components/FormDrawer";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Locale, TranslationKey } from "@/admin/types";
import { LOCALE_LABELS, LOCALES } from "@/admin/types";
import { Languages } from "lucide-react";

export const Route = createFileRoute("/localization")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="localization.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const q = useAdminQuery((p) => p.listTranslationKeys());
  const [editing, setEditing] = useState<TranslationKey | null>(null);

  const keys = useMemo(() => q.data ?? [], [q.data]);
  const nsOptions = useMemo(
    () =>
      Array.from(new Set(keys.map((k) => k.namespace)))
        .sort()
        .map((n) => ({ value: n, label: n })),
    [keys],
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
        <ErrorState title="Could not load translations" description={q.error.message} />
      </Shell>
    );

  const missingCount = keys.reduce((n, k) => n + LOCALES.filter((l) => !k.values[l]).length, 0);
  const totalSlots = keys.length * LOCALES.length;
  const coverage = totalSlots > 0 ? Math.round((1 - missingCount / totalSlots) * 100) : 100;

  const columns: DataTableColumn<TranslationKey>[] = [
    {
      key: "namespace",
      header: "Namespace",
      sortValue: (k) => k.namespace,
      cell: (k) => <span className="mono text-xs text-primary">{k.namespace}</span>,
    },
    {
      key: "key",
      header: "Key",
      sortValue: (k) => k.key,
      cell: (k) => <span className="mono text-xs">{k.key}</span>,
    },
    {
      key: "default",
      header: "Default value",
      sortValue: (k) => k.defaultValue,
      cell: (k) => <span className="text-sm">{k.defaultValue}</span>,
    },
    {
      key: "coverage",
      header: "Coverage",
      align: "right",
      sortValue: (k) => LOCALES.filter((l) => k.values[l]).length,
      cell: (k) => {
        const present = LOCALES.filter((l) => k.values[l]).length;
        return (
          <span
            className={
              present === LOCALES.length ? "mono text-xs text-success" : "mono text-xs text-warning"
            }
          >
            {present}/{LOCALES.length}
          </span>
        );
      },
    },
    {
      key: "missing",
      header: "Missing",
      cell: (k) => {
        const missing = LOCALES.filter((l) => !k.values[l]);
        if (missing.length === 0) {
          return (
            <StatusBadge tone="success" dot={false}>
              complete
            </StatusBadge>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {missing.map((l) => (
              <StatusBadge key={l} tone="warning" dot={false}>
                {l}
              </StatusBadge>
            ))}
          </div>
        );
      },
    },
    {
      key: "editor",
      header: "Editor",
      sortValue: (k) => k.editor ?? "",
      cell: (k) =>
        k.editor ? (
          <span className="text-xs">{k.editor}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "updated",
      header: "Updated",
      sortValue: (k) => k.updatedAt,
      cell: (k) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(k.updatedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  const filters: DataTableFilter<TranslationKey>[] = [
    { key: "ns", label: "namespace", options: nsOptions, match: (k, v) => k.namespace === v },
    {
      key: "coverage",
      label: "coverage",
      options: [
        { value: "complete", label: "Complete" },
        { value: "partial", label: "Partial" },
        { value: "missing_all", label: "Empty" },
      ],
      match: (k, v) => {
        const present = LOCALES.filter((l) => k.values[l]).length;
        if (v === "complete") return present === LOCALES.length;
        if (v === "partial") return present > 0 && present < LOCALES.length;
        return present === 0;
      },
    },
  ];

  return (
    <Shell total={keys.length} coverage={coverage} missing={missingCount}>
      <p className="text-xs text-muted-foreground">
        <span className="mono text-warning">Rule:</span> never translate asset symbols or pair
        identifiers (BTC, USDT, BTC/USDT, …).
      </p>
      <DataTable
        data={keys}
        columns={columns}
        filters={filters}
        searchable={(k) => `${k.namespace} ${k.key} ${k.defaultValue}`}
        searchPlaceholder="Search namespace, key, default value…"
        rowKey={(k) => k.id}
        onRowClick={(k) => setEditing(k)}
        rowActions={(k) => (
          <Button
            variant="outline"
            size="sm"
            data-testid={`tr-edit-${k.id}`}
            onClick={() => setEditing(k)}
          >
            Translate
          </Button>
        )}
      />

      <TranslationEditor entry={editing} onClose={() => setEditing(null)} />
    </Shell>
  );
}

function Shell({
  children,
  total,
  coverage,
  missing,
}: {
  children: React.ReactNode;
  total?: number;
  coverage?: number;
  missing?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Localization"
        description="Translation keys across the six supported locales. Namespace-scoped, coverage-tracked, and fully audited."
        badges={
          <>
            <StatusBadge tone="warning">Mock data</StatusBadge>
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} keys
              </StatusBadge>
            ) : null}
            {coverage !== undefined ? (
              <StatusBadge tone={coverage === 100 ? "success" : "warning"} dot={false}>
                {coverage}% coverage
              </StatusBadge>
            ) : null}
            {missing ? (
              <StatusBadge tone="destructive" dot={false}>
                {missing} missing
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function TranslationEditor({
  entry,
  onClose,
}: {
  entry: TranslationKey | null;
  onClose: () => void;
}) {
  const provider = useAdminData();
  const session = useAdminSession();
  const [values, setValues] = useState<Record<Locale, string>>({
    en: "",
    "zh-CN": "",
    ko: "",
    ru: "",
    es: "",
    ms: "",
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (entry) {
      const next: Record<Locale, string> = {
        en: entry.values.en ?? "",
        "zh-CN": entry.values["zh-CN"] ?? "",
        ko: entry.values.ko ?? "",
        ru: entry.values.ru ?? "",
        es: entry.values.es ?? "",
        ms: entry.values.ms ?? "",
      };
      setValues(next);
      setReason("");
    }
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;
  const diffs: Locale[] = entry
    ? LOCALES.filter((l) => (values[l] ?? "") !== (entry.values[l] ?? ""))
    : [];
  const canSubmit = reasonOk && diffs.length > 0;

  async function submit() {
    if (!entry) return;
    for (const l of diffs) {
      await provider.updateTranslationValue(entry.id, l, values[l], {
        actor: session.actorName,
        role: session.roleId,
        environment: session.environment,
        reason: reason.trim(),
      });
    }
    onClose();
  }

  return (
    <FormDrawer
      open={!!entry}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={
        entry ? (
          <span className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <span className="mono text-primary">
              {entry.namespace}.{entry.key}
            </span>
          </span>
        ) : (
          ""
        )
      }
      description="Update translated values across the six locales. Each locale update is audited independently."
      submitLabel={`Save ${diffs.length || 0} locale${diffs.length === 1 ? "" : "s"}`}
      submitDisabled={!canSubmit}
      onSubmit={submit}
      testId="translation-drawer"
    >
      {entry ? (
        <>
          <div className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background/40 p-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Default value
            </span>
            <span className="text-sm text-foreground">{entry.defaultValue}</span>
          </div>

          {LOCALES.map((l) => (
            <div key={l} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`tr-${l}`} className="text-xs">
                  {LOCALE_LABELS[l]} <span className="mono text-muted-foreground">({l})</span>
                </Label>
                {!entry.values[l] ? (
                  <StatusBadge tone="warning" dot={false}>
                    missing
                  </StatusBadge>
                ) : diffs.includes(l) ? (
                  <StatusBadge tone="info" dot={false}>
                    edited
                  </StatusBadge>
                ) : null}
              </div>
              <textarea
                id={`tr-${l}`}
                data-testid={`tr-input-${l}`}
                value={values[l]}
                onChange={(e) => setValues((v) => ({ ...v, [l]: e.target.value }))}
                rows={2}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder={entry.defaultValue}
              />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tr-reason" className="text-xs">
              Reason{" "}
              <span className="text-muted-foreground">
                (auditable, ≥ 6 chars, applied to every changed locale)
              </span>
            </Label>
            <textarea
              id="tr-reason"
              data-testid="tr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Explain the change (glossary rule, launch, correction…)."
            />
          </div>

          <div className="mt-2">
            <AuditTimeline targetId={entry.id} heading="Recent edits" limit={10} />
          </div>
        </>
      ) : null}
    </FormDrawer>
  );
}
