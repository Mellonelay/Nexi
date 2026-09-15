'use client';

import { cloneElement, useRef, type ReactElement, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/cn';

// One focus/escape/scroll owner for public sheets; the mobile dock remains visible.
export default function ModalSurface({ open, onClose, title, children, align = 'center' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactElement<{ children?: ReactNode; className?: string }>;
  align?: 'center' | 'left' | 'right';
}) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const bounds = 'fixed inset-x-0 top-0 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-0';
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={`${bounds} z-[80] bg-black/70 backdrop-blur-sm`} />
      <div className={`${bounds} pointer-events-none z-[81] flex min-h-0 p-2 sm:p-4 ${align === 'left' ? 'items-stretch justify-start' : align === 'right' ? 'items-stretch justify-end' : 'items-center justify-center'}`}>
        <Dialog.Content asChild aria-describedby={undefined}
          onOpenAutoFocus={() => { previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
          onCloseAutoFocus={(event) => { event.preventDefault(); previousFocus.current?.focus(); }}>
          {cloneElement(children, { className: cn(children.props.className, 'pointer-events-auto max-h-full overflow-y-auto overscroll-contain') },
            <Dialog.Title className="sr-only">{title}</Dialog.Title>, children.props.children)}
        </Dialog.Content>
      </div>
    </Dialog.Portal>
  </Dialog.Root>;
}
