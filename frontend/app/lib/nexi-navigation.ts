const primaryRoutes = new Set([
  'dashboard',
  'spot',
  'binary',
  'wallet',
  'mining',
  'loans',
  'support',
  'announcement',
  'learn',
  'messages',
  'settings',
]);

export function isSafeNexiRoute(route: string) {
  if (!route.startsWith('/dashboard/') && route !== '/dashboard') return false;
  const path = route.split(/[?#]/, 1)[0];
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'dashboard') return true;
  if (parts.length === 2 && primaryRoutes.has(parts[1])) return true;
  return parts.length === 3 && parts[1] === 'asset' && Boolean(parts[2]);
}

export function previousSafeRoute(history: string[], current: string, fallback: string) {
  const safeFallback = isSafeNexiRoute(fallback) ? fallback : '/dashboard';
  const hasSafePrevious = history.at(-1) === current && isSafeNexiRoute(history.at(-2) ?? '');
  const target = hasSafePrevious
    ? history.at(-2) as string
    : safeFallback;
  return {
    target,
    history: hasSafePrevious ? history.slice(0, -1) : [current],
  };
}
