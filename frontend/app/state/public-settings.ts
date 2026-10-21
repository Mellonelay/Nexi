import { type AssetCategory } from '../lib/asset-registry.ts';
import { isSupportedLocale } from './locale.ts';
import { UI_MESSAGE_KEYS, type PublicMessageOverrides, type UiMessageKey } from './messages.ts';

export const DEFAULT_PUBLIC_QUOTE_CATEGORIES: AssetCategory[] = ['Crypto', 'Metals', 'Forex', 'Stocks'];
const quoteCategorySet = new Set<string>(DEFAULT_PUBLIC_QUOTE_CATEGORIES);
const messageKeySet = new Set<string>(UI_MESSAGE_KEYS);

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
