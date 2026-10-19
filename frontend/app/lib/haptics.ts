export type HapticIntent = 'selection' | 'confirm' | 'warning';

const HAPTIC_MS: Record<HapticIntent, number> = {
  selection: 8,
  confirm: 14,
  warning: 22,
};

export function hapticFeedback(intent: HapticIntent = 'selection'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate(HAPTIC_MS[intent]);
}
