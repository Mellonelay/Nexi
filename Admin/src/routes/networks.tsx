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
import type { Network } from "@/admin/types";

export const Route = createFileRoute("/networks")({ component: Page });

function Page() {
  return (
    <RouteGuard permission="networks.view">
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const provider = useAdminData();
  const session = useAdminSession();
  const q = useAdminQuery((p) => p.listNetworks());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Network | null>(null);
  const [toggling, setToggling] = useState<Network | null>(null);
  const [addingAddress, setAddingAddress] = useState<Network | null>(null);
  const [disablingAddress, setDisablingAddress] = useState<{ network: Network; addressId: string; address: string } | null>(null);

  const nets = useMemo(() => q.data ?? [], [q.data]);
  const selected = useMemo(
    () => (selectedId ? (nets.find((n) => n.id === selectedId) ?? null) : null),
    [nets, selectedId],
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
        <ErrorState title="Could not load networks" description={q.error.message} />
      </Shell>
    );

  const canEdit = session.can("networks.edit");

  const columns: DataTableColumn<Network>[] = [
    {
      key: "asset",
      header: "Asset",
      sortValue: (n) => n.assetSymbol,
      cell: (n) => <span className="mono text-sm font-medium text-primary">{n.assetSymbol}</span>,
    },
    {
      key: "name",
      header: "Network",
      sortValue: (n) => n.name,
      cell: (n) => <span className="text-sm">{n.name}</span>,
    },
    {
      key: "chain",
      header: "Chain ID",
      sortValue: (n) => n.chainId,
      cell: (n) => <span className="mono text-xs">{n.chainId}</span>,
    },
    {
      key: "contract",
      header: "Contract",
      cell: (n) =>
        n.contract ? (
          <span className="mono text-[11px] text-muted-foreground">{n.contract}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">native</span>
        ),
    },
    {
      key: "conf",
      header: "Confs",
      align: "right",
      sortValue: (n) => n.confirmations,
      cell: (n) => <span className="mono text-xs">{n.confirmations}</span>,
    },
    {
      key: "minWd",
      header: "Min WD",
      align: "right",
      cell: (n) => <span className="mono text-xs">{n.minWithdrawal}</span>,
    },
    {
      key: "fee",
      header: "WD fee",
      align: "right",
      cell: (n) => <span className="mono text-xs">{n.withdrawalFee}</span>,
    },
    {
      key: "state",
      header: "State",
      cell: (n) => (
        <StatusBadge tone={n.enabled ? "success" : "neutral"}>
          {n.enabled ? "enabled" : "disabled"}
        </StatusBadge>
      ),
    },
  ];

  const filters: DataTableFilter<Network>[] = [
    {
      key: "state",
      label: "state",
      options: [
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled" },
      ],
      match: (n, v) => (v === "enabled" ? n.enabled : !n.enabled),
    },
  ];

  return (
    <Shell total={nets.length} enabled={nets.filter((n) => n.enabled).length}>
      <DataTable
        data={nets}
        columns={columns}
        filters={filters}
        searchable={(n) => `${n.assetSymbol} ${n.name} ${n.chainId} ${n.contract ?? ""}`}
        searchPlaceholder="Search asset, network, chain, contract…"
        rowKey={(n) => n.id}
        onRowClick={(n) => setSelectedId(n.id)}
        rowActions={(n) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`net-inspect-${n.id}`}
              onClick={() => setSelectedId(n.id)}
            >
              Inspect
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid={`net-edit-${n.id}`}
              disabled={!canEdit}
              onClick={() => setEditing(n)}
            >
              Edit
            </Button>
            <Button
              variant={n.enabled ? "destructive" : "default"}
              size="sm"
              disabled={!canEdit}
              data-testid={`net-toggle-${n.id}`}
              onClick={() => setToggling(n)}
            >
              {n.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        )}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        title={
          selected ? (
            <span>
              {selected.name} <span className="mono text-primary">({selected.assetSymbol})</span>
            </span>
          ) : (
            ""
          )
        }
        subtitle={selected ? `${selected.chainId} · ${selected.id}` : undefined}
        badges={
          selected ? (
            <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
              {selected.enabled ? "enabled" : "disabled"}
            </StatusBadge>
          ) : null
        }
        sections={
          selected
            ? [
                {
                  id: "chain",
                  title: "Chain",
                  fields: [
                    { label: "Network", value: selected.name },
                    { label: "Asset", value: selected.assetSymbol, mono: true },
                    { label: "Chain ID", value: selected.chainId, mono: true },
                    { label: "Decimals", value: String(selected.decimals), mono: true },
                    { label: "Contract", value: selected.contract ?? "native", mono: true },
                    {
                      label: "Explorer",
                      value: (
                        <a
                          href={selected.explorer}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {selected.explorer}
                        </a>
                      ),
                    },
                  ],
                },
                {
                  id: "limits",
                  title: "Deposit & withdrawal",
                  fields: [
                    { label: "Min deposit", value: selected.minDeposit, mono: true },
                    { label: "Min withdrawal", value: selected.minWithdrawal, mono: true },
                    { label: "Withdrawal fee", value: selected.withdrawalFee, mono: true },
                    {
                      label: "Required confirmations",
                      value: String(selected.confirmations),
                      mono: true,
                    },
                    {
                      label: "Deposit state",
                      value: (
                        <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
                          {selected.enabled ? "accepting" : "paused"}
                        </StatusBadge>
                      ),
                    },
                    {
                      label: "Withdrawal state",
                      value: (
                        <StatusBadge tone={selected.enabled ? "success" : "neutral"}>
                          {selected.enabled ? "processing" : "paused"}
                        </StatusBadge>
                      ),
                    },
                  ],
                },
                {
                  id: "deposit-addresses",
                  title: "Deposit destinations",
                  content: (
                    <div className="space-y-2">
                      {(selected.depositAddresses ?? []).filter((item) => item.isActive).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No active deposit address is configured.</p>
                      ) : (
                        (selected.depositAddresses ?? []).filter((item) => item.isActive).map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{item.network}{item.label ? ` · ${item.label}` : ""}</p>
                              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{item.address}</p>
                            </div>
                            <Button variant="outline" size="sm" disabled={!canEdit} onClick={() => setDisablingAddress({ network: selected, addressId: item.id, address: item.address })}>Disable</Button>
                          </div>
                        ))
                      )}
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
                disabled={!canEdit || !selected.currencyId}
                onClick={() => setAddingAddress(selected)}
              >
                Add deposit address
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="net-detail-edit"
                disabled={!canEdit}
                onClick={() => setEditing(selected)}
              >
                Edit
              </Button>
              <Button
                variant={selected.enabled ? "destructive" : "default"}
                size="sm"
                disabled={!canEdit}
                data-testid="net-detail-toggle"
                onClick={() => setToggling(selected)}
              >
                {selected.enabled ? "Disable" : "Enable"}
              </Button>
            </>
          ) : null
        }
      />

      <DepositAddressForm
        net={addingAddress}
        onClose={() => setAddingAddress(null)}
        onSubmit={async (input, reason) => {
          if (!addingAddress?.currencyId) return;
          await provider.addDepositAddress(addingAddress.currencyId, input, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
          q.refresh();
        }}
      />

      {disablingAddress ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(open) => { if (!open) setDisablingAddress(null); }}
          title="Disable deposit address"
          description="This removes the address from Public deposit destinations without deleting its audit history."
          target={<span className="break-all font-mono text-xs">{disablingAddress.address}</span>}
          targetId={disablingAddress.addressId}
          action="networks.deposit-address.disable"
          permission="networks.edit"
          currentState={<StatusBadge tone="success">active</StatusBadge>}
          proposedState={<StatusBadge tone="neutral">disabled</StatusBadge>}
          destructive
          submitLabel="Disable address"
          successMessage="Deposit address disabled"
          onConfirm={(reason) => provider.disableDepositAddress(disablingAddress.addressId, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          })}
          onSuccess={() => { setDisablingAddress(null); q.refresh(); }}
        />
      ) : null}

      <NetworkEditForm
        net={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (patch, reason) => {
          if (!editing) return;
          await provider.updateNetwork(editing.id, patch, {
            actor: session.actorName,
            role: session.roleId,
            environment: session.environment,
            reason,
          });
        }}
      />

      {toggling ? (
        <ConsequentialActionDialog
          open
          onOpenChange={(o) => {
            if (!o) setToggling(null);
          }}
          title={toggling.enabled ? "Disable network" : "Enable network"}
          description="Disabling stops both deposits and withdrawals for this network."
          target={
            <span>
              {toggling.name} · {toggling.assetSymbol}
            </span>
          }
          targetId={toggling.id}
          action="networks.toggle"
          permission="networks.edit"
          currentState={
            <StatusBadge tone={toggling.enabled ? "success" : "neutral"}>
              {toggling.enabled ? "enabled" : "disabled"}
            </StatusBadge>
          }
          proposedState={
            <StatusBadge tone={toggling.enabled ? "neutral" : "success"}>
              {toggling.enabled ? "disabled" : "enabled"}
            </StatusBadge>
          }
          destructive={toggling.enabled}
          submitLabel={toggling.enabled ? "Disable network" : "Enable network"}
          successMessage="Network updated"
          onConfirm={(reason) =>
            provider.toggleNetwork(toggling.id, {
              actor: session.actorName,
              role: session.roleId,
              environment: session.environment,
              reason,
            })
          }
          onSuccess={() => setToggling(null)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({
  children,
  total,
  enabled,
}: {
  children: React.ReactNode;
  total?: number;
  enabled?: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Networks"
        description="Chain identity, contract, decimals, explorer, confirmations, limits, and fees."
        badges={
          <>
            <ProviderBadge />
            {total !== undefined ? (
              <StatusBadge tone="info" dot={false}>
                {total} networks
              </StatusBadge>
            ) : null}
            {enabled !== undefined ? (
              <StatusBadge tone="success" dot={false}>
                {enabled} enabled
              </StatusBadge>
            ) : null}
          </>
        }
      />
      {children}
    </div>
  );
}

function NetworkEditForm({
  net,
  onClose,
  onSubmit,
}: {
  net: Network | null;
  onClose: () => void;
  onSubmit: (
    patch: Partial<
      Pick<
        Network,
        | "decimals"
        | "minDeposit"
        | "maxDeposit"
        | "minWithdrawal"
        | "maxWithdrawal"
        | "withdrawalFee"
        | "confirmations"
        | "depositEnabled"
        | "withdrawEnabled"
      >
    >,
    reason: string,
  ) => Promise<void>;
}) {
  const [state, setState] = useState({
    decimals: 0,
    minDeposit: "",
    maxDeposit: "",
    minWithdrawal: "",
    maxWithdrawal: "",
    withdrawalFee: "",
    confirmations: 0,
    depositEnabled: true,
    withdrawEnabled: true,
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (net) {
      setState({
        decimals: net.decimals,
        minDeposit: net.minDeposit,
        maxDeposit: net.maxDeposit ?? "",
        minWithdrawal: net.minWithdrawal,
        maxWithdrawal: net.maxWithdrawal ?? "",
        withdrawalFee: net.withdrawalFee,
        confirmations: net.confirmations,
        depositEnabled: net.depositEnabled !== false,
        withdrawEnabled: net.withdrawEnabled !== false,
      });
      setReason("");
    }
  }, [net?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const reasonOk = reason.trim().length >= 6;
  const limitsValid =
    Number(state.minDeposit) >= 0 &&
    Number(state.maxDeposit) >= Number(state.minDeposit) &&
    Number(state.minWithdrawal) >= 0 &&
    Number(state.maxWithdrawal) >= Number(state.minWithdrawal) &&
    Number(state.withdrawalFee) >= 0;

  return (
    <FormDrawer
      open={!!net}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={net ? `Wallet config — ${net.assetSymbol}` : ""}
      description="Edit the user-facing deposit/withdraw limits, fee, confirmations, precision and enablement."
      submitLabel="Save wallet config"
      submitDisabled={!reasonOk || !limitsValid}
      onSubmit={async () => {
        await onSubmit(
          {
            decimals: state.decimals,
            minDeposit: state.minDeposit,
            maxDeposit: state.maxDeposit,
            minWithdrawal: state.minWithdrawal,
            maxWithdrawal: state.maxWithdrawal,
            withdrawalFee: state.withdrawalFee,
            confirmations: state.confirmations,
            depositEnabled: state.depositEnabled,
            withdrawEnabled: state.withdrawEnabled,
          },
          reason.trim(),
        );
        onClose();
      }}
      testId="net-edit-drawer"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
          <span className="text-sm">Deposits enabled</span>
          <Switch
            checked={state.depositEnabled}
            onCheckedChange={(v) => setState((s) => ({ ...s, depositEnabled: !!v }))}
          />
        </label>
        <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
          <span className="text-sm">Withdrawals enabled</span>
          <Switch
            checked={state.withdrawEnabled}
            onCheckedChange={(v) => setState((s) => ({ ...s, withdrawEnabled: !!v }))}
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Min deposit">
          <Input
            value={state.minDeposit}
            onChange={(e) => setState((s) => ({ ...s, minDeposit: e.target.value }))}
          />
        </Field>
        <Field label="Max deposit">
          <Input
            value={state.maxDeposit}
            onChange={(e) => setState((s) => ({ ...s, maxDeposit: e.target.value }))}
          />
        </Field>
        <Field label="Min withdrawal">
          <Input
            value={state.minWithdrawal}
            onChange={(e) => setState((s) => ({ ...s, minWithdrawal: e.target.value }))}
          />
        </Field>
        <Field label="Max withdrawal">
          <Input
            value={state.maxWithdrawal}
            onChange={(e) => setState((s) => ({ ...s, maxWithdrawal: e.target.value }))}
          />
        </Field>
        <Field label="Withdrawal fee">
          <Input
            value={state.withdrawalFee}
            onChange={(e) => setState((s) => ({ ...s, withdrawalFee: e.target.value }))}
          />
        </Field>
        <Field label="Required confirmations">
          <Input
            type="number"
            min={0}
            value={state.confirmations}
            onChange={(e) => setState((s) => ({ ...s, confirmations: Number(e.target.value) }))}
          />
        </Field>
        <Field label="Decimals">
          <Input
            type="number"
            min={0}
            value={state.decimals}
            onChange={(e) => setState((s) => ({ ...s, decimals: Number(e.target.value) }))}
          />
        </Field>
      </div>
      {!limitsValid ? (
        <p className="text-xs text-destructive">
          Maximum values must be greater than or equal to their minimums; fee cannot be negative.
        </p>
      ) : null}
      <Field label="Reason (auditable, ≥ 6 chars)">
        <textarea
          data-testid="net-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </Field>
    </FormDrawer>
  );
}

function DepositAddressForm({
  net,
  onClose,
  onSubmit,
}: {
  net: Network | null;
  onClose: () => void;
  onSubmit: (input: { network: string; address: string; label?: string }, reason: string) => Promise<void>;
}) {
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!net) return;
    setNetwork(net.name || net.chainId);
    setAddress("");
    setLabel("");
    setReason("");
  }, [net?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = network.trim().length >= 2 && address.trim().length >= 8 && reason.trim().length >= 6;
  return (
    <FormDrawer
      open={!!net}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={net ? `Add deposit address — ${net.assetSymbol}` : ""}
      description="Creates an audited D1-backed deposit destination exposed to the Public wallet only when the currency and destination are enabled."
      submitLabel="Add deposit address"
      submitDisabled={!valid}
      onSubmit={async () => {
        await onSubmit({ network: network.trim(), address: address.trim(), ...(label.trim() ? { label: label.trim() } : {}) }, reason.trim());
        onClose();
      }}
    >
      <Field label="Network"><Input value={network} onChange={(e) => setNetwork(e.target.value)} /></Field>
      <Field label="Deposit address"><Input value={address} onChange={(e) => setAddress(e.target.value)} className="font-mono" /></Field>
      <Field label="Label (optional)"><Input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
      <Field label="Reason (auditable, ≥ 6 chars)"><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" /></Field>
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
