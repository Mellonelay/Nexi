import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { FormDrawer } from "@/admin/components/FormDrawer";
import { ConsequentialActionDialog } from "@/admin/components/ConsequentialActionDialog";
import { AuditTimeline } from "@/admin/components/AuditTimeline";
import { LoadingSkeleton, ErrorState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Asset, AssetCategory } from "@/admin/types";
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assets")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="assets.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listAssets());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [visibilityPending, setVisibilityPending] = useState<Asset | null>(null);

  const assets = useMemo(() => q.data ?? [], [q.data]);
  const selected = useMemo(
    () => (selectedId ? (assets.find((a) => a.id === selectedId) ?? null) : null),
    [assets, selectedId],
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
        <ErrorState title="Could not load assets" description={q.error.message} />
      </Shell>
    );

  const canEdit = session.can("assets.edit");
  const sorted = [...assets].sort((a, b) => a.order - b.order);

  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((a) => a.id === id);
    const other = sorted[idx + dir];
    if (!other) return;
    await provider.reorderAssets(
      { [id]: other.order, [other.id]: sorted[idx].order },
      {
        actor: session.actorName,
        role: session.roleId,
        environment: session.environment,
        reason: `Reordered asset ${id}`,
      },
    );
    toast.success("Order updated");
  }

  const columns: DataTableColumn<Asset>[] = [
    {
      key: "order",
      header: "#",
      align: "right",
      sortValue: (a) => a.order,
      cell: (a) => <span className="mono text-xs">{a.order}</span>,
    },
    {
      key: "symbol",
      header: "Symbol",
      sortValue: (a) => a.symbol,
      cell: (a) => <span className="mono text-sm font-medium text-primary">{a.symbol}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortValue: (a) => a.name,
      cell: (a) => <span className="text-sm">{a.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortValue: (a) => a.category,
      cell: (a) => (
        <StatusBadge tone={catTone(a.category)} dot={false}>
          {a.category}
        </StatusBadge>
      ),
    },
    {
      key: "caps",
      header: "Capabilities",
      cell: (a) => (
        <div className="flex gap-1">
          {a.spot ? (
            <StatusBadge tone="success" dot={false}>
              spot
            </StatusBadge>
          ) : null}
          {a.binary ? (
            <StatusBadge tone="primary" dot={false}>
              binary
            </StatusBadge>
          ) : null}
          {a.mining ? (
            <StatusBadge tone="info" dot={false}>
              mining
            </StatusBadge>
          ) : null}
          {a.loans ? (
            <StatusBadge tone="info" dot={false}>
              loans
            </StatusBadge>
          ) : null}
          {!a.spot && !a.binary && !a.mining && !a.loans ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "state",
      header: "State",
      cell: (a) => (
        <StatusBadge tone={stateTone(a)}>
          {a.visible
            ? a.spot || a.binary || a.mining || a.loans
              ? "active"
              : "disabled"
            : "maintenance"}
        </StatusBadge>
      ),
    },
  ];

  const filters: DataTableFilter<Asset>[] = [
    {
      key: "cat",
      label: "category",
      options: [
        { value: "crypto", label: "Crypto" },
        { value: "stablecoin", label: "Stablecoin" },
        { value: "fiat_proxy", label: "Fiat proxy" },
      ],
      match: (a, v) => a.category === v,
    },
    {
      key: "state",
      label: "state",
      options: [
        { value: "active", label: "Active" },
        { value: "disabled", label: "Disabled" },
        { value: "maintenance", label: "Maintenance" },
      ],
      match: (a, v) => {
        const state = a.visible
          ? a.spot || a.binary || a.mining || a.loans
            ? "active"
            : "disabled"
          : "maintenance";
        return state === v;
      },
    },
  ];

  return (
    <Shell total={assets.length} visible={assets.filter((a) => a.visible).length}>
      <DataTable
        data={sorted}
        columns={columns}
        filters={filters}
        searchable={(a) => `${a.symbol} ${a.name} ${a.id}`}
        searchPlaceholder="Search symbol or name…"
        rowKey={(a) => a.id}
        onRowClick={(a) => setSelectedId(a.id)}
        rowActions={(a) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canEdit || sorted[0]?.id === a.id}
              data-testid={`asset-up-${a.id}`}
              onClick={() => move(a.id, -1)}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canEdit || sorted[sorted.length - 1]?.id === a.id}
              data-testid={`asset-down-${a.id}`}
              onClick={() => move(a.id, 1)}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid={`asset-inspect-${a.id}`}
              onClick={() => setSelectedId(a.id)}
            >
              Inspect
            </Button>
            <Button
              variant={a.visible ? "destructive" : "default"}
              size="sm"
              disabled={!canEdit}
              data-testid={`asset-visibility-${a.id}`}
              onClick={() => setVisibilityPending(a)}
            >
              {a.visible ? (
                <EyeOff className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Eye className="mr-1 h-3.5 w-3.5" />
              )}
              {a.visible ? "Hide" : "Show"}
            </Button>
          </div>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={selected ? <span className="mono text-primary">{selected.symbol}</span> : ""}
        subtitle={selected ? `${selected.name} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <>
              <StatusBadge tone={catTone(selected.category)} dot={false}>
                {selected.category}
              </StatusBadge>
              <StatusBadge tone={stateTone(selected)}>
                {selected.visible
                  ? selected.spot || selected.binary || selected.mining || selected.loans
                    ? "active"
                    : "disabled"
                  : "maintenance"}
              </StatusBadge>
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "asset",
                  title: "Asset",
                  fields: [
                    { label: "Symbol", value: selected.symbol, mono: true },
                    { label: "Name", value: selected.name },
                    { label: "Category", value: selected.category, mono: true },
                    { label: "Order", value: String(selected.order), mono: true },
                    { label: "Visibility", value: selected.visible ? "visible" : "hidden" },
                  ],
                },
                {
                  id: "caps",
                  title: "Capabilities",
                  fields: [
                    {
                      label: "Spot",
                      value: (
                        <StatusBadge tone={selected.spot ? "success" : "neutral"} dot={false}>
                          {selected.spot ? "yes" : "no"}
                        </StatusBadge>
                      ),
                    },
                    {
                      label: "Binary",
                      value: (
                        <StatusBadge tone={selected.binary ? "success" : "neutral"} dot={false}>
                          {selected.binary ? "yes" : "no"}
                        </StatusBadge>
                      ),
                    },
                    {
                      label: "Mining",
                      value: (
                        <StatusBadge tone={selected.mining ? "success" : "neutral"} dot={false}>
                          {selected.mining ? "yes" : "no"}
                        </StatusBadge>
                      ),
                    },
                    {
                      label: "Loans",
                      value: (
                        <StatusBadge tone={selected.loans ? "success" : "neutral"} dot={false}>
                          {selected.loans ? "yes" : "no"}
                        </StatusBadge>
                      ),
                    },
                  ],
                },
                {
                  id: "audit",
                  title: "Audit timeline",
                  content: <AuditTimeline targetId={selected.id} heading="" limit={15} />,
                },
              ]
            : []
        }
        actions={
          selected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                data-testid="asset-detail-edit"
                disabled={!canEdit}
                onClick={() => setEditing(selected)}
              >
                Edit
              </Button>
              <Button
                variant={selected.visible ? "destructive" : "default"}
                size="sm"
                disabled={!canEdit}
                data-testid="asset-detail-visibility"
                onClick={() => setVisibilityPending(selected)}
              >
                {selected.visible ? "Hide" : "Show"}
              </Button>
            </>
          ) : null
        }
      />

      <AssetEditForm
        asset={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateAsset(editing.id, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {visibilityPending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setVisibilityPending(null);
          }}
          title={
            visibilityPending.visible
              ? "Hide asset from public surface"
              : "Show asset on public surface"
          }
          description="Hidden assets stay tradable for existing holders but are removed from listings."
          target={<span className="mono">{visibilityPending.symbol}</span>}
          targetId={visibilityPending.id}
          action="assets.toggle_visibility"
          permission="assets.edit"
          currentState={
            <StatusBadge tone={visibilityPending.visible ? "success" : "neutral"}>
              {visibilityPending.visible ? "visible" : "hidden"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={visibilityPending.visible ? "neutral" : "success"}>
              {visibilityPending.visible ? "hidden" : "visible"}
            </StatusBadge>
          }
          destructive={visibilityPending.visible}
          submitLabel={visibilityPending.visible ? "Hide" : "Show"}
          successMessage="Asset visibility updated"
          onConfirm={(reason) =>
            provider.toggleAssetVisibility(visibilityPending.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setVisibilityPending(null)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  total,
  visible,
}: {
  children: React.ReactNode;
  total?: number;
  visible?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assets"
        description="Asset identity, ordering, visibility, and product capabilities."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} assets
              </StatusBadge>
            ) : null}
            {visible !== undefined ? (
              <StatusBadge tone="success" dot={false}>
                {visible} visible
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function AssetEditForm({
  asset,
  onClose,
  onSubmit,
}: {
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (
    patch: Partial<Pick<Asset, "name" | "order" | "spot" | "binary" | "mining" | "loans">>,
    reason: string,
  ) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState(1);
  const [caps, setCaps] = useState({ spot: false, binary: false, mining: false, loans: false });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setOrder(asset.order);
      setCaps({ spot: asset.spot, binary: asset.binary, mining: asset.mining, loans: asset.loans });
      setReason("");
    }
  }, [asset?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!asset}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={asset ? `Edit asset — ${asset.symbol}` : ""}
      description="Symbol is not editable. Update display metadata and product capabilities."
      submitLabel="Save asset"
      submitDisabled={!reasonOk}
      onSubmit={async () => {
        await onSubmit({ name, order, ...caps }, reason.trim());
        onClose();
      }}
      testId="asset-edit-drawer"
    >
      <Field label="Name">
        <Input data-testid="asset-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Order">
        <Input
          data-testid="asset-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </Field>
      <Field label="Product capabilities">
        <div className="grid grid-cols-2 gap-2">
          {(["spot", "binary", "mining", "loans"] as const).map((k) => (
            <label
              key={k}
              htmlFor={`asset-${k}`}
              className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2"
            >
              <span className="text-sm capitalize">{k}</span>
              <Switch
                id={`asset-${k}`}
                data-testid={`asset-cap-${k}`}
                checked={caps[k]}
                onCheckedChange={(v) => setCaps((prev) => ({ ...prev, [k]: !!v }))}
              />
            </label>
          ))}
        </div>
      </Field>
      <Field label="Reason (auditable, ≥ 6 chars)">
        <textarea
          data-testid="asset-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </Field>
    </FormDrawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function catTone(c: AssetCategory) {
  return c === "crypto"
    ? ("primary" as const)
    : c === "stablecoin"
      ? ("info" as const)
      : ("neutral" as const);
}
function stateTone(a: Asset) {
  if (!a.visible) return "warning" as const;
  if (!(a.spot || a.binary || a.mining || a.loans)) return "neutral" as const;
  return "success" as const;
}
