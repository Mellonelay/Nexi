import { useMemo } from "react";
import type { AuditEvent } from "@/admin/types";
import { EnvironmentBadge } from "@/admin/components/EnvironmentBadge";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { useAdminQuery } from "@/admin/data/context";
import { LoadingSkeleton, EmptyState } from "@/admin/components/states";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface AuditTimelineProps {
  /** Filter to events whose target matches this id (e.g. usr_1001). */
  targetId?: string;
  /** Filter to events whose action starts with this namespace (e.g. "users.", "kyc."). */
  actionPrefix?: string;
  /** Provide events directly instead of querying provider. */
  events?: AuditEvent[];
  /** Maximum events to show. */
  limit?: number;
  /** Optional heading override. */
  heading?: string;
  className?: string;
}

/** Shared timeline of audit events. Used inside detail drawers and route pages. */
export function AuditTimeline({
  targetId,
  actionPrefix,
  events,
  limit = 20,
  heading = "Audit timeline",
  className,
}: AuditTimelineProps) {
  const shouldQuery = !events;
  const q = useAdminQuery((p) => p.listAudit(), [shouldQuery]);

  const filtered = useMemo(() => {
    let list = events ?? q.data ?? [];
    if (targetId) list = list.filter((e) => e.target === targetId);
    if (actionPrefix) list = list.filter((e) => e.action.startsWith(actionPrefix));
    return list.slice(0, limit);
  }, [events, q.data, targetId, actionPrefix, limit]);

  if (shouldQuery && q.loading) {
    return <LoadingSkeleton rows={3} />;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} data-testid="audit-timeline">
      {heading ? (
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {heading}
          </h3>
          <span className="mono text-[10px] text-muted-foreground">
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No audit events yet"
          description="Consequential actions on this target will appear here."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="surface-1 rounded-md border border-border/60 p-3"
              data-testid={`audit-event-${e.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {e.result === "ok" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="mono text-xs text-primary">{e.action}</span>
                  <EnvironmentBadge env={e.environment} />
                  {e.result !== "ok" ? <StatusBadge tone="destructive">Failed</StatusBadge> : null}
                </div>
                <span className="mono text-[10px] text-muted-foreground">
                  {new Date(e.ts).toLocaleString()}
                </span>
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                <span className="text-foreground">{e.actor}</span>
                <span className="mx-1">·</span>
                <span className="mono">{e.role}</span>
                <span className="mx-1">·</span>
                target <span className="mono text-foreground/80">{e.target}</span>
              </div>

              {e.reason ? (
                <p className="mt-1 text-xs text-foreground/80">
                  <span className="text-muted-foreground">Reason: </span>
                  {e.reason}
                </p>
              ) : null}

              {e.before !== undefined || e.after !== undefined ? (
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <StateBlock label="Before" value={e.before} />
                  <StateBlock label="After" value={e.after} />
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span>
                  audit <span className="mono text-foreground/80">{e.id}</span>
                </span>
                <span>
                  correlation <span className="mono text-foreground/80">{e.correlationId}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StateBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded border border-border/40 bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <pre className="mono mt-1 max-h-40 overflow-auto text-[10px] leading-snug text-foreground/85">
        {value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
