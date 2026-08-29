import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "destructive" | "info";
  icon?: ReactNode;
  className?: string;
}) {
  const toneRing = {
    default: "",
    primary: "ring-1 ring-primary/30",
    success: "ring-1 ring-success/30",
    warning: "ring-1 ring-warning/30",
    destructive: "ring-1 ring-destructive/30",
    info: "ring-1 ring-info/30",
  }[tone];

  return (
    <div className={cn("surface-1 rounded-lg border border-border/60 p-4", toneRing, className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
      </div>
      <div className="mono mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
