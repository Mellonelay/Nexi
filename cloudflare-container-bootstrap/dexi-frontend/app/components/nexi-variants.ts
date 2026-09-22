import { cva } from 'class-variance-authority';

export const surfaceVariants = cva(
  'min-w-0 border text-[var(--nexi-text)]',
  {
    variants: {
      tier: {
        shell: 'nexi-shell-glass border-[var(--nexi-border-subtle)]',
        raised: 'nexi-raised-panel border-[var(--nexi-border-raised)]',
        execution: 'nexi-execution-surface border-[var(--nexi-border-subtle)]',
        row: 'nexi-market-row border-[var(--nexi-border-subtle)]',
      },
      radius: {
        compact: 'rounded-lg',
        control: 'rounded-xl',
        panel: 'rounded-2xl',
        sheet: 'rounded-[20px]',
      },
      padding: {
        none: '',
        compact: 'p-3',
        default: 'p-4 sm:p-5',
        spacious: 'p-5 sm:p-6',
      },
    },
    defaultVariants: { tier: 'raised', radius: 'panel', padding: 'default' },
  },
);

export const controlVariants = cva(
  'nexi-interactive nexi-ripple inline-flex min-h-11 items-center justify-center font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      intent: {
        primary: 'border border-violet-300/25 bg-[linear-gradient(135deg,#6D41FF,#9B55FF)] text-white shadow-[var(--nexi-shadow-cta)] hover:brightness-[1.08]',
        secondary: 'border border-[var(--nexi-border-raised)] bg-[var(--nexi-surface-elevated)] text-[var(--nexi-text)]',
        quiet: 'border border-transparent bg-transparent text-[var(--nexi-text-secondary)] hover:bg-white/[0.045] hover:text-white',
        data: 'border border-cyan-300/20 bg-cyan-300/[0.06] text-[var(--nexi-cyan)]',
        danger: 'border border-rose-300/25 bg-rose-400/10 text-[var(--nexi-negative-soft)]',
      },
      size: {
        compact: 'min-h-9 rounded-lg px-3 text-xs',
        default: 'rounded-xl px-4 text-sm',
        icon: 'h-11 w-11 rounded-xl p-0',
      },
      selected: {
        true: 'ring-1 ring-inset ring-violet-300/30 shadow-[0_0_24px_rgba(139,92,246,.16)]',
        false: '',
      },
    },
    defaultVariants: { intent: 'secondary', size: 'default', selected: false },
  },
);
