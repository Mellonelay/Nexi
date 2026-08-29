import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  submitVariant?: "default" | "destructive" | "outline";
  submitDisabled?: boolean;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
  children: ReactNode;
  side?: "left" | "right";
  widthClassName?: string;
  testId?: string;
}

/** Wraps a right-side sheet with a bottom action bar for consequential edits. */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  badges,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitVariant = "default",
  submitDisabled,
  onSubmit,
  onCancel,
  children,
  side = "right",
  widthClassName = "sm:max-w-lg md:max-w-xl",
  testId = "form-drawer",
}: FormDrawerProps) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) setPending(false);
  }, [open]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled || pending) return;
    setPending(true);
    try {
      await onSubmit();
    } finally {
      setPending(false);
    }
  }

  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        data-testid={testId}
        className={cn("flex w-full flex-col p-0 sm:max-w-lg", widthClassName)}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
            <SheetTitle className="flex flex-wrap items-center gap-2 text-lg text-foreground">
              <span className="truncate">{title}</span>
              {badges}
            </SheetTitle>
            {description ? (
              <SheetDescription className="text-xs text-muted-foreground">
                {description}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-4">{children}</div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-background/95 px-6 py-3 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={pending}
              data-testid={`${testId}-cancel`}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant={submitVariant}
              disabled={submitDisabled || pending}
              data-testid={`${testId}-submit`}
            >
              {pending ? "Working…" : submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
