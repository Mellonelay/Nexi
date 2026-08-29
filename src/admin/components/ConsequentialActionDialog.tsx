import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EnvironmentBadge } from "@/admin/components/EnvironmentBadge";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useAdminSession } from "@/admin/session/session";
import { ROLES } from "@/admin/config/roles";
import type { MutationResult } from "@/admin/data/provider";
import type { Permission } from "@/admin/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ConsequentialActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  target: ReactNode;
  targetId: string;
  action: string;
  permission: Permission;
  currentState: ReactNode;
  proposedState: ReactNode;
  destructive?: boolean;
  productionConfirmText?: string;
  submitLabel?: string;
  cancelLabel?: string;
  reasonPlaceholder?: string;
  minReasonLength?: number;
  successMessage?: string;
  onConfirm: (reason: string) => Promise<MutationResult | void> | MutationResult | void;
  onSuccess?: (result: MutationResult | void) => void;
}

/**
 * ConsequentialActionDialog — reusable envelope for mutating admin actions.
 * Verifies permission, requires a reason, displays actor/role/environment/target
 * and current/proposed state, requires confirmation, and in PRODUCTION requires
 * an additional typed confirmation.
 */
export function ConsequentialActionDialog({
  open,
  onOpenChange,
  title,
  description,
  target,
  targetId,
  action,
  permission,
  currentState,
  proposedState,
  destructive,
  productionConfirmText,
  submitLabel = "Confirm",
  cancelLabel = "Cancel",
  reasonPlaceholder = "Explain why this action is necessary (auditable).",
  minReasonLength = 6,
  successMessage,
  onConfirm,
  onSuccess,
}: ConsequentialActionDialogProps) {
  const session = useAdminSession();
  const [reason, setReason] = useState("");
  const [typedConfirm, setTypedConfirm] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTypedConfirm("");
      setPending(false);
    }
  }, [open]);

  const authorized = session.can(permission);
  const isProduction = session.environment === "PRODUCTION";
  const requiredTyped = productionConfirmText ?? targetId;
  const productionOk = !isProduction || typedConfirm.trim() === requiredTyped;
  const reasonOk = reason.trim().length >= minReasonLength;
  const canSubmit = authorized && reasonOk && productionOk && !pending;

  const roleLabel = useMemo(() => ROLES[session.roleId].label, [session.roleId]);

  async function submit() {
    if (!canSubmit) return;
    setPending(true);
    try {
      const result = await onConfirm(reason.trim());
      if (result && typeof result === "object" && "ok" in result && !result.ok) {
        toast.error("Action failed", {
          description: `Mock provider rejected ${action} on ${targetId}.`,
        });
        return;
      }
      toast.success(successMessage ?? "Action recorded", {
        description: `${action} · ${targetId}`,
      });
      onSuccess?.(result ?? undefined);
      onOpenChange(false);
    } catch (err) {
      toast.error("Unexpected error", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="consequential-dialog"
        className="max-w-lg gap-4 border-border/60 p-0"
      >
        <DialogHeader className="border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            {destructive ? (
              <TriangleAlert className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-primary" />
            )}
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Actor" value={session.actorName} />
            <Field label="Role" value={roleLabel} />
            <Field label="Environment" value={<EnvironmentBadge env={session.environment} />} />
            <Field
              label="Action"
              value={<span className="mono text-[11px] text-primary">{action}</span>}
            />
            <Field label="Target" value={target} className="col-span-2" />
            <Field
              label="Target ID"
              value={<span className="mono text-[11px]">{targetId}</span>}
              className="col-span-2"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-md border border-border/60 bg-background/40 p-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Current state
              </span>
              <div className="text-sm text-foreground">{currentState}</div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Proposed state
              </span>
              <div className={cn("text-sm", destructive ? "text-destructive" : "text-primary")}>
                {proposedState}
              </div>
            </div>
          </div>

          {!authorized ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
              <div>
                Not authorized. Requires <span className="mono">{permission}</span>. Switch role to
                proceed.
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason" className="text-xs">
              Reason{" "}
              <span className="text-muted-foreground">(auditable, ≥ {minReasonLength} chars)</span>
            </Label>
            <Textarea
              id="reason"
              data-testid="consequential-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              disabled={!authorized || pending}
              className="text-sm"
            />
          </div>

          {isProduction ? (
            <div className="flex flex-col gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                <StatusBadge tone="destructive">Production</StatusBadge>
                Additional confirmation required
              </div>
              <Label htmlFor="typed-confirm" className="text-[11px] text-muted-foreground">
                Type <span className="mono text-destructive">{requiredTyped}</span> to confirm.
              </Label>
              <Input
                id="typed-confirm"
                data-testid="consequential-typed-confirm"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={requiredTyped}
                disabled={!authorized || pending}
                className="h-8 text-sm"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/60 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            data-testid="consequential-cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={!canSubmit}
            onClick={submit}
            data-testid="consequential-submit"
          >
            {pending ? "Working…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
