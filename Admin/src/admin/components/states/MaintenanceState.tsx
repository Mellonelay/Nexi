import { Wrench } from "lucide-react";
export function MaintenanceState({ description }: { description?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-6 py-10 text-center">
      <Wrench className="h-6 w-6 text-warning" />
      <div className="text-sm font-medium text-foreground">Maintenance in progress</div>
      <div className="max-w-md text-xs text-muted-foreground">
        {description ?? "This surface is temporarily unavailable."}
      </div>
    </div>
  );
}
