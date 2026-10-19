import { Lock } from "lucide-react";
export function UnauthorizedState({ requiredPermission }: { requiredPermission?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-border/60 bg-background/40 px-6 py-10 text-center">
      <Lock className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium text-foreground">Not authorized</div>
      <div className="max-w-md text-xs text-muted-foreground">
        Your current role does not have access to this area.
        {requiredPermission ? (
          <>
            {" "}
            Requires <span className="mono text-foreground">{requiredPermission}</span>.
          </>
        ) : null}
      </div>
    </div>
  );
}
