import test from 'node:test';
import assert from 'node:assert/strict';
import { localeFromStoredValue, localeLabel, isSupportedLocale } from './locale.ts';

test('accepts exactly the six supported locale codes', () => {
  assert.equal(isSupportedLocale('en'), true);
  assert.equal(isSupportedLocale('zh-CN'), true);
  assert.equal(isSupportedLocale('fr'), false);
});

test('normalizes stored labels and invalid values to a supported locale', () => {
  assert.equal(localeFromStoredValue('简体中文'), 'zh-CN');
  assert.equal(localeFromStoredValue('invalid'), 'en');
  assert.equal(localeLabel('ms'), 'Bahasa Melayu');
});
