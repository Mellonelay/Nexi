import { cn } from "@/lib/utils";
import type { Environment } from "@/admin/types";
import { ENV_LABEL } from "@/admin/config/environments";

const TONE: Record<Environment, string> = {
  DEVELOPMENT: "bg-info/15 text-info border-info/40",
  SANDBOX: "bg-warning/15 text-warning border-warning/40",
  PRODUCTION: "bg-destructive/15 text-destructive border-destructive/40",
};

export function EnvironmentBadge({
  env,
  className,
}: {
  env: Environment | "UNSPECIFIED";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        env === "UNSPECIFIED" ? "bg-muted text-muted-foreground border-border" : TONE[env],
        className,
      )}
      title={`Environment: ${env}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {env === "UNSPECIFIED" ? "Unspecified" : ENV_LABEL[env]}
    </span>
  );
}
