import type { ReactNode } from 'react';
import { NexiSurface } from './NexiPrimitives';
import { controlVariants } from './nexi-variants';
import { cn } from '../lib/cn';
import { productStateLabel } from '../lib/product-states';

const stateTone: Record<string, string> = {
  LIVE: 'border-[#48C0CC]/35 bg-[#48C0CC]/10 text-[#48C0CC]',
  CONNECTED: 'border-[#48C0CC]/35 bg-[#48C0CC]/10 text-[#48C0CC]',
  AVAILABLE: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  ACTIVE: 'border-[#98FCE4]/35 bg-[#98FCE4]/10 text-[#98FCE4]',
  PENDING: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
  APPROVED: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  PAID: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  OVERDUE: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
  REJECTED: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
  DRAFT: 'border-slate-400/35 bg-slate-400/10 text-slate-200',
  QUEUED: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
  SENT: 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100',
  DELIVERED: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  READ: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
  UNREAD: 'border-cyan-300/35 bg-cyan-300/10 text-cyan-100',
  ARCHIVED: 'border-slate-400/35 bg-slate-400/10 text-slate-200',
  FAILED: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
  LOADING: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
  SUBMITTING: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
  STALE: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
  DISCONNECTED: 'border-slate-400/35 bg-slate-400/10 text-slate-200',
  DISABLED: 'border-slate-400/35 bg-slate-400/10 text-slate-300',
  UNAVAILABLE: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
  ERROR: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
  CONNECTION_ERROR: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
};

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="nexi-page-shell relative min-h-full min-w-0 overflow-x-clip text-[#F8F6FF]">
      <div aria-hidden="true" className="nexi-atmosphere pointer-events-none absolute inset-0" />
      <div className="relative min-w-0 px-4 py-5 pb-6 sm:px-6 lg:px-8 [&>main]:min-w-0 [&>main>*]:min-w-0">
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="nexi-station-header mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-2xl border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#48C0CC]">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight gradient-text sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C3BBD0]">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <NexiSurface tier="raised" className={className}>{children}</NexiSurface>;
}

export function PanelHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-[#F2ECFA]">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-[#8C8299]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ state }: { state: string }) {
  const label = productStateLabel(state);
  return <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-semibold tracking-[0.04em] ${stateTone[state] ?? stateTone.UNAVAILABLE}`}>{label}</span>;
}

export function DataStatePanel({ state, title = 'Data is not available right now', message = 'Try again shortly.' }: { state: string; title?: string; message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#49335E] bg-[#0B0711] p-5" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3"><StatusBadge state={state} /><h3 className="text-sm font-semibold text-[#F2ECFA]">{title}</h3></div>
      <p className="mt-3 text-sm leading-6 text-[#8C8299]">{message}</p>
    </div>
  );
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="nexi-execution-surface min-w-0 rounded-xl border border-[var(--nexi-border-subtle)] p-4"><p className="text-xs uppercase tracking-[0.12em] text-[#8C8299]">{label}</p><p className="nexi-data mt-2 truncate font-mono text-lg text-[#48C0CC]">{value}</p>{hint && <p className="mt-1 text-xs text-[#8C8299]">{hint}</p>}</div>;
}

export function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn(controlVariants({ intent: active ? 'primary' : 'secondary', size: 'compact', selected: active }), 'shrink-0')} aria-pressed={active}>{children}</button>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-sm text-[#C3BBD0]"><span className="mb-2 block font-semibold text-[#F2ECFA]">{label}</span>{children}{hint && <span className="mt-2 block text-xs leading-5 text-[#8C8299]">{hint}</span>}</label>;
}

export const inputClass = 'nexi-input px-3 text-sm placeholder:text-[#8C8299]';

export function PrimaryButton({ children, disabled = false, type = 'button', onClick }: { children: ReactNode; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={controlVariants({ intent: 'primary' })}>{children}</button>;
}

export function SecondaryButton({ children, disabled = false, onClick }: { children: ReactNode; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={controlVariants({ intent: 'secondary' })}>{children}</button>;
}
