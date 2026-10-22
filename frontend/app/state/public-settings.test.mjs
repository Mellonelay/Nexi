import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_REGISTRY } from '../lib/asset-registry.ts';
import { messageFor } from './messages.ts';
import {
  normalizePublicBanners,
  normalizePublicLocalization,
  normalizePublicNavigation,
  publicRouteForPath,
  normalizePublicQuoteCategories,
  normalizePublicRoutes,
  filterQuotePairs,
} from './public-settings.ts';

test('normalizes Quotes categories to the four existing catalog categories', () => {
  const categories = normalizePublicQuoteCategories([
    { id: 'Stocks', visible: true, order: 3 },
    { id: 'Crypto', visible: false, order: 0 },
    { id: 'unsupported', visible: true, order: 1 },
    { id: 'Forex', visible: true, order: 2 },
  ]);
  assert.deepEqual(categories, ['Forex', 'Stocks']);
  assert.deepEqual(normalizePublicQuoteCategories([
    { id: 'Stocks', visible: true, order: 1 },
    { id: 'Crypto', visible: false, order: 2 },
  ]), ['Stocks']);
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

test('normalizes route state only for the existing Public dashboard paths', () => {
  const routes = normalizePublicRoutes([
    { id: 'wallet', path: '/dashboard/wallet', state: 'maintenance', unavailableMessage: 'Wallet maintenance', order: 4 },
    { id: 'spot', path: '/admin', state: 'hidden', order: 2 },
    { id: 'unknown', path: '/dashboard/unknown', state: 'hidden', order: 3 },
  ]);
  assert.equal(routes.length, 11);
  assert.equal(routes.find((route) => route.id === 'wallet').state, 'maintenance');
  assert.equal(routes.find((route) => route.id === 'wallet').unavailableMessage, 'Wallet maintenance');
  assert.equal(routes.find((route) => route.id === 'spot').state, 'public');
  assert.equal(routes.find((route) => route.id === 'dashboard').state, 'public');
});

test('applies a configured route state to its nested Public pages, but not sibling paths', () => {
  const routes = normalizePublicRoutes([
    { id: 'wallet', path: '/dashboard/wallet', state: 'maintenance', unavailableMessage: 'Wallet maintenance', order: 4 },
  ]);
  assert.equal(publicRouteForPath('/dashboard/wallet/deposit', routes)?.id, 'wallet');
  assert.equal(publicRouteForPath('/dashboard/wallets', routes), undefined);
  assert.equal(publicRouteForPath('/dashboard/spot', routes)?.id, 'spot');
});

test('filters route navigation without replacing application authorization', () => {
  const routes = normalizePublicRoutes([
    { id: 'wallet', path: '/dashboard/wallet', state: 'maintenance', unavailableMessage: 'Wallet maintenance', order: 4 },
    { id: 'learn', path: '/dashboard/learn', state: 'hidden', unavailableMessage: 'Learn hidden', order: 9 },
    { id: 'messages', path: '/dashboard/messages', state: 'authenticated', order: 7 },
  ]);
  const items = normalizePublicNavigation([
    { target: '/dashboard/wallet', surface: 'drawer', audience: 'public', visible: true, order: 1 },
    { target: '/dashboard/learn', surface: 'drawer', audience: 'public', visible: true, order: 2 },
    { target: '/dashboard/messages', surface: 'drawer', audience: 'public', visible: true, order: 3 },
  ], 'drawer', ['/dashboard/wallet', '/dashboard/learn', '/dashboard/messages'], routes, false);
  assert.deepEqual(items, [
    { target: '/dashboard/wallet', state: 'maintenance', unavailableMessage: 'Wallet maintenance' },
  ]);
});

test('normalizes active Public banners for their placement and preserves saved order', () => {
  const banners = normalizePublicBanners([
    { id: 'first', message: 'Market notice', severity: 'warning', active: true, scope: 'spot' },
    { id: 'other', message: 'Binary notice', severity: 'info', active: true, scope: 'binary' },
    { id: 'expired', message: 'Old notice', severity: 'critical', active: true, scope: 'global', endsAt: '2020-01-01T00:00:00.000Z' },
    { id: 'inactive', message: 'Disabled', severity: 'info', active: false, scope: 'spot' },
    { id: 'external', message: 'Bad scope', severity: 'info', active: true, scope: 'admin' },
  ], 'spot', Date.parse('2026-10-22T00:00:00.000Z'));
  assert.deepEqual(banners, [
    { id: 'first', message: 'Market notice', severity: 'warning', scope: 'spot' },
  ]);
  assert.deepEqual(normalizePublicBanners(null, 'spot'), []);
});
