import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "destructive" | "primary";

const TONE: Record<StatusTone, string> = {
  neutral: "bg-muted/60 text-muted-foreground border-border",
  info: "bg-info/12 text-info border-info/40",
  success: "bg-success/12 text-success border-success/40",
  warning: "bg-warning/12 text-warning border-warning/40",
  destructive: "bg-destructive/12 text-destructive border-destructive/40",
  primary: "bg-primary/15 text-primary border-primary/40",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot = true,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
