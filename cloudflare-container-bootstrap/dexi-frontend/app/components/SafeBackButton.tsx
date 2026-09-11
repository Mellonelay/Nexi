'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { isSafeNexiRoute, previousSafeRoute } from '../lib/nexi-navigation';

const HISTORY_KEY = 'nexi:dashboard-route-history';

function readHistory() {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((route): route is string => typeof route === 'string' && isSafeNexiRoute(route)) : [];
  } catch {
    return [];
  }
}

function writeHistory(history: string[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
  } catch {
    // Private browsing may deny session storage; the deterministic fallback still works.
  }
}

function currentRoute(pathname: string, search: string) {
  return `${pathname}${search ? `?${search}` : ''}`;
}

export function RouteHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const route = currentRoute(pathname, search);

  useEffect(() => {
    if (!isSafeNexiRoute(route)) return;
    const history = readHistory();
    if (history.at(-1) === route) return;
    if (history.at(-2) === route) {
      writeHistory(history.slice(0, -1));
      return;
    }
    writeHistory([...history, route]);
  }, [route]);

  return null;
}

export default function SafeBackButton({
  fallback = '/dashboard',
  label = 'Back',
  className = '',
  onBack,
  showLabel = false,
}: {
  fallback?: string;
  label?: string;
  className?: string;
  onBack?: () => void;
  showLabel?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = currentRoute(pathname, searchParams.toString());

  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const result = previousSafeRoute(readHistory(), route, fallback);
    writeHistory(result.history);
    router.replace(result.target);
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={goBack}
      className={`nexi-interactive inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-300/15 text-[#C3BBD0] transition hover:border-violet-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nexi-focus)] ${className}`}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className={showLabel ? '' : 'sr-only'}>{label}</span>
    </button>
  );
}
