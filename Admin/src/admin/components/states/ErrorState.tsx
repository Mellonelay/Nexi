import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description ? (
        <div className="max-w-md text-xs text-muted-foreground">{description}</div>
      ) : null}
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
