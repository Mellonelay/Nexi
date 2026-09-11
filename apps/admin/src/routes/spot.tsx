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
import { LoadingSkeleton, ErrorState, EmptyState } from "@/admin/components/states";
import { useAdminData, useAdminQuery } from "@/admin/data/context";
import { useAdminSession } from "@/admin/session/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { SpotPair, SpotOrder, SpotOrderType } from "@/admin/types";
import { Pause, Play, XCircle } from "lucide-react";

export const Route = createFileRoute("/spot")({ component: Page });

const ORDER_TYPES: SpotOrderType[] = ["market", "limit", "stop_limit"];

function Page() {
  return (
    <RouteGuard permission="spot.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const pairsQ = useAdminQuery((p) => p.listSpotPairs());
  const ordersQ = useAdminQuery((p) => p.listSpotOrders());

  if (pairsQ.loading || ordersQ.loading)
    return (
      <Shell>
        <LoadingSkeleton rows={5} />
      </Shell>
    );
  if (pairsQ.error)
    return (
      <Shell>
        <ErrorState title="Could not load pairs" description={pairsQ.error.message} />
      </Shell>
    );

  const pairs = pairsQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const openOrders = orders.filter((o) => o.status === "open").length;
  const maintenance = pairs.filter((p) => p.maintenance).length;

  return (
    <Shell total={pairs.length} maintenance={maintenance} openOrders={openOrders}>
      <p className="text-xs text-muted-foreground">
        Spot and isolated margin are canonical. Futures, perpetuals, cross margin and portfolio
        margin are not exposed.
      </p>
      <Tabs defaultValue="pairs">
        <TabsList className="mb-4">
          <TabsTrigger value="pairs" data-testid="spot-tab-pairs">
            Pairs ({pairs.length})
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="spot-tab-orders">
            Open orders ({openOrders})
          </TabsTrigger>
          <TabsTrigger value="margin" data-testid="spot-tab-margin">
            Margin config
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="spot-tab-audit">
            Audit
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pairs">
          <PairsPanel pairs={pairs} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersPanel orders={orders} />
        </TabsContent>
        <TabsContent value="margin">
          <MarginConfigurationPanel />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTimeline actionPrefix="spot." limit={40} />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({
  children,
  total,
  maintenance,
  openOrders,
}: {
  children: React.ReactNode;
  total?: number;
  maintenance?: number;
  openOrders?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Spot Administration"
        description="Pair enablement, order-type support, precision, limits, fees, provider source, and order cancellation."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} pairs
              </StatusBadge>
            ) : null}
            {maintenance ? (
              <StatusBadge tone="warning" dot={false}>
                {maintenance} in maintenance
              </StatusBadge>
            ) : null}
            {openOrders ? (
              <StatusBadge tone="primary" dot={false}>
                {openOrders} open orders
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

/* --------------- Pairs --------------- */
function PairsPanel({ pairs }: { pairs: SpotPair[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canEdit = session.can("spot.edit");
  const canPause = session.can("spot.pause");
  const canUpdatePair = canEdit && provider.supports?.("updateSpotPair") !== false;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SpotPair | null>(null);
  const [pausing, setPausing] = useState<SpotPair | null>(null);

  const selected = useMemo(
    () => (selectedId ? (pairs.find((p) => p.id === selectedId) ?? null) : null),
    [pairs, selectedId],
  );

  const columns: DataTableColumn<SpotPair>[] = [
    {
      key: "symbol",
      header: "Pair",
      sortValue: (p) => p.symbol,
      cell: (p) => <span className="mono text-sm font-medium text-primary">{p.symbol}</span>,
    },
    {
      key: "state",
      header: "State",
      sortValue: (p) => (p.maintenance ? 2 : p.enabled ? 0 : 1),
      cell: (p) => (
        <StatusBadge tone={p.maintenance ? "warning" : p.enabled ? "success" : "neutral"}>
          {p.maintenance ? "maintenance" : p.enabled ? "enabled" : "disabled"}
        </StatusBadge>
      ),
    },
    {
      key: "sides",
      header: "Buy / Sell",
      cell: (p) => (
        <div className="flex gap-1">
          <StatusBadge tone={p.buy ? "success" : "neutral"} dot={false}>
            {p.buy ? "buy" : "no buy"}
          </StatusBadge>
          <StatusBadge tone={p.sell ? "success" : "neutral"} dot={false}>
            {p.sell ? "sell" : "no sell"}
          </StatusBadge>
        </div>
      ),
    },
    {
      key: "types",
      header: "Types",
      cell: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.supports.map((t) => (
            <StatusBadge key={t} tone="info" dot={false}>
              {t}
            </StatusBadge>
          ))}
          {p.tpSl ? (
            <StatusBadge tone="primary" dot={false}>
              tp/sl
            </StatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      key: "prec",
      header: "Precision",
      align: "right",
      cell: (p) => (
        <span className="mono text-xs">
          {p.pricePrecision}p · {p.sizePrecision}s
        </span>
      ),
    },
    {
      key: "notional",
      header: "Notional",
      align: "right",
      cell: (p) => (
        <span className="mono text-xs">
          {p.minNotional} – {p.maxNotional}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee (bps)",
      align: "right",
      sortValue: (p) => p.feeBps,
      cell: (p) => <span className="mono text-xs">{p.feeBps}</span>,
    },
    {
      key: "provider",
      header: "Provider",
      sortValue: (p) => p.provider,
      cell: (p) => <span className="mono text-xs text-muted-foreground">{p.provider}</span>,
    },
  ];

  const filters: DataTableFilter<SpotPair>[] = [
    {
      key: "state",
      label: "state",
      options: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
        { value: "maintenance", label: "Maintenance" },
      ],
      match: (p, v) => {
        if (v === "enabled") return p.enabled && !p.maintenance;
        if (v === "disabled") return !p.enabled;
        return p.maintenance;
      },
    },
  ];

  return (
    <>
      <DataTable
        data={pairs}
        columns={columns}
        filters={filters}
        searchable={(p) => `${p.symbol} ${p.base} ${p.quote} ${p.provider}`}
        searchPlaceholder="Search pair or provider…"
        rowKey={(p) => p.id}
        onRowClick={(p) => setSelectedId(p.id)}
        rowActions={(p) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`pair-inspect-${p.id}`}
              onClick={() => setSelectedId(p.id)}
            >
              Inspect
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid={`pair-edit-${p.id}`}
              disabled={!canUpdatePair}
              onClick={() => setEditing(p)}
            >
              Edit
            </Button>
            <Button
              variant={p.maintenance ? "default" : "destructive"}
              size="sm"
              disabled={!canPause}
              data-testid={`pair-pause-${p.id}`}
              onClick={() => setPausing(p)}
            >
              {p.maintenance ? (
                <>
                  <Play className="mr-1 h-3.5 w-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                </>
              )}
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
        subtitle={selected ? `${selected.base} / ${selected.quote} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <>
              <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
                {selected.enabled ? "enabled" : "disabled"}
              </StatusBadge>
              {selected.maintenance ? <StatusBadge tone="warning">maintenance</StatusBadge> : null}
            </>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "pair",
                  title: "Pair",
                  fields: [
                    { label: "Symbol", value: selected.symbol, mono: true },
                    { label: "Base", value: selected.base, mono: true },
                    { label: "Quote", value: selected.quote, mono: true },
                    { label: "Provider", value: selected.provider, mono: true },
                    { label: "Fee (bps)", value: String(selected.feeBps), mono: true },
                    { label: "TP/SL", value: selected.tpSl ? "yes" : "no" },
                  ],
                },
                {
                  id: "limits",
                  title: "Precision & limits",
                  fields: [
                    {
                      label: "Price precision",
                      value: String(selected.pricePrecision),
                      mono: true,
                    },
                    { label: "Size precision", value: String(selected.sizePrecision), mono: true },
                    { label: "Min notional", value: selected.minNotional, mono: true },
                    { label: "Max notional", value: selected.maxNotional, mono: true },
                    { label: "Buy", value: selected.buy ? "yes" : "no" },
                    { label: "Sell", value: selected.sell ? "yes" : "no" },
                  ],
                },
                {
                  id: "types",
                  title: "Order types",
                  content: (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.supports.map((t) => (
                        <StatusBadge key={t} tone="info" dot={false}>
                          {t}
                        </StatusBadge>
                      ))}
                      {selected.supports.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None enabled.</span>
                      ) : null}
                    </div>
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
        actions={
          selected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                data-testid="pair-detail-edit"
                disabled={!canUpdatePair}
                onClick={() => setEditing(selected)}
              >
                Edit
              </Button>
              <Button
                variant={selected.maintenance ? "default" : "destructive"}
                size="sm"
                disabled={!canPause}
                data-testid="pair-detail-pause"
                onClick={() => setPausing(selected)}
              >
                {selected.maintenance ? "Resume" : "Pause"}
              </Button>
            </>
          ) : null
        }
      />

      <SpotPairEditForm
        pair={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateSpotPair(editing.id, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {pausing ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPausing(null);
          }}
          title={pausing.maintenance ? "Resume pair" : "Pause pair (maintenance)"}
          description="Paused pairs reject new orders. Open orders are not automatically cancelled."
          target={<span className="mono">{pausing.symbol}</span>}
          targetId={pausing.id}
          action={pausing.maintenance ? "spot.resume_pair" : "spot.pause_pair"}
          permission="spot.pause"
          currentState={
            <StatusBadge tone={pausing.maintenance ? "warning" : "success"}>
              {pausing.maintenance ? "maintenance" : "enabled"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={pausing.maintenance ? "success" : "warning"}>
              {pausing.maintenance ? "enabled" : "maintenance"}
            </StatusBadge>
          }
          destructive={!pausing.maintenance}
          submitLabel={pausing.maintenance ? "Resume" : "Pause"}
          successMessage="Pair state updated"
          onConfirm={(reason) =>
            provider.pauseSpotPair(pausing.id, !pausing.maintenance, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPausing(null)}
        />
      ) : null}
    </>
  );
}

function MarginConfigurationPanel() {
  const provider = useAdminData();
  const session = useAdminSession();
  const query = useAdminQuery((p) => p.getMarginConfiguration());
  const [ratio, setRatio] = useState("0.5");
  const [leverages, setLeverages] = useState("2,3,5");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) {
      setRatio(String(query.data.maintenanceRatio));
      setLeverages(query.data.leverages.join(","));
    }
  }, [query.data]);

  if (query.loading) return <LoadingSkeleton rows={3} />;
  if (query.error)
    return (
      <ErrorState
        title="Could not load isolated margin configuration"
        description={query.error.message}
      />
    );

  const parsedRatio = Number(ratio);
  const parsedLeverages = leverages
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value));
  const valid =
    parsedRatio > 0 &&
    parsedRatio < 1 &&
    parsedLeverages.length > 0 &&
    parsedLeverages.every((value) => value >= 2 && value <= 20) &&
    reason.trim().length >= 6;

  return (
    <div className="max-w-2xl space-y-4 rounded-lg border border-border/60 bg-background/40 p-4">
      <div>
        <h3 className="font-medium">Isolated margin controls</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          These values drive the Public margin leverage buttons and liquidation maintenance
          threshold.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Allowed leverages</Label>
          <Input
            value={leverages}
            onChange={(e) => setLeverages(e.target.value)}
            placeholder="2,3,5"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Comma-separated integers from 2x to 20x.
          </p>
        </div>
        <div>
          <Label>Maintenance ratio</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Reason (auditable, ≥ 6 chars)</Label>
        <textarea
          value={reason}
          aria-label="Reason for margin configuration change"
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      <Button
        disabled={!valid || !session.can("spot.edit")}
        onClick={async () => {
          setMessage(null);
          await provider.updateMarginConfiguration(
            {
              maintenanceRatio: parsedRatio,
              leverages: [...new Set(parsedLeverages)].sort((a, b) => a - b),
            },
            {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason: reason.trim(),
            },
          );
          setMessage("Margin configuration updated.");
        }}
      >
        Save margin configuration
      </Button>
    </div>
  );
}

/* --------------- Orders --------------- */
function OrdersPanel({ orders }: { orders: SpotOrder[] }) {
  const provider = useAdminData();
  const session = useAdminSession();
  const canCancel = session.can("spot.cancel_order");
  const [pending, setPending] = useState<SpotOrder | null>(null);

  const filtered = orders.filter((o) => o.status === "open");
  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No open orders"
        description="Filled or cancelled orders are not shown here."
      />
    );
  }

  const columns: DataTableColumn<SpotOrder>[] = [
    {
      key: "id",
      header: "Order",
      sortValue: (o) => o.id,
      cell: (o) => <span className="mono text-xs text-muted-foreground">{o.id}</span>,
    },
    { key: "user", header: "User", cell: (o) => <span className="mono text-xs">{o.userId}</span> },
    { key: "pair", header: "Pair", cell: (o) => <span className="mono text-sm">{o.pair}</span> },
    {
      key: "side",
      header: "Side",
      cell: (o) => (
        <StatusBadge tone={o.side === "buy" ? "success" : "destructive"} dot={false}>
          {o.side}
        </StatusBadge>
      ),
    },
    { key: "type", header: "Type", cell: (o) => <span className="mono text-xs">{o.type}</span> },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (o) => <span className="mono text-xs">{o.price ?? "—"}</span>,
    },
    {
      key: "size",
      header: "Size",
      align: "right",
      cell: (o) => <span className="mono text-xs">{o.size}</span>,
    },
    {
      key: "filled",
      header: "Filled",
      align: "right",
      cell: (o) => <span className="mono text-xs">{o.filled}</span>,
    },
    {
      key: "created",
      header: "Created",
      sortValue: (o) => o.createdAt,
      cell: (o) => (
        <span className="mono text-[11px] text-muted-foreground">
          {new Date(o.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        searchable={(o) => `${o.id} ${o.userId} ${o.pair}`}
        searchPlaceholder="Search order, user, pair…"
        rowActions={(o) => (
          <Button
            variant="destructive"
            size="sm"
            data-testid={`order-cancel-${o.id}`}
            disabled={!canCancel}
            onClick={() => setPending(o)}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
          </Button>
        )}
      />
      {pending ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          title="Cancel open order"
          description="Cancellation is governed and audited. It cannot be reversed once confirmed."
          target={
            <span className="mono">
              {pending.id} · {pending.pair}
            </span>
          }
          targetId={pending.id}
          action="spot.cancel_order"
          permission="spot.cancel_order"
          currentState={<StatusBadge tone="success">open</StatusBadge>}
          proposedState={<StatusBadge tone="neutral">cancelled</StatusBadge>}
          destructive
          submitLabel="Cancel order"
          successMessage="Order cancelled"
          onConfirm={(reason) =>
            provider.cancelSpotOrder(pending.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setPending(null)}
        />
      ) : null}
    </>
  );
}

function SpotPairEditForm({
  pair,
  onClose,
  onSubmit,
}: {
  pair: SpotPair | null;
  onClose: () => void;
  onSubmit: (
    patch: Partial<
      Pick<
        SpotPair,
        | "enabled"
        | "buy"
        | "sell"
        | "supports"
        | "tpSl"
        | "pricePrecision"
        | "sizePrecision"
        | "minNotional"
        | "maxNotional"
        | "feeBps"
        | "provider"
      >
    >,
    reason: string,
  ) => Promise<void>;
}) {
  const [state, setState] = useState({
    enabled: true,
    buy: true,
    sell: true,
    tpSl: false,
    supports: [] as SpotOrderType[],
    pricePrecision: 2,
    sizePrecision: 6,
    minNotional: "10",
    maxNotional: "100000",
    feeBps: 10,
    provider: "aggregator_primary",
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (pair) {
      setState({
        enabled: pair.enabled,
        buy: pair.buy,
        sell: pair.sell,
        tpSl: pair.tpSl,
        supports: [...pair.supports],
        pricePrecision: pair.pricePrecision,
        sizePrecision: pair.sizePrecision,
        minNotional: pair.minNotional,
        maxNotional: pair.maxNotional,
        feeBps: pair.feeBps,
        provider: pair.provider,
      });
      setReason("");
    }
  }, [pair?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleType(t: SpotOrderType) {
    setState((s) => ({
      ...s,
      supports: s.supports.includes(t) ? s.supports.filter((x) => x !== t) : [...s.supports, t],
    }));
  }

  const reasonOk = reason.trim().length >= 6;

  return (
    <FormDrawer
      open={!!pair}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={pair ? `Edit — ${pair.symbol}` : ""}
      description="Configure order-type support, precision, notional bounds, and fees."
      submitLabel="Save pair"
      submitDisabled={!reasonOk}
      onSubmit={async () => {
        await onSubmit({ ...state }, reason.trim());
        onClose();
      }}
      testId="spot-pair-drawer"
    >
      <div className="grid grid-cols-2 gap-2">
        {(["enabled", "buy", "sell", "tpSl"] as const).map((k) => (
          <label
            key={k}
            htmlFor={`spot-${k}`}
            className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2"
          >
            <span className="text-sm">{k}</span>
            <Switch
              id={`spot-${k}`}
              data-testid={`spot-flag-${k}`}
              checked={state[k]}
              onCheckedChange={(v) => setState((s) => ({ ...s, [k]: !!v }))}
            />
          </label>
        ))}
      </div>
      <Field label="Order types">
        <div className="grid grid-cols-3 gap-2">
          {ORDER_TYPES.map((t) => (
            <label
              key={t}
              htmlFor={`spot-type-${t}`}
              className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2"
            >
              <Checkbox
                id={`spot-type-${t}`}
                data-testid={`spot-type-${t}`}
                checked={state.supports.includes(t)}
                onCheckedChange={() => toggleType(t)}
              />
              <span className="mono text-xs">{t}</span>
            </label>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price precision">
          <Input
            data-testid="spot-price-prec"
            type="number"
            value={state.pricePrecision}
            onChange={(e) => setState((s) => ({ ...s, pricePrecision: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Size precision">
          <Input
            data-testid="spot-size-prec"
            type="number"
            value={state.sizePrecision}
            onChange={(e) => setState((s) => ({ ...s, sizePrecision: Number(e.target.value) }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min notional">
          <Input
            data-testid="spot-min"
            value={state.minNotional}
            onChange={(e) => setState((s) => ({ ...s, minNotional: e.target.value }))}
          />
        </Field>
        <Field label="Max notional">
          <Input
            data-testid="spot-max"
            value={state.maxNotional}
            onChange={(e) => setState((s) => ({ ...s, maxNotional: e.target.value }))}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fee (bps)">
          <Input
            data-testid="spot-fee"
            type="number"
            value={state.feeBps}
            onChange={(e) => setState((s) => ({ ...s, feeBps: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Provider">
          <Input
            data-testid="spot-provider"
            value={state.provider}
            onChange={(e) => setState((s) => ({ ...s, provider: e.target.value }))}
          />
        </Field>
      </div>
      <Field label="Reason (auditable, ≥ 6 chars)">
        <textarea
          data-testid="spot-reason"
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
