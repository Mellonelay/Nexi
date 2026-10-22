import { type AssetCategory } from '../lib/asset-registry.ts';
import { isSupportedLocale } from './locale.ts';
import { UI_MESSAGE_KEYS, type PublicMessageOverrides, type UiMessageKey } from './messages.ts';

export const DEFAULT_PUBLIC_QUOTE_CATEGORIES: AssetCategory[] = ['Crypto', 'Metals', 'Forex', 'Stocks'];
const quoteCategorySet = new Set<string>(DEFAULT_PUBLIC_QUOTE_CATEGORIES);
const messageKeySet = new Set<string>(UI_MESSAGE_KEYS);

export type PublicRouteState = 'public' | 'authenticated' | 'hidden' | 'maintenance';
export type PublicRouteSetting = {
  id: string;
  path: string;
  state: PublicRouteState;
  order: number;
  unavailableMessage?: string;
};
export type PublicBannerScope = 'global' | 'spot' | 'binary' | 'wallets';
export type PublicBanner = {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  scope: PublicBannerScope;
};
export type PublicNavigationDestination = {
  target: string;
  state: PublicRouteState;
  unavailableMessage?: string;
};

const PUBLIC_ROUTE_DEFINITIONS = [
  ['dashboard', '/dashboard'],
  ['spot', '/dashboard/spot'],
  ['binary', '/dashboard/binary'],
  ['wallet', '/dashboard/wallet'],
  ['mining', '/dashboard/mining'],
  ['loans', '/dashboard/loans'],
  ['messages', '/dashboard/messages'],
  ['announcements', '/dashboard/announcement'],
  ['learn', '/dashboard/learn'],
  ['support', '/dashboard/support'],
  ['settings', '/dashboard/settings'],
] as const;
const publicRouteStates = new Set<PublicRouteState>(['public', 'authenticated', 'hidden', 'maintenance']);
const publicBannerScopes = new Set<PublicBannerScope>(['global', 'spot', 'binary', 'wallets']);

export function normalizePublicRoutes(value: unknown): PublicRouteSetting[] {
  const configured = new Map<string, PublicRouteSetting>();
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== 'object' || entry === null) continue;
      const item = entry as Record<string, unknown>;
      const definition = PUBLIC_ROUTE_DEFINITIONS.find(([id, path]) => id === item.id && path === item.path);
      if (!definition || !publicRouteStates.has(item.state as PublicRouteState)) continue;
      const state = item.state as PublicRouteState;
      const message = item.unavailableMessage;
      if (
        (state === 'hidden' || state === 'maintenance') &&
        (typeof message !== 'string' || message.trim().length < 4 || message.length > 300)
      ) continue;
      if (item.order !== undefined && (
        typeof item.order !== 'number' || !Number.isSafeInteger(item.order) || item.order < 1 || item.order > 1000
      )) continue;
      if (configured.has(definition[0])) continue;
      configured.set(definition[0], {
        id: definition[0],
        path: definition[1],
        state,
        order: typeof item.order === 'number' ? item.order : PUBLIC_ROUTE_DEFINITIONS.indexOf(definition) + 1,
        ...(typeof message === 'string' ? { unavailableMessage: message } : {}),
      });
    }
  }
  return PUBLIC_ROUTE_DEFINITIONS.map(([id, path], index) => configured.get(id) ?? {
    id,
    path,
    state: 'public',
    order: index + 1,
  });
}

export function publicRouteForPath(
  pathname: string,
  routes: readonly PublicRouteSetting[],
): PublicRouteSetting | undefined {
  return routes
    .filter((route) => pathname === route.path ||
      (route.path !== '/dashboard' && pathname.startsWith(`${route.path}/`)))
    .sort((left, right) => right.path.length - left.path.length)[0];
}

export function normalizePublicNavigation(
  value: unknown,
  surface: 'bottom' | 'drawer',
  defaults: readonly string[],
  routes: readonly PublicRouteSetting[],
  authenticated: boolean,
): PublicNavigationDestination[] {
  const allowedTargets = new Set(defaults);
  const routeByPath = new Map(routes.map((route) => [route.path, route]));
  const entries = Array.isArray(value)
    ? value
    : defaults.map((target, order) => ({ target, surface, audience: 'public', visible: true, order }));
  return entries.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const item = entry as Record<string, unknown>;
    if (
      item.surface !== surface || typeof item.target !== 'string' || !allowedTargets.has(item.target) ||
      !['public', 'authenticated'].includes(String(item.audience)) || item.visible !== true ||
      typeof item.order !== 'number' || !Number.isSafeInteger(item.order)
    ) return [];
    const route = routeByPath.get(item.target);
    if (route?.state === 'hidden') return [];
    const audience = route?.state === 'authenticated' ? 'authenticated' : item.audience;
    if (audience === 'authenticated' && !authenticated) return [];
    return [{
      target: item.target,
      state: route?.state ?? 'public',
      ...(route?.unavailableMessage ? { unavailableMessage: route.unavailableMessage } : {}),
      order: item.order,
    }];
  })
    .sort((left, right) => left.order - right.order)
    .map(({ target, state, unavailableMessage }) => ({ target, state, ...(unavailableMessage ? { unavailableMessage } : {}) }));
}

export function normalizePublicBanners(
  value: unknown,
  scope: PublicBannerScope,
  now = Date.now(),
): PublicBanner[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(item.id) || ids.has(item.id) ||
      typeof item.message !== 'string' || item.message.trim().length === 0 || item.message.length > 500 ||
      !['info', 'warning', 'critical'].includes(String(item.severity)) || item.active !== true ||
      typeof item.scope !== 'string' || !publicBannerScopes.has(item.scope as PublicBannerScope) ||
      (item.scope !== 'global' && item.scope !== scope)
    ) return [];
    const start = item.startsAt === undefined ? undefined : Date.parse(String(item.startsAt));
    const end = item.endsAt === undefined ? undefined : Date.parse(String(item.endsAt));
    if (
      (start !== undefined && !Number.isFinite(start)) || (end !== undefined && !Number.isFinite(end)) ||
      (start !== undefined && start > now) || (end !== undefined && end <= now) ||
      (start !== undefined && end !== undefined && start >= end)
    ) return [];
    ids.add(item.id);
    return [{
      id: item.id,
      message: item.message,
      severity: item.severity as PublicBanner['severity'],
      scope: item.scope as PublicBannerScope,
    }];
  });
}

export function normalizePublicQuoteCategories(value: unknown): AssetCategory[] {
  if (!Array.isArray(value)) return [...DEFAULT_PUBLIC_QUOTE_CATEGORIES];
  const categories = new Map<AssetCategory, { id: AssetCategory; order: number }>();
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id === 'string' &&
      quoteCategorySet.has(item.id) &&
      item.visible === true &&
      typeof item.order === 'number' &&
      Number.isSafeInteger(item.order) &&
      item.order >= 0 &&
      item.order <= 1000
    ) {
      categories.set(item.id as AssetCategory, { id: item.id as AssetCategory, order: item.order });
    }
  }
  const ordered = [...categories.values()]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((item) => item.id);
  return ordered.length > 0 ? ordered : [...DEFAULT_PUBLIC_QUOTE_CATEGORIES];
}

export function filterQuotePairs<T extends { category: string }>(
  pairs: readonly T[],
  category: AssetCategory,
) {
  return pairs.filter((pair) => pair.category === category);
}

export function normalizePublicLocalization(value: unknown): PublicMessageOverrides {
  if (!Array.isArray(value)) return {};
  const overrides: PublicMessageOverrides = {};
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.key !== 'string' || !messageKeySet.has(item.key)) continue;
    if (typeof item.values !== 'object' || item.values === null || Array.isArray(item.values)) continue;
    for (const [locale, text] of Object.entries(item.values as Record<string, unknown>)) {
      if (!isSupportedLocale(locale) || typeof text !== 'string' || text.trim().length === 0) continue;
      const translations = overrides[locale] ?? (overrides[locale] = {});
      translations[item.key as UiMessageKey] = text;
    }
  }
  return overrides;
}
