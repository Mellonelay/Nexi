import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-background/40 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground/60">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description ? (
        <div className="max-w-md text-xs text-muted-foreground">{description}</div>
      ) : null}
      {action}
    </div>
  );
}
