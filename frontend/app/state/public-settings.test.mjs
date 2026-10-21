import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_REGISTRY } from '../lib/asset-registry.ts';
import { messageFor } from './messages.ts';
import { normalizePublicLocalization, normalizePublicQuoteCategories, filterQuotePairs } from './public-settings.ts';

test('normalizes Quotes categories to the four existing catalog categories', () => {
  const categories = normalizePublicQuoteCategories([
    { id: 'Stocks', visible: true, order: 3 },
    { id: 'Crypto', visible: false, order: 0 },
    { id: 'unsupported', visible: true, order: 1 },
    { id: 'Forex', visible: true, order: 2 },
  ]);
  assert.deepEqual(categories, ['Forex', 'Stocks']);
  assert.equal(ASSET_REGISTRY.length, 53);
  assert.equal(filterQuotePairs(ASSET_REGISTRY, 'Forex').length, 9);
});

test('uses the built-in Quotes categories for absent, malformed, or fully hidden config', () => {
  assert.deepEqual(normalizePublicQuoteCategories(null), ['Crypto', 'Metals', 'Forex', 'Stocks']);
  assert.deepEqual(normalizePublicQuoteCategories({}), ['Crypto', 'Metals', 'Forex', 'Stocks']);
  assert.deepEqual(normalizePublicQuoteCategories([{ id: 'Crypto', visible: false, order: 1 }]), ['Crypto', 'Metals', 'Forex', 'Stocks']);
});

test('applies only existing Public message keys and supported non-empty translations', () => {
  const overrides = normalizePublicLocalization([
    { key: 'dashboard', values: { en: 'Home', fr: 'Accueil', 'zh-CN': '首页' } },
    { key: 'internalSecret', values: { en: 'hidden' } },
    { key: 'spot', values: 'invalid' },
    { key: 'wallet', values: { ms: '', ru: 'Кошелёк' } },
  ]);
  assert.equal(messageFor('en', 'dashboard', overrides), 'Home');
  assert.equal(messageFor('zh-CN', 'dashboard', overrides), '首页');
  assert.equal(messageFor('en', 'dashboard', {}), 'Dashboard');
  assert.equal(messageFor('ms', 'wallet', overrides), 'Dompet');
  assert.equal(messageFor('ru', 'wallet', overrides), 'Кошелёк');
});
