import { type ReactNode } from "react";
import { PageHeader } from "@/admin/components/PageHeader";
import { ProviderBadge } from "@/admin/components/ProviderBadge";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MutationResult } from "@/admin/data/provider";

export function GovernanceShell({
  title,
  description,
  children,
  actions,
  badges = true,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  badges?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        badges={
          badges ? (
            <>
              <ProviderBadge />
              <StatusBadge tone="info">Governance</StatusBadge>
            </>
          ) : undefined
        }
      />
      {children}
    </div>
  );
}

export function ReceiptBanner({
  receipt,
  onDismiss,
}: {
  receipt: { action: string; result: MutationResult } | null;
  onDismiss?: () => void;
}) {
  if (!receipt) return null;
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        receipt.result.ok
          ? "border-success/40 bg-success/10"
          : "border-destructive/40 bg-destructive/10",
      )}
      data-testid="action-receipt"
    >
      <div className="flex items-center justify-between gap-3">
        <strong>{receipt.result.ok ? "Action recorded" : "Action denied"}</strong>
        {onDismiss ? (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {receipt.action} · audit{" "}
        <span className="mono">{receipt.result.auditId || "not-created"}</span>
      </div>
    </div>
  );
}

export function JsonState({ value }: { value: unknown }) {
  return (
    <pre className="mono max-h-36 overflow-auto rounded border border-border/50 bg-background/40 p-2 text-[10px] text-foreground/80">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
