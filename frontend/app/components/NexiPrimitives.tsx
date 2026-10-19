import type { VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { surfaceVariants } from './nexi-variants';

export type SurfaceProps = HTMLAttributes<HTMLElement>
  & VariantProps<typeof surfaceVariants>
  & { as?: 'section' | 'div' | 'aside'; children: ReactNode };
export function NexiSurface({
  as: Component = 'section',
  tier,
  radius,
  padding,
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Component
      className={cn(surfaceVariants({ tier, radius, padding }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
