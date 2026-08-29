import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DetailDrawerField {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}

export interface DetailDrawerSection {
  id: string;
  title: string;
  description?: string;
  fields?: DetailDrawerField[];
  content?: ReactNode;
}

export interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  sections: DetailDrawerSection[];
  actions?: ReactNode;
  side?: "left" | "right";
  widthClassName?: string;
}

/** Read-only detail overlay used across identity/finance/markets pages. */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  badges,
  sections,
  actions,
  side = "right",
  widthClassName = "sm:max-w-xl md:max-w-2xl",
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        data-testid="detail-drawer"
        className={cn("w-full overflow-y-auto p-0 sm:max-w-xl", widthClassName)}
      >
        <div className="flex flex-col gap-0">
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <div className="flex flex-col gap-2">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-lg text-foreground">
                <span className="truncate">{title}</span>
                {badges}
              </SheetTitle>
              {subtitle ? (
                <SheetDescription className="text-xs text-muted-foreground">
                  {subtitle}
                </SheetDescription>
              ) : null}
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-6 py-5">
            {sections.map((s) => (
              <section
                key={s.id}
                data-testid={`detail-section-${s.id}`}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.title}
                  </h3>
                  {s.description ? (
                    <p className="text-xs text-muted-foreground/80">{s.description}</p>
                  ) : null}
                </div>
                {s.fields && s.fields.length > 0 ? (
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    {s.fields.map((f, i) => (
                      <div
                        key={`${s.id}-f-${i}`}
                        className={cn("flex flex-col gap-0.5", f.className)}
                      >
                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {f.label}
                        </dt>
                        <dd
                          className={cn(
                            "text-sm text-foreground break-words",
                            f.mono && "mono text-xs",
                          )}
                        >
                          {f.value ?? <span className="text-muted-foreground">—</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {s.content}
              </section>
            ))}
          </div>

          {actions ? (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur">
              {actions}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
